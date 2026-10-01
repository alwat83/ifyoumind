import { createDecipheriv } from 'crypto';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

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

interface PropertyOption {
  id: string;
  displayName: string;
  accountDisplayName: string;
}

function decrypt(credential: StoredCredential): string {
  if (credential.version !== 1 || credential.algorithm !== 'aes-256-gcm') {
    throw new HttpsError('failed-precondition', 'Unsupported Google credential format.');
  }

  const key = Buffer.from(GOOGLE_TOKEN_ENCRYPTION_KEY.value(), 'base64');
  if (key.length !== 32) throw new HttpsError('internal', 'Invalid token encryption key.');

  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(credential.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(credential.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(credential.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

async function accessToken(refreshToken: string): Promise<string> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID.value(),
      client_secret: GOOGLE_CLIENT_SECRET.value(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new HttpsError('failed-precondition', tokenData.error || 'Google authorization expired.');
  }
  return tokenData.access_token;
}

async function authorizedProperties(token: string): Promise<PropertyOption[]> {
  const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
    headers: { authorization: `Bearer ${token}` },
  });

  const data = await response.json() as {
    accountSummaries?: Array<{
      displayName?: string;
      propertySummaries?: Array<{ property?: string; displayName?: string }>;
    }>;
  };

  if (!response.ok) throw new HttpsError('unavailable', 'Unable to load Google Analytics properties.');

  const properties: PropertyOption[] = [];
  for (const account of data.accountSummaries || []) {
    for (const property of account.propertySummaries || []) {
      if (!property.property) continue;
      properties.push({
        id: property.property,
        displayName: property.displayName || property.property,
        accountDisplayName: account.displayName || 'Google Analytics',
      });
    }
  }
  return properties;
}

async function connectionContext(organizationId: string) {
  const ref = organizations().doc(organizationId).collection('connections').doc('ga4');
  const snapshot = await ref.get();
  const data = snapshot.data();

  if (!data?.credential) {
    throw new HttpsError('failed-precondition', 'Connect Google Analytics first.');
  }

  const refreshToken = decrypt(data.credential as StoredCredential);
  const token = await accessToken(refreshToken);
  return { ref, token };
}

export const discoverGoogleAnalyticsProperties = onCall(
  { secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKEN_ENCRYPTION_KEY] },
  async (request) => {
    const scope = await authorizeOrganization(
      request.auth?.uid,
      request.data?.organizationId,
      readMembership,
      ['owner', 'admin'],
    );

    const { token } = await connectionContext(scope.organizationId);
    const properties = await authorizedProperties(token);
    return { properties };
  },
);

export const selectGoogleAnalyticsProperty = onCall(
  { secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKEN_ENCRYPTION_KEY] },
  async (request) => {
    const scope = await authorizeOrganization(
      request.auth?.uid,
      request.data?.organizationId,
      readMembership,
      ['owner', 'admin'],
    );

    const propertyId: unknown = request.data?.propertyId;
    if (typeof propertyId !== 'string' || !/^properties\/\d+$/.test(propertyId)) {
      throw new HttpsError('invalid-argument', 'Invalid Google Analytics property.');
    }

    const { ref, token } = await connectionContext(scope.organizationId);
    const properties = await authorizedProperties(token);
    const selected = properties.find((property) => property.id === propertyId);
    if (!selected) throw new HttpsError('permission-denied', 'Google Analytics property is not accessible.');

    const propertyResponse = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/${propertyId}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    const property = await propertyResponse.json() as {
      displayName?: string;
      timeZone?: string;
      currencyCode?: string;
    };

    if (!propertyResponse.ok) {
      throw new HttpsError('unavailable', 'Unable to verify Google Analytics property.');
    }

    await ref.set({
      source: 'ga4',
      status: 'connected',
      sourceAccountId: propertyId,
      accountLabel: property.displayName || selected.displayName,
      reportingTimezone: property.timeZone || 'UTC',
      currencyCode: property.currencyCode || null,
      selectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      errorCode: FieldValue.delete(),
    }, { merge: true });

    return {
      connection: {
        source: 'ga4',
        status: 'connected',
        sourceAccountId: propertyId,
        accountLabel: property.displayName || selected.displayName,
        reportingTimezone: property.timeZone || 'UTC',
      },
    };
  },
);
