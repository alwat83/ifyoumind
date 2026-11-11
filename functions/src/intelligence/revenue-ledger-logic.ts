// Pure rules for the Stripe revenue ledger: renewals, failed renewals, refunds and disputes.
// The ledger only records what Stripe reports. It never grants or removes access: entitlements
// stay with the checkout and subscription handlers in monetization.ts.

export const LEDGER_EVENT_TYPES=new Set([
  'invoice.paid',
  'invoice.payment_failed',
  'charge.refunded',
  'charge.refund.updated',
  'charge.dispute.created',
  'charge.dispute.updated',
  'charge.dispute.closed',
  'charge.dispute.funds_withdrawn',
  'charge.dispute.funds_reinstated',
]);

export type LedgerKind='invoice'|'charge'|'dispute';

export interface LedgerEntry{
  id:string;
  kind:LedgerKind;
  data:Record<string,unknown>;
}

const str=(value:unknown):string|null=>typeof value==='string'&&value?value:null;
const num=(value:unknown):number|null=>typeof value==='number'&&Number.isFinite(value)?value:null;
const idOf=(value:unknown):string|null=>str(value)??str((value as {id?:unknown}|null)?.id);

/** The workspace an invoice belongs to, from wherever the Stripe API version puts subscription metadata. */
export function invoiceOrganizationId(invoice:Record<string,any>):string|null{
  return str(invoice?.subscription_details?.metadata?.organizationId)
    ??str(invoice?.parent?.subscription_details?.metadata?.organizationId)
    ??str(invoice?.lines?.data?.find?.((line:any)=>line?.metadata?.organizationId)?.metadata?.organizationId)
    ??null;
}

function invoiceSubscriptionId(invoice:Record<string,any>):string|null{
  return idOf(invoice?.subscription)??idOf(invoice?.parent?.subscription_details?.subscription);
}

/**
 * The ledger document a Stripe event writes, or null for events the ledger doesn't track.
 * Values are the object's own cumulative state (e.g. amount_refunded), so applying the newest
 * event is always correct and replaying an older one is detectable by `eventCreated`.
 */
export function ledgerEntryFor(event:{id:string;type:string;created:number;livemode?:boolean;data:{object:Record<string,any>}}):LedgerEntry|null{
  if(!LEDGER_EVENT_TYPES.has(event.type))return null;
  const object=event.data?.object||{};
  const base={
    livemode:event.livemode===true,
    eventId:event.id,
    eventType:event.type,
    eventCreated:event.created,
    customerId:idOf(object.customer),
  };

  if(event.type.startsWith('invoice.')){
    const id=str(object.id);
    if(!id)return null;
    const paid=event.type==='invoice.paid';
    return {id:`invoice_${id}`,kind:'invoice',data:{
      ...base,
      kind:'invoice',
      invoiceId:id,
      status:paid?'paid':'payment_failed',
      // subscription_create is the first Pro payment (already in stripePayments); subscription_cycle is a renewal.
      billingReason:str(object.billing_reason),
      renewal:object.billing_reason==='subscription_cycle',
      subscriptionId:invoiceSubscriptionId(object),
      paymentIntentId:idOf(object.payment_intent),
      organizationId:invoiceOrganizationId(object),
      amountPaid:num(object.amount_paid),
      amountDue:num(object.amount_due),
      currency:str(object.currency),
      attemptCount:num(object.attempt_count),
      periodStart:num(object.period_start),
      periodEnd:num(object.period_end),
      paidAtSeconds:paid?(num(object.status_transitions?.paid_at)??event.created):null,
    }};
  }

  if(event.type==='charge.refunded'||event.type==='charge.refund.updated'){
    // charge.refund.updated carries a Refund; charge.refunded carries the Charge itself.
    const isCharge=event.type==='charge.refunded';
    const chargeId=isCharge?str(object.id):idOf(object.charge);
    if(!chargeId)return null;
    return {id:`charge_${chargeId}`,kind:'charge',data:{
      ...base,
      kind:'charge',
      chargeId,
      paymentIntentId:idOf(object.payment_intent),
      ...(isCharge?{
        amount:num(object.amount),
        amountRefunded:num(object.amount_refunded),
        fullyRefunded:object.refunded===true,
        currency:str(object.currency),
      }:{
        // Refund status is ordered on its own clock, so a late refund update isn't lost
        // behind a newer charge.refunded (and vice versa).
        eventCreated:undefined,
        refundEventCreated:event.created,
        lastRefundId:str(object.id),
        lastRefundStatus:str(object.status),
        lastRefundAmount:num(object.amount),
      }),
    }};
  }

  // Disputes.
  const disputeId=str(object.id);
  if(!disputeId)return null;
  return {id:`dispute_${disputeId}`,kind:'dispute',data:{
    ...base,
    kind:'dispute',
    disputeId,
    chargeId:idOf(object.charge),
    paymentIntentId:idOf(object.payment_intent),
    amount:num(object.amount),
    currency:str(object.currency),
    status:str(object.status),
    reason:str(object.reason),
  }};
}

/** Which stored timestamp an entry is ordered against. */
export function orderingField(entry:LedgerEntry):'eventCreated'|'refundEventCreated'{
  return entry.data.eventType==='charge.refund.updated'?'refundEventCreated':'eventCreated';
}

/**
 * Out-of-order delivery: an older event never overwrites a newer one. Equal timestamps apply
 * (Stripe's `created` has one-second resolution and the same event is already deduplicated).
 */
export function shouldApplyLedgerEvent(incomingCreated:number,storedCreated:unknown):boolean{
  const stored=Number(storedCreated);
  return !Number.isFinite(stored)||incomingCreated>=stored;
}

const CHARGE_TOTALS=['amount','amountRefunded','fullyRefunded','currency','eventCreated','eventId','eventType'];

/** A refund-status update only adds refund details; it never replaces the charge's totals. */
export function mergeLedgerData(existing:Record<string,unknown>|undefined,entry:LedgerEntry):Record<string,unknown>{
  const incoming=Object.fromEntries(Object.entries(entry.data).filter(([,value])=>value!==undefined));
  if(entry.data.eventType==='charge.refund.updated'){
    const refundOnly=Object.fromEntries(Object.entries(incoming).filter(([key])=>!CHARGE_TOTALS.includes(key)));
    return {...(existing||{}),...refundOnly};
  }
  return {...(existing||{}),...incoming};
}

/** Dispute statuses that are finished; anything else is still open. */
export const CLOSED_DISPUTE_STATUSES=new Set(['won','lost','warning_closed','prevented']);

export interface RevenueInputs{
  payments:Array<Record<string,any>>;
  ledger:Array<Record<string,any>>;
  /** Workspaces that are QA, test, founder or otherwise not genuine customers. */
  excludedOrganizations:Set<string>;
}

export type ReversalResolution=
  | {status:'resolved';organizationId:string;paymentKey:string;how:'payment_intent'|'only_payment_for_customer'}
  | {status:'unresolved';organizationId:string|null;reason:'customer_has_several_payments'|'customer_in_several_workspaces'}
  | {status:'unmatched'};

/**
 * Ties a refund or dispute to the purchase it reverses, or says it can't.
 * - Same payment intent as a recorded payment (one-time reports): resolved to that payment.
 * - Otherwise by Stripe customer, but ONLY when that customer has exactly one live payment in
 *   exactly one workspace. A customer with several payments, subscriptions or reports is never
 *   guessed: the reversal stays unresolved for a person to review.
 */
export function resolveReversal(
  entry:Record<string,any>,
  paymentsByIntent:Map<string,{organizationId:string;paymentKey:string}>,
  paymentsByCustomer:Map<string,Array<{organizationId:string;paymentKey:string}>>,
):ReversalResolution{
  const direct=entry.paymentIntentId&&paymentsByIntent.get(entry.paymentIntentId);
  if(direct)return {status:'resolved',...direct,how:'payment_intent'};
  const candidates=entry.customerId?paymentsByCustomer.get(entry.customerId)||[]:[];
  if(!candidates.length)return {status:'unmatched'};
  const orgs=new Set(candidates.map(c=>c.organizationId));
  if(orgs.size>1)return {status:'unresolved',organizationId:null,reason:'customer_in_several_workspaces'};
  if(candidates.length>1)return {status:'unresolved',organizationId:candidates[0].organizationId,reason:'customer_has_several_payments'};
  return {status:'resolved',...candidates[0],how:'only_payment_for_customer'};
}

/**
 * Founder-dashboard figures from Stripe-confirmed records only, live mode only, QA excluded.
 * Verified figures assume every unresolved reversal applies (the conservative reading); the
 * difference is reported separately as needing review, never folded in. Amounts are minor units.
 */
export function revenueSummary({payments,ledger,excludedOrganizations}:RevenueInputs){
  const isLive=(r:Record<string,any>)=>r.livemode===true;
  const excluded=(org:unknown)=>typeof org==='string'&&excludedOrganizations.has(org);

  // Every confirmed live payment event: first payments (stripePayments) and paid renewals (ledger).
  const confirmed:Array<{organizationId:string;paymentKey:string;offer:string;paymentIntentId?:string;customerId?:string;duplicate:boolean}>=[];
  for(const p of payments){
    if(!isLive(p)||!p.organizationId)continue;
    confirmed.push({organizationId:p.organizationId,paymentKey:`session:${p.checkoutSessionId}`,offer:String(p.offer),
      paymentIntentId:p.paymentIntentId||undefined,customerId:p.customerId||undefined,duplicate:p.fulfilment==='duplicate'});
  }
  const invoices=ledger.filter(e=>e.kind==='invoice'&&isLive(e));
  for(const i of invoices){
    if(i.status!=='paid'||i.renewal!==true||!i.organizationId)continue;
    confirmed.push({organizationId:i.organizationId,paymentKey:`invoice:${i.invoiceId}`,offer:'pro_renewal',
      paymentIntentId:i.paymentIntentId||undefined,customerId:i.customerId||undefined,duplicate:false});
  }
  const byIntent=new Map<string,{organizationId:string;paymentKey:string}>();
  const byCustomer=new Map<string,Array<{organizationId:string;paymentKey:string}>>();
  for(const c of confirmed){
    const ref={organizationId:c.organizationId,paymentKey:c.paymentKey};
    if(c.paymentIntentId)byIntent.set(c.paymentIntentId,ref);
    if(c.customerId)byCustomer.set(c.customerId,[...(byCustomer.get(c.customerId)||[]),ref]);
  }

  const charges=ledger.filter(e=>e.kind==='charge'&&isLive(e));
  const disputes=ledger.filter(e=>e.kind==='dispute'&&isLive(e));
  const resolution=new Map<Record<string,any>,ReversalResolution>();
  for(const e of [...charges,...disputes])resolution.set(e,resolveReversal(e,byIntent,byCustomer));
  const orgOf=(r:ReversalResolution)=>r.status==='unmatched'?null:r.organizationId;
  const counts=(e:Record<string,any>)=>{const org=orgOf(resolution.get(e)!);return org===null?resolution.get(e)!.status==='unresolved':!excluded(org);};

  // A full reversal is a fully refunded charge or a lost dispute; one per charge.
  const reversals=new Map<string,ReversalResolution>();
  for(const c of charges)if(c.fullyRefunded===true)reversals.set(c.chargeId||c.paymentIntentId,resolution.get(c)!);
  for(const d of disputes)if(d.status==='lost')reversals.set(d.chargeId||d.paymentIntentId||d.disputeId,resolution.get(d)!);
  const reversedPayment=new Set([...reversals.values()].filter(r=>r.status==='resolved').map(r=>(r as any).paymentKey));
  const unresolvedByOrg=new Map<string,number>();
  let unresolvedAcrossWorkspaces=0;
  for(const r of reversals.values()){
    if(r.status!=='unresolved')continue;
    if(r.organizationId)unresolvedByOrg.set(r.organizationId,(unresolvedByOrg.get(r.organizationId)||0)+1);
    else unresolvedAcrossWorkspaces++;
  }

  const genuineVerified:string[]=[];
  const needsReview:string[]=[];
  const orgs=new Set(confirmed.filter(c=>!excluded(c.organizationId)&&!c.duplicate).map(c=>c.organizationId));
  for(const org of orgs){
    const standing=confirmed.filter(c=>c.organizationId===org&&!c.duplicate&&!reversedPayment.has(c.paymentKey)).length;
    const unresolved=unresolvedByOrg.get(org)||0;
    if(standing-unresolved>=1)genuineVerified.push(org);
    else if(standing>=1)needsReview.push(org);
  }

  const live=(offer:string)=>confirmed.filter(c=>c.offer===offer&&!c.duplicate&&!excluded(c.organizationId));
  const unresolvedList=[...resolution.entries()].filter(([,r])=>r.status==='unresolved')
    .map(([e,r])=>({kind:e.kind,id:e.chargeId&&e.kind==='charge'?e.chargeId:e.disputeId,reason:(r as any).reason}));

  return {
    /** Workspaces still paying even if every unresolved reversal turns out to apply to them. */
    genuinePayingCustomers:genuineVerified.length,
    /** Workspaces whose status depends on an unresolved reversal: review before counting them. */
    payingCustomersNeedingReview:needsReview.length,
    reportPurchases:live('report').length,
    reportPurchasesNetOfFullRefunds:live('report').filter(c=>!reversedPayment.has(c.paymentKey)).length,
    proSubscriptionsStarted:live('pro').length,
    proRenewalsPaid:live('pro_renewal').length,
    proRenewalPaymentsFailed:invoices.filter(e=>e.status==='payment_failed'&&!excluded(e.organizationId)).length,
    refundedMinorUnits:charges.filter(c=>resolution.get(c)!.status==='resolved'&&counts(c)).reduce((sum,c)=>sum+(Number(c.amountRefunded)||0),0),
    refundedMinorUnitsUnresolved:charges.filter(c=>resolution.get(c)!.status==='unresolved').reduce((sum,c)=>sum+(Number(c.amountRefunded)||0),0),
    /** A failed refund leaves the charge's recorded total too high until Stripe reports it again. */
    refundsFailed:charges.filter(c=>counts(c)&&c.lastRefundStatus==='failed').length,
    disputesOpen:disputes.filter(d=>counts(d)&&!CLOSED_DISPUTE_STATUSES.has(String(d.status))).length,
    disputesLost:disputes.filter(d=>counts(d)&&d.status==='lost').length,
    /** Refunds and disputes that match a customer but not one specific purchase. Never guessed. */
    unresolvedReversals:unresolvedList,
    unresolvedAcrossWorkspaces,
    /** Live refunds or disputes that match no recorded payment or customer: investigate by hand. */
    unmatchedLedgerEntries:[...charges,...disputes].filter(e=>resolution.get(e)!.status==='unmatched').length,
  };
}

export interface StripeSnapshot{
  /** Completed live Checkout Sessions (`GET /v1/checkout/sessions?status=complete`). */
  sessions:Array<Record<string,any>>;
  /** Live charges with refunds (`GET /v1/charges`, filtered to amount_refunded > 0). */
  charges:Array<Record<string,any>>;
  /** Live disputes (`GET /v1/disputes`). */
  disputes:Array<Record<string,any>>;
  /** Live paid invoices (`GET /v1/invoices?status=paid`). */
  invoices:Array<Record<string,any>>;
}

/**
 * Compares what Firestore recorded with what Stripe live mode reports. Read-only: it only lists
 * differences for a person to review. Every list holds Stripe or Firestore ids, never personal data.
 */
export function reconcileWithStripe(records:{payments:Array<Record<string,any>>;ledger:Array<Record<string,any>>},stripe:StripeSnapshot){
  const payments=new Map(records.payments.filter(p=>p.livemode===true).map(p=>[p.checkoutSessionId,p]));
  const ledger=new Map(records.ledger.filter(e=>e.livemode===true).map(e=>[`${e.kind}:${e.invoiceId||e.chargeId&&e.kind==='charge'&&e.chargeId||e.disputeId}`,e]));
  const paidSessions=stripe.sessions.filter(s=>s.livemode===true&&s.payment_status==='paid'&&['report','pro'].includes(s.metadata?.offer));
  const discrepancies={
    paymentsMissing:[] as string[],
    paymentAmountMismatch:[] as string[],
    paymentsNotInStripe:[] as string[],
    renewalsMissing:[] as string[],
    refundsMissingOrDifferent:[] as string[],
    disputesMissingOrDifferent:[] as string[],
  };
  const verified={paymentsMatched:0,renewalsMatched:0,refundsMatched:0,disputesMatched:0};
  for(const s of paidSessions){
    const p=payments.get(s.id);
    if(!p)discrepancies.paymentsMissing.push(s.id);
    else if(p.amountTotal!==s.amount_total)discrepancies.paymentAmountMismatch.push(s.id);
    else verified.paymentsMatched++;
  }
  const stripeSessionIds=new Set(paidSessions.map(s=>s.id));
  for(const id of payments.keys())if(!stripeSessionIds.has(id))discrepancies.paymentsNotInStripe.push(String(id));
  for(const i of stripe.invoices){
    if(i.livemode!==true||i.status!=='paid'||i.billing_reason!=='subscription_cycle')continue;
    if(ledger.get(`invoice:${i.id}`)?.status!=='paid')discrepancies.renewalsMissing.push(i.id);
    else verified.renewalsMatched++;
  }
  for(const c of stripe.charges){
    if(c.livemode!==true||!(c.amount_refunded>0))continue;
    if(ledger.get(`charge:${c.id}`)?.amountRefunded!==c.amount_refunded)discrepancies.refundsMissingOrDifferent.push(c.id);
    else verified.refundsMatched++;
  }
  for(const d of stripe.disputes){
    if(d.livemode!==true)continue;
    if(ledger.get(`dispute:${d.id}`)?.status!==d.status)discrepancies.disputesMissingOrDifferent.push(d.id);
    else verified.disputesMatched++;
  }
  return {verified,discrepancies,clean:Object.values(discrepancies).every(list=>list.length===0)};
}
