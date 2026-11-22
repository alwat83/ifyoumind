import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import type { CallableRequest } from 'firebase-functions/v2/https';
import { authorizeOrganization, requireIdentity } from './authorization';
import type { MembershipReader } from './authorization';
import { renderExplanation, selectExplanationLead } from './openai-explanation';

const key = defineSecret('OPENAI_API_KEY');

export const EXPLANATION_LIMITS = { perUserPerDay: 3, globalPerDay: 20, globalPerMonth: 200 } as const;

function stagingServiceAccount(env: NodeJS.ProcessEnv): string | undefined {
  const project = env.GCLOUD_PROJECT;
  if (!project || project !== env.SYNTHETIC_OPENAI_STAGING_PROJECT ||
      project === 'ifyoumind-473fe' || project.startsWith('demo-')) return undefined;
  return `synthetic-openai@${project}.iam.gserviceaccount.com`;
}

export function isSyntheticOpenAIEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ENABLE_SYNTHETIC_OPENAI_EXPLANATION === 'true' && Boolean(stagingServiceAccount(env)) &&
    env.FUNCTIONS_EMULATOR !== 'true';
}

// Server-only collection. Each attempt reserves its full allowance before either provider call.
// Fixed document IDs bound storage. Replacing the counters never records report content.
export async function reserveExplanation(uid: string, now = new Date()): Promise<boolean> {
  const day = now.toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const collection = getFirestore().collection('internalExplanationQuota');
  const global = collection.doc('global');
  const user = collection.doc('user-' + createHash('sha256').update(uid).digest('hex'));
  return getFirestore().runTransaction(async tx => {
    const [globalSnapshot, userSnapshot] = await tx.getAll(global, user);
    const g = globalSnapshot.data();
    const u = userSnapshot.data();
    // Refuse stale clock/transaction retries that would reset a newer window.
    if ((g && (g.day > day || g.month > month)) || (u && u.day > day)) return false;
    const dayCount = g?.day === day ? g.dayCount : 0;
    const monthCount = g?.month === month ? g.monthCount : 0;
    const userCount = u?.day === day ? u.count : 0;
    if (![dayCount, monthCount, userCount].every(n => Number.isSafeInteger(n) && n >= 0) ||
        dayCount >= EXPLANATION_LIMITS.globalPerDay || monthCount >= EXPLANATION_LIMITS.globalPerMonth ||
        userCount >= EXPLANATION_LIMITS.perUserPerDay) return false;
    tx.set(global, { day, month, dayCount: dayCount + 1, monthCount: monthCount + 1 });
    tx.set(user, { day, count: userCount + 1 });
    return true;
  });
}

type Dependencies = {
  readMembership: MembershipReader;
  isEnabled: () => boolean;
  readKey: () => string;
  reserve: typeof reserveExplanation;
  select: typeof selectExplanationLead;
};

export async function explainSyntheticMarketRequest(request: Pick<CallableRequest<unknown>, 'auth' | 'data'>, deps: Dependencies) {
  const uid = requireIdentity(request.auth?.uid);
  if (request.auth?.token.email_verified !== true || request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Internal reviewer access required.');
  }
  const data = request.data as { organizationId?: unknown; useProvider?: unknown } | undefined;
  const fields = data && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [];
  if (!data || !fields.includes('organizationId') ||
      fields.some(field => field !== 'organizationId' && (field !== 'useProvider' || data.useProvider !== true))) {
    throw new HttpsError('invalid-argument', 'Supply an organization ID and optionally opt in to the synthetic provider call.');
  }
  const scope = await authorizeOrganization(uid, data.organizationId, deps.readMembership, ['owner', 'admin']);
  const fallback = (reason: 'disabled' | 'not-requested' | 'limit' | 'unavailable') => ({
    ...renderExplanation('households', 'deterministic'), reason,
  });
  try {
    if (!deps.isEnabled()) return fallback('disabled');
    if (!fields.includes('useProvider') || !scope.organizationId.startsWith('synthetic-')) return fallback('not-requested');
    const apiKey = deps.readKey();
    if (!apiKey) return fallback('unavailable');
    if (!await deps.reserve(uid)) return fallback('limit');
    const selection = await deps.select(apiKey);
    return selection ? { ...renderExplanation(selection.lead, 'openai'), usage: selection.usage } : fallback('unavailable');
  } catch {
    return fallback('unavailable');
  }
}

export const explainSyntheticMarket = onCall(
  { secrets: [key], timeoutSeconds: 15, maxInstances: 2, concurrency: 1, serviceAccount: stagingServiceAccount(process.env) },
  request => explainSyntheticMarketRequest(request, {
    readMembership: async (organizationId, uid) => (await getFirestore().collection('intelligenceOrganizations')
      .doc(organizationId).collection('members').doc(uid).get()).data(),
    isEnabled: isSyntheticOpenAIEnabled,
    readKey: () => key.value().trim(),
    reserve: reserveExplanation,
    select: selectExplanationLead,
  }),
);
