import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ExclusionDeps, excludedOrganizations, parseQaExclusionConfig } from './qa-exclusion';

/** Reads workspace creators and Auth users with the Admin SDK, in Firestore and Auth batch sizes. */
const adminExclusionDeps=():ExclusionDeps=>({
  async creatorsOf(ids){
    const db=getFirestore();
    const out=new Map<string,string|null>();
    for(let i=0;i<ids.length;i+=100){
      const refs=ids.slice(i,i+100).map(id=>db.collection('intelligenceOrganizations').doc(id));
      for(const snap of await db.getAll(...refs)){
        const createdBy=snap.data()?.createdBy;
        out.set(snap.id,typeof createdBy==='string'?createdBy:null);
      }
    }
    return out;
  },
  async usersOf(uids){
    const out=new Map<string,{email?:string|null;customClaims?:Record<string,unknown>|null}>();
    for(let i=0;i<uids.length;i+=100){
      const result=await getAuth().getUsers(uids.slice(i,i+100).map(uid=>({uid})));
      for(const user of result.users)out.set(user.uid,{email:user.email??null,customClaims:user.customClaims??null});
    }
    return out;
  },
});

// Revenue comes from Stripe-confirmed payments (written by the webhook), never from
// checkout_success, which only means the browser came back from Checkout.
export function summarizePayments(payments:Array<Record<string,any>>){
  const empty=()=>({payments:0,reports:0,pro:0,grossByCurrency:{} as Record<string,number>});
  const live=empty();
  const test=empty();
  const recentLive:Array<Record<string,unknown>>=[];
  for(const payment of payments){
    const bucket=payment.livemode===true?live:test;
    bucket.payments+=1;
    if(payment.offer==='report')bucket.reports+=1;
    if(payment.offer==='pro')bucket.pro+=1;
    if(typeof payment.amountTotal==='number'&&typeof payment.currency==='string'){
      const currency=payment.currency.toUpperCase();
      bucket.grossByCurrency[currency]=(bucket.grossByCurrency[currency]||0)+payment.amountTotal;
    }
    if(payment.livemode===true){
      recentLive.push({
        paidAt:payment.paidAt?.toDate?.().toISOString?.()||null,
        offer:payment.offer||null,
        amountTotal:payment.amountTotal??null,
        currency:typeof payment.currency==='string'?payment.currency.toUpperCase():null,
        organizationId:payment.organizationId||null,
        checkoutSessionId:payment.checkoutSessionId||null,
        fulfilment:payment.fulfilment||null,
      });
    }
  }
  recentLive.sort((a,b)=>String(b.paidAt).localeCompare(String(a.paidAt)));
  return {live,test,recentLive:recentLive.slice(0,25)};
}

const FUNNEL=['app_open','decision_created','report_view','pricing_view','checkout_started','checkout_success'] as const;

export const getProductFunnelMetrics=onCall(async(request)=>{
  if(!request.auth) throw new HttpsError('unauthenticated','Authentication required.');
  if(request.auth.token.admin!==true) throw new HttpsError('permission-denied','Admin access required.');

  const rawDays=Number(request.data?.days||30);
  const days=Math.min(90,Math.max(1,Number.isFinite(rawDays)?Math.floor(rawDays):30));
  const since=Timestamp.fromMillis(Date.now()-days*24*60*60*1000);
  const [snapshot,paymentSnapshot]=await Promise.all([
    getFirestore().collection('productEvents').where('createdAt','>=',since).limit(5000).get(),
    getFirestore().collection('stripePayments').where('paidAt','>=',since).limit(5000).get(),
  ]);

  // QA and test workspaces never count. Computed at read time; nothing is written.
  const configSnapshot=await getFirestore().collection('adminConfig').doc('qaExclusion').get();
  const config=parseQaExclusionConfig(configSnapshot.data());
  const allOrganizationIds=[
    ...snapshot.docs.map(doc=>doc.data().organizationId),
    ...paymentSnapshot.docs.map(doc=>doc.data().organizationId),
  ].filter((id):id is string=>typeof id==='string'&&id.length>0);
  const excluded=await excludedOrganizations(allOrganizationIds,config,adminExclusionDeps());
  const isExcluded=(data:Record<string,any>)=>typeof data.organizationId==='string'&&excluded.has(data.organizationId);
  const events=snapshot.docs.map(doc=>doc.data()).filter(data=>!isExcluded(data));
  const payments=paymentSnapshot.docs.map(doc=>doc.data()).filter(data=>!isExcluded(data));

  const counts:Record<string,number>={};
  const organizations:Record<string,Set<string>>={};
  for(const name of FUNNEL){counts[name]=0;organizations[name]=new Set<string>();}

  for(const data of events){
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
    confirmedPayments:summarizePayments(payments),
    qaExclusion:{
      // false until the founder creates adminConfig/qaExclusion; the fixture domain is excluded regardless.
      configured:configSnapshot.exists,
      excludedOrganizations:excluded.size,
      excludedEvents:snapshot.size-events.length,
      excludedPayments:paymentSnapshot.size-payments.length,
    },
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
