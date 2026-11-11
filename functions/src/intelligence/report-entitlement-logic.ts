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

/** Pro workspaces may create this many decisions per calendar month (UTC), as advertised. */
export const PRO_DECISIONS_PER_MONTH=50;

export function decisionLimitFor(plan:unknown):number{
  return plan==='pro'?PRO_DECISIONS_PER_MONTH:FREE_DECISIONS_PER_MONTH;
}

export interface DecisionAllowance{period:string;used:number}

/**
 * Reserves one decision for this period, or refuses. `counted` is the number of decisions already
 * stored this period; the stored counter also includes reservations still in flight. Taking the
 * larger of the two never under-counts (it heals a counter that predates this code), and running
 * this inside a transaction on the workspace makes concurrent requests queue, so at most `limit`
 * reservations succeed.
 */
export function reserveDecision(current:unknown,period:string,counted:number,limit:number):
  {ok:true;next:DecisionAllowance}|{ok:false;used:number}{
  const stored=current&&typeof current==='object'&&(current as DecisionAllowance).period===period
    ? Math.max(0,Number((current as DecisionAllowance).used)||0)
    : 0;
  const used=Math.max(stored,counted);
  if(used>=limit)return {ok:false,used};
  return {ok:true,next:{period,used:used+1}};
}

/** Gives a reservation back when the decision could not be created. Never below zero. */
export function releaseDecision(current:unknown,period:string):DecisionAllowance|null{
  if(!current||typeof current!=='object'||(current as DecisionAllowance).period!==period)return null;
  return {period,used:Math.max(0,(Number((current as DecisionAllowance).used)||0)-1)};
}

export function decisionLimitMessage(plan:unknown):string{
  return plan==='pro'
    ? `You have used the ${PRO_DECISIONS_PER_MONTH} decisions included with Pro this month. They reset on the 1st (UTC). Your existing decisions and reports stay available.`
    : `You have used your ${FREE_DECISIONS_PER_MONTH} free decisions this month. They reset on the 1st (UTC). You can still buy the full Decision Report for any decision you have already created.`;
}
