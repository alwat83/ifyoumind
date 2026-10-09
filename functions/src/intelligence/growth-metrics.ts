import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

const FUNNEL=['app_open','decision_created','report_view','pricing_view','checkout_started','checkout_success'] as const;

export const getProductFunnelMetrics=onCall(async(request)=>{
  if(!request.auth) throw new HttpsError('unauthenticated','Authentication required.');
  if(request.auth.token.admin!==true) throw new HttpsError('permission-denied','Admin access required.');

  const rawDays=Number(request.data?.days||30);
  const days=Math.min(90,Math.max(1,Number.isFinite(rawDays)?Math.floor(rawDays):30));
  const since=Timestamp.fromMillis(Date.now()-days*24*60*60*1000);
  const snapshot=await getFirestore().collection('productEvents')
    .where('createdAt','>=',since)
    .limit(5000)
    .get();

  const counts:Record<string,number>={};
  const organizations:Record<string,Set<string>>={};
  for(const name of FUNNEL){counts[name]=0;organizations[name]=new Set<string>();}

  for(const doc of snapshot.docs){
    const data=doc.data();
    const event=String(data.event||'');
    if(!(event in counts))continue;
    counts[event]+=1;
    if(typeof data.organizationId==='string')organizations[event].add(data.organizationId);
  }

  const uniqueOrganizations=Object.fromEntries(
    FUNNEL.map(name=>[name,organizations[name].size]),
  );
  const activated=Math.max(1,uniqueOrganizations.app_open);
  return {
    days,
    generatedAt:new Date().toISOString(),
    counts,
    uniqueOrganizations,
    conversion:{
      appToDecision:Number(((uniqueOrganizations.decision_created/activated)*100).toFixed(1)),
      decisionToPricing:uniqueOrganizations.decision_created
        ? Number(((uniqueOrganizations.pricing_view/uniqueOrganizations.decision_created)*100).toFixed(1))
        : 0,
      pricingToCheckout:uniqueOrganizations.pricing_view
        ? Number(((uniqueOrganizations.checkout_started/uniqueOrganizations.pricing_view)*100).toFixed(1))
        : 0,
      checkoutToPaid:uniqueOrganizations.checkout_started
        ? Number(((uniqueOrganizations.checkout_success/uniqueOrganizations.checkout_started)*100).toFixed(1))
        : 0,
    },
  };
});
