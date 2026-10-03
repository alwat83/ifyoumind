import { createDecipheriv, randomUUID } from 'crypto';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { MetricFact } from './contracts';
import { metricFactKey, validateMetricFact } from './metric-facts';

const GOOGLE_CLIENT_ID = defineSecret('GOOGLE_OAUTH_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = defineSecret('GOOGLE_OAUTH_CLIENT_SECRET');
const GOOGLE_TOKEN_ENCRYPTION_KEY = defineSecret('GOOGLE_TOKEN_ENCRYPTION_KEY');

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface StoredCredential {
  version: number;
  algorithm: string;
  ciphertext: string;
  iv: string;
  tag: string;
}

function decrypt(credential: StoredCredential): string {
  if (credential.version !== 1 || credential.algorithm !== 'aes-256-gcm') {
    throw new HttpsError('failed-precondition', 'Unsupported Google credential format.');
  }
  const key = Buffer.from(GOOGLE_TOKEN_ENCRYPTION_KEY.value(), 'base64');
  if (key.length !== 32) throw new HttpsError('internal', 'Invalid token encryption key.');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(credential.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(credential.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(credential.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

async function accessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID.value(),
      client_secret: GOOGLE_CLIENT_SECRET.value(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json() as { access_token?: string; error?: string };
  if (!response.ok || !data.access_token) {
    throw new HttpsError('failed-precondition', data.error || 'Google authorization expired.');
  }
  return data.access_token;
}

function dateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, offset: number): string {
  const cursor = new Date(`${date}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + offset);
  return cursor.toISOString().slice(0, 10);
}

function gaDate(value: string): string {
  if (!/^\d{8}$/.test(value)) throw new Error('Invalid GA4 date value');
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function count(value: string | undefined): number {
  const parsed = Number(value || '0');
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Invalid GA4 metric value');
  return Math.round(parsed);
}

export const syncGoogleAnalytics = onCall(
  { secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKEN_ENCRYPTION_KEY], timeoutSeconds: 120 },
  async (request) => {
    const scope = await authorizeOrganization(
      request.auth?.uid,
      request.data?.organizationId,
      readMembership,
      ['owner', 'admin'],
    );

    const connectionRef = organizations()
      .doc(scope.organizationId)
      .collection('connections')
      .doc('ga4');
    const connection = (await connectionRef.get()).data();

    if (connection?.status !== 'connected' || typeof connection.sourceAccountId !== 'string' ||
        typeof connection.reportingTimezone !== 'string' || !connection.credential) {
      throw new HttpsError('failed-precondition', 'Select a Google Analytics property first.');
    }

    const refreshToken = decrypt(connection.credential as StoredCredential);
    const token = await accessToken(refreshToken);
    const propertyId = connection.sourceAccountId as string;
    const reportingTimezone = connection.reportingTimezone as string;
    const today = dateInTimeZone(new Date(), reportingTimezone);
    const through = addDays(today, -1);
    const from = addDays(through, -27);
    const syncRunId = randomUUID();
    const observedAt = new Date().toISOString();

    const reportResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: from, endDate: through }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'sessions' }, { name: 'keyEvents' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
          keepEmptyRows: true,
          limit: '100',
        }),
      },
    );

    const report = await reportResponse.json() as {
      rows?: Array<{
        dimensionValues?: Array<{ value?: string }>;
        metricValues?: Array<{ value?: string }>;
      }>;
      metadata?: { dataLossFromOtherRow?: boolean };
      error?: { message?: string };
    };

    if (!reportResponse.ok) {
      await connectionRef.set({
        errorCode: 'ga4_sync_failed',
        lastSyncAttemptAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      throw new HttpsError('unavailable', report.error?.message || 'Google Analytics sync failed.');
    }

    const facts: MetricFact[] = [];
    for (const row of report.rows || []) {
      const rawDate = row.dimensionValues?.[0]?.value;
      if (!rawDate) continue;
      const date = gaDate(rawDate);
      const qualityFlags: MetricFact['qualityFlags'] =
        report.metadata?.dataLossFromOtherRow ? ['estimated'] : [];

      for (const [metric, value] of [
        ['ga4.sessions', count(row.metricValues?.[0]?.value)],
        ['ga4.key_events', count(row.metricValues?.[1]?.value)],
      ] as const) {
        const fact: MetricFact = {
          schemaVersion: 1,
          organizationId: scope.organizationId,
          connectionId: 'ga4',
          source: 'ga4',
          sourceAccountId: propertyId,
          metric,
          date,
          reportingTimezone,
          dimensions: {},
          value,
          unit: 'count',
          qualityFlags,
          sourceUpdatedAt: observedAt,
          observedAt,
          syncRunId,
        };
        validateMetricFact(fact);
        facts.push(fact);
      }
    }

    const db = getFirestore();
    const batch = db.batch();
    const factsCollection = organizations().doc(scope.organizationId).collection('metricFacts');
    for (const fact of facts) {
      batch.set(factsCollection.doc(metricFactKey(fact)), fact, { merge: false });
    }
    batch.set(connectionRef, {
      lastSyncedAt: FieldValue.serverTimestamp(),
      lastSyncAttemptAt: FieldValue.serverTimestamp(),
      lastSyncRunId: syncRunId,
      syncedWindow: { from, through },
      errorCode: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await batch.commit();

    return { syncRunId, factsWritten: facts.length, window: { from, through } };
  },
);
