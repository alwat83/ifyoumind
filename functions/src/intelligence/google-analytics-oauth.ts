import { createCipheriv, randomBytes } from 'crypto';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const GOOGLE_CLIENT_ID = defineSecret('GOOGLE_OAUTH_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = defineSecret('GOOGLE_OAUTH_CLIENT_SECRET');
const GOOGLE_TOKEN_ENCRYPTION_KEY = defineSecret('GOOGLE_TOKEN_ENCRYPTION_KEY');
const APP_ORIGIN = defineString('INTELLIGENCE_APP_ORIGIN', { default: 'https://ifyoumind.com' });
const GOOGLE_REDIRECT_URI = defineString('GOOGLE_ANALYTICS_REDIRECT_URI', {
  default: 'https://us-central1-ifyoumind-473fe.cloudfunctions.net/googleAnalyticsOAuthCallback',
});

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const oauthStates = () => getFirestore().collection('intelligenceOAuthStates');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

const analyticsScope = 'https://www.googleapis.com/auth/analytics.readonly';

function encryptionKey(): Buffer {
  const key = Buffer.from(GOOGLE_TOKEN_ENCRYPTION_KEY.value(), 'base64');
  if (key.length !== 32) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  }
  return key;
}

function encrypt(value: string): { ciphertext: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

export const beginGoogleAnalyticsConnection = onCall(
  { secrets: [GOOGLE_CLIENT_ID] },
  async (request) => {
    const scope = await authorizeOrganization(
      request.auth?.uid,
      request.data?.organizationId,
      readMembership,
      ['owner', 'admin'],
    );

    const state = randomBytes(32).toString('hex');
    await oauthStates().doc(state).set({
      organizationId: scope.organizationId,
      uid: scope.uid,
      source: 'ga4',
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
    });

    await organizations()
      .doc(scope.organizationId)
      .collection('connections')
      .doc('ga4')
      .set({
        source: 'ga4',
        status: 'connecting',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID.value(),
      redirect_uri: GOOGLE_REDIRECT_URI.value(),
      response_type: 'code',
      scope: analyticsScope,
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent select_account',
      state,
    });

    return { authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  },
);

export const googleAnalyticsOAuthCallback = onRequest(
  {
    secrets: [GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_TOKEN_ENCRYPTION_KEY],
  },
  async (request, response) => {
    const state = typeof request.query.state === 'string' ? request.query.state : '';
    const code = typeof request.query.code === 'string' ? request.query.code : '';
    const denied = typeof request.query.error === 'string' ? request.query.error : '';

    if (!state) {
      response.status(400).send('Invalid or expired connection request.');
      return;
    }

    const stateRef = oauthStates().doc(state);
    const snapshot = await stateRef.get();
    const data = snapshot.data();
    const expired = !data?.expiresAt?.toMillis || data.expiresAt.toMillis() < Date.now();

    if (!data || expired || data.source !== 'ga4') {
      response.status(400).send('Invalid or expired connection request.');
      return;
    }

    const connectionRef = organizations()
      .doc(data.organizationId)
      .collection('connections')
      .doc('ga4');

    if (denied || !code) {
      await connectionRef.set({
        status: 'error',
        errorCode: denied || 'authorization_cancelled',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await stateRef.delete();
      response.redirect(`${APP_ORIGIN.value()}/app/connections?google=cancelled`);
      return;
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID.value(),
          client_secret: GOOGLE_CLIENT_SECRET.value(),
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_REDIRECT_URI.value(),
        }),
      });

      const tokenData = await tokenResponse.json() as {
        refresh_token?: string;
        scope?: string;
        error?: string;
      };

      if (!tokenResponse.ok || !tokenData.refresh_token) {
        throw new Error(tokenData.error || 'missing_refresh_token');
      }

      const encryptedRefreshToken = encrypt(tokenData.refresh_token);
      await connectionRef.set({
        source: 'ga4',
        status: 'connecting',
        credential: {
          version: 1,
          algorithm: 'aes-256-gcm',
          ...encryptedRefreshToken,
        },
        grantedScope: tokenData.scope || analyticsScope,
        connectedBy: data.uid,
        connectedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        errorCode: FieldValue.delete(),
      }, { merge: true });

      await stateRef.delete();
      response.redirect(`${APP_ORIGIN.value()}/app/connections?google=authorized`);
    } catch {
      await connectionRef.set({
        status: 'error',
        errorCode: 'oauth_exchange_failed',
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      await stateRef.delete();
      response.redirect(`${APP_ORIGIN.value()}/app/connections?google=error`);
    }
  },
);
