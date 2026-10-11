// Pure entitlement and billing-safeguard rules, kept free of Firebase so they can be unit tested.

export type ReportAccess='purchased'|'pro'|'none';

export function decisionReportAccess(project:Record<string,unknown>|undefined|null):ReportAccess{
  if(project?.decisionReportPurchased===true)return 'purchased';
  if(project?.decisionReportIncludedWithPro===true)return 'pro';
  return 'none';
}

export function allowancePeriod(now=new Date()):string{
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}`;
}

/** Included Pro reports already used in the given period, from the org's stored counter. */
export function includedReportsUsed(org:Record<string,any>|undefined|null,period:string):number{
  const usage=org?.proReportAllowance;
  if(!usage||usage.period!==period)return 0;
  const used=Number(usage.used);
  return Number.isFinite(used)&&used>0?Math.floor(used):0;
}

export type UnlockDecision=
  |{ok:true;alreadyUnlocked:boolean}
  |{ok:false;reason:'not-pro'|'allowance-exhausted'};

export function proUnlockDecision(input:{
  plan:unknown;
  access:ReportAccess;
  used:number;
  limit:number;
}):UnlockDecision{
  if(input.access!=='none')return {ok:true,alreadyUnlocked:true};
  if(input.plan!=='pro')return {ok:false,reason:'not-pro'};
  if(input.used>=input.limit)return {ok:false,reason:'allowance-exhausted'};
  return {ok:true,alreadyUnlocked:false};
}

// Statuses where Stripe still holds a live subscription for the customer. Starting a second Pro
// checkout in any of these states would create a duplicate subscription and a second charge.
const LIVE_SUBSCRIPTION_STATUSES=new Set(['active','trialing','past_due','unpaid','paused']);

export function blocksNewProCheckout(org:Record<string,unknown>|undefined|null):boolean{
  if(!org)return false;
  if(org.plan==='pro')return true;
  return typeof org.stripeSubscriptionStatus==='string'&&LIVE_SUBSCRIPTION_STATUSES.has(org.stripeSubscriptionStatus);
}

export function blocksReportCheckout(project:Record<string,unknown>|undefined|null):boolean{
  return decisionReportAccess(project)!=='none';
}
