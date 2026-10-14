// Usage limits for the universal-data functions (datasets, observations, analysis, ask).
// Before these limits a free account could create unlimited datasets and observations, and one
// askUniversalIntelligence call could read about 50,000 documents. Every limit below is a hard
// server-side bound; the client cannot raise it.
import { CollectionReference, DocumentReference, FieldValue, Transaction, getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

export const UNIVERSAL_LIMITS = Object.freeze({
  /** Datasets one workspace may hold. */
  datasetsPerWorkspace: 50,
  /** Observations one dataset may hold (also bounds every count() and per-dataset read). */
  observationsPerDataset: 5000,
  /** Datasets listed per call. */
  listDatasets: 50,
  /** Other datasets an Ask question is compared against (most recently updated first). */
  askCandidates: 12,
  /** Dataset metadata documents Ask reads to choose a target. */
  askMetadata: 50,
  /** Cloud Run instances per function: caps how fast any abuse can spend. */
  maxInstances: 10,
});

/** Calls allowed per signed-in user per UTC day, per action. */
export const DAILY_QUOTAS = Object.freeze({
  createDataset: 100,
  writeObservations: 200,
  analyze: 200,
  ask: 100,
  seedDemo: 5,
  /** listUniversalDatasets, getUniversalDataset and getRecentUniversalAnalysisRuns, shared. */
  read: 2000,
});
export type QuotaAction = keyof typeof DAILY_QUOTAS;

export const utcDay = (now: Date) => now.toISOString().slice(0, 10);

/** The pure decision, separated so it can be unit-tested. */
export function nextUsage(
  stored: { day?: unknown; counts?: unknown } | undefined,
  action: QuotaAction,
  now: Date,
): { allowed: boolean; record: { day: string; counts: Record<string, number>; expiresAt: Date } } {
  const day = utcDay(now);
  const counts: Record<string, number> =
    stored && stored.day === day && stored.counts && typeof stored.counts === 'object'
      ? { ...(stored.counts as Record<string, number>) }
      : {};
  // Two days after the counted day: lets an optional Firestore TTL policy delete idle counters.
  const expiresAt = new Date(`${day}T00:00:00Z`);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 2);
  const used = Number(counts[action] || 0);
  if (used >= DAILY_QUOTAS[action]) return { allowed: false, record: { day, counts, expiresAt } };
  counts[action] = used + 1;
  return { allowed: true, record: { day, counts, expiresAt } };
}

/**
 * Counts one call against the user's daily quota (1 read + 1 write, in a transaction) and refuses
 * the call once the quota is used. `universalUsage` has no Firestore rules match: clients can't
 * read or reset it.
 */
export async function enforceDailyQuota(uid: string, action: QuotaAction, now = new Date()): Promise<void> {
  const db = getFirestore();
  const ref = db.collection('universalUsage').doc(uid);
  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const result = nextUsage(snap.data(), action, now);
    if (result.allowed) tx.set(ref, result.record);
    return result.allowed;
  });
  if (!allowed) {
    throw new HttpsError('resource-exhausted', 'You have reached today’s limit for this action. It resets at midnight UTC.');
  }
}

/** Refuses a write that would take a dataset past its observation limit. */
export function assertObservationRoom(existing: number, adding: number): void {
  if (existing + adding > UNIVERSAL_LIMITS.observationsPerDataset) throw observationLimitError(existing);
}

/**
 * Runs `write` only if `children` stays within `cap` after `adding` more documents. The check and
 * the write share one transaction that also writes `lockRef` (the parent document), so parallel
 * requests on the same parent run one at a time and cannot all pass the same count.
 */
export async function writeWithinCap(options: {
  lockRef: DocumentReference;
  lockField: string;
  children: CollectionReference;
  cap: number;
  adding: number;
  refuse: (existing: number) => HttpsError;
  write: (tx: Transaction) => void;
}): Promise<void> {
  await getFirestore().runTransaction(async (tx) => {
    const lock = await tx.get(options.lockRef);
    if (!lock.exists) throw new HttpsError('not-found', 'Dataset not found.');
    const existing = (await tx.get(options.children.count())).data().count;
    if (existing + options.adding > options.cap) throw options.refuse(existing);
    options.write(tx);
    tx.set(options.lockRef, { [options.lockField]: FieldValue.serverTimestamp() }, { merge: true });
  });
}

/** The refusal for a dataset that would pass its observation limit. */
export function observationLimitError(existing: number): HttpsError {
  return new HttpsError(
    'failed-precondition',
    `A dataset can hold up to ${UNIVERSAL_LIMITS.observationsPerDataset.toLocaleString('en-US')} observations. This one has ${existing.toLocaleString('en-US')}.`,
  );
}

/** Dimensions on an observation: at most 20 string pairs, as the CSV import already enforces. */
export function cleanDimensions(raw: unknown, label = 'Observation'): Record<string, string> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new HttpsError('invalid-argument', `${label} has invalid dimensions.`);
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > 20) throw new HttpsError('invalid-argument', `${label} has more than 20 dimensions.`);
  const out: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (!key.trim() || key.length > 80 || typeof value !== 'string' || value.length > 200) {
      throw new HttpsError('invalid-argument', `${label} has invalid dimensions.`);
    }
    out[key.trim()] = value.trim();
  }
  return out;
}

export const DATASET_ID = /^[A-Za-z0-9_-]{1,128}$/;
