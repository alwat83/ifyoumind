import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { SourceKind } from './contracts';

type ConnectionStatus = 'not_connected' | 'connecting' | 'connected' | 'error';

interface PublicConnection {
  source: SourceKind;
  status: ConnectionStatus;
  accountLabel?: string;
  sourceAccountId?: string;
  lastSyncedAt?: string;
  errorCode?: string;
}

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

const supportedSources: SourceKind[] = ['ga4', 'google_ads', 'search_console', 'stripe'];

export const getIntelligenceConnections = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid,
    request.data?.organizationId,
    readMembership,
  );

  const snapshot = await organizations()
    .doc(scope.organizationId)
    .collection('connections')
    .get();

  const stored = new Map<string, FirebaseFirestore.DocumentData>();
  snapshot.forEach((doc) => stored.set(doc.id, doc.data()));

  const connections: PublicConnection[] = supportedSources.map((source) => {
    const data = stored.get(source);
    if (!data) return { source, status: 'not_connected' };

    const status: ConnectionStatus =
      data.status === 'connecting' || data.status === 'connected' || data.status === 'error'
        ? data.status
        : 'not_connected';

    return {
      source,
      status,
      accountLabel: typeof data.accountLabel === 'string' ? data.accountLabel : undefined,
      sourceAccountId: typeof data.sourceAccountId === 'string' ? data.sourceAccountId : undefined,
      lastSyncedAt: data.lastSyncedAt?.toDate?.().toISOString?.(),
      errorCode: typeof data.errorCode === 'string' ? data.errorCode : undefined,
    };
  });

  return { connections };
});
