import { createHmac, timingSafeEqual } from 'node:crypto';

export function validStripeSignature(
  payload:string,
  header:string,
  secret:string,
  nowSeconds=Math.floor(Date.now()/1000),
):boolean{
  const pieces=header.split(',');
  const timestamp=pieces.find(part=>part.startsWith('t='))?.slice(2);
  const signatures=pieces.filter(part=>part.startsWith('v1=')).map(part=>part.slice(3));
  if(!timestamp||!signatures.length)return false;
  const parsedTimestamp=Number(timestamp);
  if(!Number.isFinite(parsedTimestamp)||Math.abs(nowSeconds-parsedTimestamp)>300)return false;
  const expected=createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  const expectedBuffer=Buffer.from(expected);
  return signatures.some(signature=>{
    const actual=Buffer.from(signature);
    return actual.length===expectedBuffer.length&&timingSafeEqual(actual,expectedBuffer);
  });
}

/** Which Stripe mode a secret or restricted key belongs to. Test keys cannot take real payments. */
export function stripeKeyMode(key:unknown):'live'|'test'|'unknown'{
  if(typeof key!=='string')return 'unknown';
  if(/^(sk|rk)_live_/.test(key))return 'live';
  if(/^(sk|rk)_test_/.test(key))return 'test';
  return 'unknown';
}

// Copied from the sandbox to the live account on 2026-10-10.
export const STRIPE_PRICES={
  live:{pro:'price_1UPAPiCigpG2y4hQsIFcm3Sm',report:'price_1UPAPiCigpG2y4hQ2vedWuSB'},
  test:{pro:'price_1UNpHICZjBRiXCDejbdIRMk2',report:'price_1UNpHNCZjBRiXCDeoCCxrn8u'},
} as const;

export function stripePriceIds(
  mode:'live'|'test'|'unknown',
  overrides:{pro?:string;report?:string}={},
):{pro:string;report:string}{
  const base=mode==='live'?STRIPE_PRICES.live:STRIPE_PRICES.test;
  return {
    pro:overrides.pro?.trim()||base.pro,
    report:overrides.report?.trim()||base.report,
  };
}

export function grantsPro(status:unknown):boolean{
  return status==='active'||status==='trialing';
}

export function shouldApplySubscriptionEvent(
  incomingCreated:unknown,
  lastAppliedCreated:unknown,
):boolean{
  const incoming=Number(incomingCreated);
  const previous=Number(lastAppliedCreated);
  if(!Number.isFinite(incoming))return false;
  if(!Number.isFinite(previous))return true;
  return incoming>=previous;
}

/**
 * Whether a subscription event may change the workspace's plan. Events for a different subscription
 * (such as a duplicate being cancelled) must not downgrade a workspace whose current subscription
 * still grants Pro.
 */
export function subscriptionEventMayChangePlan(
  current:{stripeSubscriptionId?:unknown;stripeSubscriptionStatus?:unknown},
  incomingSubscriptionId:unknown,
  incomingStatus:unknown,
):boolean{
  const currentId=typeof current.stripeSubscriptionId==='string'?current.stripeSubscriptionId:'';
  if(!currentId||currentId===incomingSubscriptionId)return true;
  if(!grantsPro(current.stripeSubscriptionStatus))return true;
  return grantsPro(incomingStatus);
}
