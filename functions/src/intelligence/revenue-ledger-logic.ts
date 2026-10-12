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

/**
 * Founder-dashboard figures from Stripe-confirmed records only, live mode only, QA excluded.
 * Refunds and disputes are attributed to a workspace by payment intent (one-time reports) or, when
 * Stripe gives none (subscriptions on current API versions), by Stripe customer. A workspace is a
 * genuine paying customer when it has more confirmed live payments than fully reversed ones
 * (fully refunded, or a dispute lost). Amounts are in the currency's minor unit.
 */
export function revenueSummary({payments,ledger,excludedOrganizations}:RevenueInputs){
  const isLive=(r:Record<string,any>)=>r.livemode===true;
  const excluded=(org:unknown)=>typeof org==='string'&&excludedOrganizations.has(org);
  const livePayments=payments.filter(p=>isLive(p)&&p.organizationId);
  const invoices=ledger.filter(e=>e.kind==='invoice'&&isLive(e));

  const orgByIntent=new Map<string,string>();
  const orgByCustomer=new Map<string,string>();
  for(const p of livePayments){
    if(p.paymentIntentId)orgByIntent.set(p.paymentIntentId,p.organizationId);
    if(p.customerId)orgByCustomer.set(p.customerId,p.organizationId);
  }
  for(const i of invoices){
    if(i.paymentIntentId&&i.organizationId)orgByIntent.set(i.paymentIntentId,i.organizationId);
    if(i.customerId&&i.organizationId)orgByCustomer.set(i.customerId,i.organizationId);
  }
  const ownerOf=(e:Record<string,any>):string|null=>
    (e.paymentIntentId&&orgByIntent.get(e.paymentIntentId))||(e.customerId&&orgByCustomer.get(e.customerId))||null;

  const charges=ledger.filter(e=>e.kind==='charge'&&isLive(e));
  const disputes=ledger.filter(e=>e.kind==='dispute'&&isLive(e));
  const counted=(e:Record<string,any>)=>{const org=ownerOf(e);return !!org&&!excluded(org);};

  const reportPayments=livePayments.filter(p=>p.offer==='report'&&p.fulfilment!=='duplicate'&&!excluded(p.organizationId));
  const proStarts=livePayments.filter(p=>p.offer==='pro'&&!excluded(p.organizationId));
  const renewals=invoices.filter(e=>e.status==='paid'&&e.renewal===true&&!excluded(e.organizationId));
  const failedRenewals=invoices.filter(e=>e.status==='payment_failed'&&!excluded(e.organizationId));

  // Reversals, one per charge (a refunded charge that was also disputed counts once).
  const reversedCharges=new Map<string,string>();
  for(const c of charges)if(c.fullyRefunded===true&&counted(c))reversedCharges.set(c.chargeId||c.paymentIntentId,ownerOf(c)!);
  for(const d of disputes)if(d.status==='lost'&&counted(d))reversedCharges.set(d.chargeId||d.paymentIntentId,ownerOf(d)!);
  const reversedReportIntents=new Set([...charges.filter(c=>c.fullyRefunded===true),...disputes.filter(d=>d.status==='lost')]
    .map(e=>e.paymentIntentId).filter(Boolean));

  const paid=new Map<string,number>();
  for(const p of [...reportPayments,...proStarts])paid.set(p.organizationId,(paid.get(p.organizationId)||0)+1);
  for(const r of renewals)if(r.organizationId)paid.set(r.organizationId,(paid.get(r.organizationId)||0)+1);
  const reversed=new Map<string,number>();
  for(const org of reversedCharges.values())reversed.set(org,(reversed.get(org)||0)+1);
  const genuine=[...paid.entries()].filter(([org,n])=>n>(reversed.get(org)||0)).map(([org])=>org);

  return {
    genuinePayingCustomers:genuine.length,
    reportPurchases:reportPayments.length,
    reportPurchasesNetOfFullRefunds:reportPayments.filter(p=>!reversedReportIntents.has(p.paymentIntentId)).length,
    proSubscriptionsStarted:proStarts.length,
    proRenewalsPaid:renewals.length,
    proRenewalPaymentsFailed:failedRenewals.length,
    refundedMinorUnits:charges.filter(counted).reduce((sum,c)=>sum+(Number(c.amountRefunded)||0),0),
    /** A failed refund leaves the charge's recorded total too high until Stripe reports it again. */
    refundsFailed:charges.filter(c=>counted(c)&&c.lastRefundStatus==='failed').length,
    disputesOpen:disputes.filter(d=>counted(d)&&!CLOSED_DISPUTE_STATUSES.has(String(d.status))).length,
    disputesLost:disputes.filter(d=>counted(d)&&d.status==='lost').length,
    /** Live refunds or disputes that can't be tied to any workspace: investigate by hand. */
    unmatchedLedgerEntries:[...charges,...disputes].filter(e=>!ownerOf(e)).length,
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
  const result={
    paymentsMissing:[] as string[],
    paymentAmountMismatch:[] as string[],
    paymentsNotInStripe:[] as string[],
    renewalsMissing:[] as string[],
    refundsMissingOrDifferent:[] as string[],
    disputesMissingOrDifferent:[] as string[],
  };
  for(const s of paidSessions){
    const p=payments.get(s.id);
    if(!p)result.paymentsMissing.push(s.id);
    else if(p.amountTotal!==s.amount_total)result.paymentAmountMismatch.push(s.id);
  }
  const stripeSessionIds=new Set(paidSessions.map(s=>s.id));
  for(const id of payments.keys())if(!stripeSessionIds.has(id))result.paymentsNotInStripe.push(String(id));
  for(const i of stripe.invoices){
    if(i.livemode!==true||i.status!=='paid'||i.billing_reason!=='subscription_cycle')continue;
    if(ledger.get(`invoice:${i.id}`)?.status!=='paid')result.renewalsMissing.push(i.id);
  }
  for(const c of stripe.charges){
    if(c.livemode!==true||!(c.amount_refunded>0))continue;
    if(ledger.get(`charge:${c.id}`)?.amountRefunded!==c.amount_refunded)result.refundsMissingOrDifferent.push(c.id);
  }
  for(const d of stripe.disputes){
    if(d.livemode!==true)continue;
    if(ledger.get(`dispute:${d.id}`)?.status!==d.status)result.disputesMissingOrDifferent.push(d.id);
  }
  return {...result,clean:Object.values(result).every(list=>list.length===0)};
}
