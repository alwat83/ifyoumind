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

/**
 * Out-of-order delivery: an older event never overwrites a newer one. Equal timestamps apply
 * (Stripe's `created` has one-second resolution and the same event is already deduplicated).
 */
export function shouldApplyLedgerEvent(incomingCreated:number,storedCreated:unknown):boolean{
  const stored=Number(storedCreated);
  return !Number.isFinite(stored)||incomingCreated>=stored;
}

/** A refund-status update only adds refund details; it never replaces the charge's totals. */
export function mergeLedgerData(existing:Record<string,unknown>|undefined,entry:LedgerEntry):Record<string,unknown>{
  if(entry.data.eventType==='charge.refund.updated'&&existing){
    return {...existing,...Object.fromEntries(Object.entries(entry.data).filter(([key])=>!['amount','amountRefunded','fullyRefunded','currency'].includes(key)))};
  }
  return {...(existing||{}),...entry.data};
}

export interface RevenueInputs{
  payments:Array<Record<string,any>>;
  ledger:Array<Record<string,any>>;
  /** Workspaces that are QA, test, founder or otherwise not genuine customers. */
  excludedOrganizations:Set<string>;
}

/**
 * Founder-dashboard figures from Stripe-confirmed records only, live mode only, QA excluded.
 * A paying customer is a workspace with at least one live payment that is not fully refunded
 * and not under a lost dispute. Amounts are in the currency's minor unit.
 */
export function revenueSummary({payments,ledger,excludedOrganizations}:RevenueInputs){
  const live=payments.filter(p=>p.livemode===true&&p.organizationId&&!excludedOrganizations.has(p.organizationId));
  const charges=new Map<string,Record<string,any>>();
  const disputes=new Map<string,Record<string,any>>();
  for(const entry of ledger){
    if(entry.livemode!==true||!entry.paymentIntentId)continue;
    if(entry.kind==='charge')charges.set(entry.paymentIntentId,entry);
    if(entry.kind==='dispute')disputes.set(entry.paymentIntentId,entry);
  }
  const lost=(pi:unknown)=>typeof pi==='string'&&disputes.get(pi)?.status==='lost';
  const fullyRefunded=(pi:unknown)=>typeof pi==='string'&&charges.get(pi)?.fullyRefunded===true;

  const reportPayments=live.filter(p=>p.offer==='report'&&p.fulfilment!=='duplicate');
  const proStarts=live.filter(p=>p.offer==='pro');
  const renewals=ledger.filter(e=>e.kind==='invoice'&&e.livemode===true&&e.status==='paid'&&e.renewal===true&&
    !(e.organizationId&&excludedOrganizations.has(e.organizationId)));
  const failedRenewals=ledger.filter(e=>e.kind==='invoice'&&e.livemode===true&&e.status==='payment_failed'&&
    !(e.organizationId&&excludedOrganizations.has(e.organizationId)));
  const genuine=new Set(live.filter(p=>!fullyRefunded(p.paymentIntentId)&&!lost(p.paymentIntentId)).map(p=>p.organizationId));
  const ownPaymentIntents=new Set([...live,...renewals].map(p=>p.paymentIntentId).filter(Boolean));
  const refundedMinor=[...charges.values()].filter(c=>ownPaymentIntents.has(c.paymentIntentId))
    .reduce((sum,c)=>sum+(Number(c.amountRefunded)||0),0);

  return {
    genuinePayingCustomers:genuine.size,
    reportPurchases:reportPayments.length,
    reportPurchasesNetOfFullRefunds:reportPayments.filter(p=>!fullyRefunded(p.paymentIntentId)).length,
    proSubscriptionsStarted:proStarts.length,
    proRenewalsPaid:renewals.length,
    proRenewalPaymentsFailed:failedRenewals.length,
    refundedMinorUnits:refundedMinor,
    /** A failed refund leaves the charge's recorded total too high until Stripe reports it again. */
    refundsFailed:[...charges.values()].filter(c=>ownPaymentIntents.has(c.paymentIntentId)&&c.lastRefundStatus==='failed').length,
    disputesOpen:[...disputes.values()].filter(d=>!['won','lost'].includes(String(d.status))).length,
    disputesLost:[...disputes.values()].filter(d=>d.status==='lost').length,
    /** Live refunds or disputes we couldn't tie to a recorded payment: investigate by hand. */
    unmatchedLedgerEntries:[...charges.keys(),...disputes.keys()].filter(pi=>!ownPaymentIntents.has(pi)&&
      ![...payments,...ledger].some(p=>p.paymentIntentId===pi&&p.kind!=='charge'&&p.kind!=='dispute'&&
        excludedOrganizations.has(p.organizationId))).length,
  };
}
