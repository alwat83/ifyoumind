import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

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

const FUNNEL=['app_open','decision_created','report_view','result_engaged','intent_prompt_shown','intent_prompt_clicked','upgrade_panel_shown','market_analysis_copied','print_dialog_opened','pricing_view','checkout_started','checkout_success'] as const;

/** Workspaces that created at least two decisions in the window: the repeat-use signal, derived rather than tracked. */
export function repeatDecisionOrganizations(events:Array<{event?:unknown;organizationId?:unknown}>):number{
  const perOrg=new Map<string,number>();
  for(const e of events){
    if(e.event!=='decision_created'||typeof e.organizationId!=='string')continue;
    perOrg.set(e.organizationId,(perOrg.get(e.organizationId)||0)+1);
  }
  return [...perOrg.values()].filter(n=>n>=2).length;
}

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
    confirmedPayments:summarizePayments(paymentSnapshot.docs.map(doc=>doc.data())),
    repeatDecisionOrganizations:repeatDecisionOrganizations(snapshot.docs.map(doc=>doc.data())),
    conversion:{
      appToDecision:Number(((uniqueOrganizations.decision_created/activated)*100).toFixed(1)),
      decisionToEngaged:uniqueOrganizations.decision_created
        ? Number(((uniqueOrganizations.result_engaged/uniqueOrganizations.decision_created)*100).toFixed(1))
        : 0,
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
