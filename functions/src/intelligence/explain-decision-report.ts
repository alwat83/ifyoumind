import { createHash } from 'node:crypto';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, CallableRequest } from 'firebase-functions/v2/https';
import { ProviderDiagnostic } from './openai-explanation';
import { authorizeOrganization, MembershipReader } from './authorization';
import { deterministicReportExplanation, explainReportEvidence, visibleReportEvidence, renderReportExplanation,
  reportExplanationEnabled, REPORT_AI_CONSENT, REPORT_AI_LIMITS, ReportPacket, validReportSelection } from './report-explanation';

const apiKey = defineSecret('OPENAI_API_KEY');
const store = () => getFirestore().collection('internalReportExplanation');
const jobId = (organizationId: string, projectId: string, digest: string) => createHash('sha256').update(JSON.stringify([organizationId, projectId, digest])).digest('hex');

/** PR96 quota pattern plus an atomic per-evidence job latch. Never retry an uncertain provider attempt. */
export async function reserveReportExplanation(organizationId: string, projectId: string, uid: string, packet: ReportPacket, now = new Date()) {
  const db = getFirestore(), day = now.toISOString().slice(0, 10), month = day.slice(0, 7);
  const global = store().doc('global'), user = store().doc('user-' + createHash('sha256').update(uid).digest('hex'));
  const job = store().doc('job-' + jobId(organizationId, projectId, packet.digest));
  const org = db.collection('intelligenceOrganizations').doc(organizationId);
  return db.runTransaction(async tx => {
    const [gSnap, uSnap, jSnap, pSnap, memberSnap] = await tx.getAll(global, user, job, org.collection('marketProjects').doc(projectId), org.collection('members').doc(uid));
    const p = pSnap.data(), member = memberSnap.data();
    if (!p || visibleReportEvidence(p)?.digest !== packet.digest || member?.status !== 'active' || !['owner', 'admin', 'viewer'].includes(member.role)) return { state: 'denied' as const };
    const prior = jSnap.data();
    if (prior) return prior.state === 'complete' && validReportSelection(prior.selection, packet)
      ? { state: 'cached' as const, selection: prior.selection } : { state: 'previous-attempt' as const };
    const g = gSnap.data(), u = uSnap.data();
    const count = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
    if ((g && (typeof g.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(g.day) || typeof g.month !== 'string' ||
        g.day.slice(0, 7) !== g.month || !count(g.dayCount) || !count(g.monthCount) || !count(g.reservedMicroUsd) ||
        g.reservedMicroUsd !== g.monthCount * REPORT_AI_LIMITS.reservedMicroUsd || g.reservedMicroUsd > REPORT_AI_LIMITS.monthlyMicroUsd)) ||
        (u && (typeof u.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(u.day) || !count(u.count)))) return { state: 'limit' as const };
    if ((g && (g.day > day || g.month > month)) || (u && u.day > day)) return { state: 'limit' as const };
    const dayCount = g?.day === day ? g.dayCount : 0, monthCount = g?.month === month ? g.monthCount : 0, userCount = u?.day === day ? u.count : 0;
    if (![dayCount, monthCount, userCount].every(n => Number.isSafeInteger(n) && n >= 0) || dayCount >= REPORT_AI_LIMITS.globalDay || monthCount >= REPORT_AI_LIMITS.globalMonth || userCount >= REPORT_AI_LIMITS.userDay ||
        (monthCount + 1) * REPORT_AI_LIMITS.reservedMicroUsd > REPORT_AI_LIMITS.monthlyMicroUsd) return { state: 'limit' as const };
    tx.set(global, { day, month, dayCount: dayCount + 1, monthCount: monthCount + 1, reservedMicroUsd: (monthCount + 1) * REPORT_AI_LIMITS.reservedMicroUsd });
    tx.set(user, { day, count: userCount + 1 });
    tx.create(job, { state: 'reserved', evidenceDigest: packet.digest, consentVersion: REPORT_AI_CONSENT, createdAt: FieldValue.serverTimestamp() });
    return { state: 'reserved' as const };
  }, { maxAttempts: 3 });
}

type Dependencies = {
  readMembership: MembershipReader;
  readProject: (organizationId: string, projectId: string) => Promise<Record<string, unknown> | undefined>;
  enabled: (organizationId: string) => boolean;
  readKey: () => string;
  reserve: typeof reserveReportExplanation;
  generate: typeof explainReportEvidence;
  finish: (organizationId: string, projectId: string, digest: string, result: Awaited<ReturnType<typeof explainReportEvidence>>) => Promise<void>;
};
export async function explainDecisionReportRequest(request: Pick<CallableRequest<unknown>, 'auth' | 'data'>, deps: Dependencies) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in to read your report.');
  if (request.auth?.token.email_verified !== true) throw new HttpsError('permission-denied', 'Verify your email first.');
  const d = request.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== 'object' || Array.isArray(d) || Object.keys(d).sort().join(',') !== 'consent,organizationId,projectId' ||
      d.consent !== REPORT_AI_CONSENT || typeof d.projectId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(d.projectId)) {
    throw new HttpsError('invalid-argument', 'Explicit consent and existing saved findings are required.');
  }
  // Explaining already-readable evidence grants no decision-write or billing permission.
  const scope = await authorizeOrganization(uid, d.organizationId, deps.readMembership);
  const project = await deps.readProject(scope.organizationId, d.projectId);
  if (!project) throw new HttpsError('not-found', 'Report not found.');
  const packet = visibleReportEvidence(project);
  if (!packet) throw new HttpsError('failed-precondition', 'A verified primary-city evidence packet is required.');
  const fallback = (reason: string) => ({ ...deterministicReportExplanation(packet), reason });
  if (!deps.enabled(scope.organizationId)) return fallback('disabled');
  let reserved = false;
  try {
    const key = deps.readKey();
    if (!key) return fallback('unavailable');
    const reservation = await deps.reserve(scope.organizationId, d.projectId, uid, packet);
    if (reservation.state === 'denied') throw new HttpsError('permission-denied', 'Report access changed. Reload your account.');
    if (reservation.state === 'cached') return renderReportExplanation(packet, reservation.selection, 'openai');
    if (reservation.state !== 'reserved') return fallback(reservation.state);
    reserved = true;
    const result = await deps.generate(packet, key);
    await deps.finish(scope.organizationId, d.projectId, packet.digest, result);
    return result ? { ...renderReportExplanation(packet, result.selection, 'openai'), usage: result.usage, model: result.model } : fallback('unavailable');
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    // Keep a reserved latch after an uncertain request/write. Never log private content or retry a paid request.
    return fallback(reserved ? 'uncertain-attempt' : 'unavailable');
  }
}

export const explainDecisionReport = onCall({ secrets: [apiKey], timeoutSeconds: 20, maxInstances: 2, concurrency: 1,
  serviceAccount: process.env.REPORT_AI_RUNTIME_SERVICE_ACCOUNT }, request => {
  let diagnostic: ProviderDiagnostic | undefined;
  return explainDecisionReportRequest(request, {
    readMembership: async (org, uid) => (await getFirestore().collection('intelligenceOrganizations').doc(org).collection('members').doc(uid).get()).data(),
    readProject: async (org, project) => (await getFirestore().collection('intelligenceOrganizations').doc(org).collection('marketProjects').doc(project).get()).data(),
    enabled: org => reportExplanationEnabled(process.env,org), readKey: () => apiKey.value().trim(), reserve: reserveReportExplanation,
    generate: (packet, key) => explainReportEvidence(packet, key, fetch, value => { diagnostic = value; }),
    finish: async (org, project, digest, result) => { await store().doc('job-' + jobId(org, project, digest)).update({ state: result ? 'complete' : 'failed',
      ...(result ? { selection: result.selection, usage: result.usage, model: result.model } : {}), ...(diagnostic ? { diagnostic } : {}), finishedAt: FieldValue.serverTimestamp() }); },
  });
});
