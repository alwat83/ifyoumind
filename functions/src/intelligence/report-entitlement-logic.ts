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

// A full Decision Report compares the main location with up to three places on every plan. The free
// Decision Brief shows one comparison; Pro briefs show all three.
export const REPORT_COMPARISON_LIMIT=3;
export const FREE_BRIEF_COMPARISONS=1;

export function freeBriefComparisonCount(plan:unknown,comparisons:number):number|null{
  if(plan==='pro'||comparisons<=FREE_BRIEF_COMPARISONS)return null;
  return FREE_BRIEF_COMPARISONS;
}

/**
 * What a decision returns for a given report access. Unlocked reports get the full brief and every
 * comparison; otherwise free-plan decisions return their one-comparison free brief and name the
 * places held back for the full report.
 */
export function decisionView(project:Record<string,any>,access:ReportAccess){
  const comparisonLocations:string[]=Array.isArray(project.comparisonLocations)?project.comparisonLocations:[];
  const freeCount=typeof project.freeComparisonCount==='number'?project.freeComparisonCount:null;
  if(access!=='none'||!project.freeBrief||freeCount===null){
    return {brief:project.brief,comparisonLocations,reportOnlyLocations:[] as string[]};
  }
  return {
    brief:project.freeBrief,
    comparisonLocations:comparisonLocations.slice(0,freeCount),
    reportOnlyLocations:comparisonLocations.slice(freeCount),
  };
}

/** Free workspaces may create this many decisions per calendar month (UTC). */
export const FREE_DECISIONS_PER_MONTH=3;

/** Start of the free-decision period that contains `now`: the 1st of the month, 00:00 UTC. */
export function freeDecisionPeriodStart(now:Date=new Date()):Date{
  return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
}

/** True when a free workspace has used its monthly decisions. Pro workspaces are not limited here. */
export function freeDecisionLimitReached(plan:unknown,createdThisPeriod:number):boolean{
  return plan!=='pro'&&createdThisPeriod>=FREE_DECISIONS_PER_MONTH;
}
