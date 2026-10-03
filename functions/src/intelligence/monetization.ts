import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

export const COMMERCIAL_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    marketProjectsPerMonth: 3,
    comparisonMarkets: 1,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPriceUsd: 39,
    marketProjectsPerMonth: 50,
    comparisonMarkets: 3,
  },
  report: {
    id: 'report',
    name: 'Market Report',
    oneTimePriceUsd: 79,
  },
} as const;

function monthStart(): Timestamp {
  const now = new Date();
  return Timestamp.fromDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
}

export const getCommercialStatus = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );
  const orgRef = organizations().doc(scope.organizationId);
  const org = (await orgRef.get()).data() || {};
  const plan = org.plan === 'pro' ? 'pro' : 'free';

  const usageSnapshot = await orgRef.collection('marketProjects')
    .where('createdAt', '>=', monthStart())
    .count()
    .get();

  const used = usageSnapshot.data().count;
  const limits = COMMERCIAL_PLANS[plan];

  return {
    plan,
    planName: limits.name,
    usedMarketProjects: used,
    marketProjectsPerMonth: limits.marketProjectsPerMonth,
    comparisonMarkets: limits.comparisonMarkets,
    remainingMarketProjects: Math.max(0, limits.marketProjectsPerMonth - used),
    checkoutEnabled: false,
    pricing: {
      proMonthlyUsd: COMMERCIAL_PLANS.pro.monthlyPriceUsd,
      reportOneTimeUsd: COMMERCIAL_PLANS.report.oneTimePriceUsd,
    },
  };
});

export const requestCommercialAccess = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );
  const offer = request.data?.offer;
  if (offer !== 'pro' && offer !== 'report') {
    throw new HttpsError('invalid-argument', 'Choose a valid offer.');
  }

  const context = typeof request.data?.context === 'string'
    ? request.data.context.trim().slice(0, 500)
    : '';

  const ref = organizations().doc(scope.organizationId).collection('commercialLeads').doc();
  await ref.set({
    offer,
    context,
    status: 'requested',
    requestedBy: scope.uid,
    requestedEmail: request.auth?.token?.email || null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    offer,
    message: offer === 'pro'
      ? 'Pro interest recorded. Checkout will activate when billing is connected.'
      : 'Market Report interest recorded. Checkout will activate when billing is connected.',
  };
});
