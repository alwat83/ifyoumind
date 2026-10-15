// ifYouMind decision engine: evidence model and claim-grounding checker.
// TEST-ONLY FOUNDATION (Work Package 2). Nothing in functions/src/index.ts imports this file, so it
// deploys no endpoint and changes no production output. Spec: docs/engine/evidence-model.md.
//
// The rule it enforces: every sentence a customer reads is a Claim with a structured Assertion, and
// the checker re-derives the assertion from the evidence values. Citing an evidence id is not enough;
// the cited evidence must actually support what the sentence says.

export type GeographyLevel='place'|'county'|'metro'|'state'|'nation'|'business'|'household';

export interface Source {
  publisher:string;
  dataset:string;
  table?:string;
  url?:string;
  retrievedAt?:string;
}

interface Base { id:string; subject:string; measure:string; unit:string }

/** A published figure from an external source. `moe` is the published 90% margin of error. */
export interface Fact extends Base {
  kind:'fact';
  value:number|null;
  moe?:number|null;
  period:string;
  geography:{level:GeographyLevel;name:string};
  source:Source;
}

/** A value from the customer's own data (an upload or manual entry). */
export interface Observation extends Base {
  kind:'observation';
  value:number|null;
  period:string;
  origin:{uploadId?:string;column?:string;rows?:number;manual?:boolean};
  qualityFlags:string[];
}

/** A deterministic result computed from other evidence. */
export interface Calculation extends Base {
  kind:'calculation';
  value:number|null;
  moe?:number|null;
  method:string;
  version:string;
  inputs:string[];
}

/** A value that depends on assumptions the customer can change. */
export interface Estimate extends Base {
  kind:'estimate';
  value:number|null;
  inputs:string[];
  assumptions:Array<{name:string;value:string|number;editable:boolean}>;
}

/** A possible explanation. Never stated as a cause. */
export interface Hypothesis {
  id:string;
  kind:'hypothesis';
  statement:string;
  supportedBy:string[];
  contradictedBy:string[];
  howToTest:string;
}

export type Evidence=Fact|Observation|Calculation|Estimate|Hypothesis;
export type Valued=Fact|Observation|Calculation|Estimate;

export type Relation='higher'|'lower'|'similar';

export type Assertion=
  | {type:'value';evidence:string;tolerance?:number}
  | {type:'compare';left:string;right:string;relation:Relation}
  | {type:'recommendation';options:string[];criteria:Array<{measure:string;weight:number;better:'higher'|'lower'}>;chosen:string|null}
  | {type:'causal';cause:string;effect:string}
  | {type:'hypothesis';hypothesis:string};

export interface Claim {
  id:string;
  /** Where the sentence is shown and what it implies: a "support" or "concern" must compare. */
  role:'finding'|'support'|'concern'|'verdict'|'next_step'|'limitation';
  text:string;
  evidence:string[];
  assertion?:Assertion;
}

export interface CheckResult { claim:string; ok:boolean; problems:string[] }

/** Same interim closeness band as the live summary when no margin of error is published. */
export const CLOSE_RELATIVE=0.05;
export const CLOSE_POINTS=2;
/** One-sided 90% critical value used by the Census Bureau for ACS comparisons. */
export const Z_90=1.645;

const FORBIDDEN=[/\bprove[sn]?\b/i,/\bguarantee/i,/\bwill (succeed|fail)\b/i,/\bcertain(ly)?\b/i];
const CAUSAL=/\b(because|caus(e|ed|es|ing)|due to|drives?|driven by|results? in|led to)\b/i;
const VERDICT_WORDS=/\b(favou?rable|caution|recommend|best|strong(er)? case)/i;

export class EvidenceStore {
  private readonly items=new Map<string,Evidence>();
  constructor(items:Evidence[]=[]){ for(const item of items)this.add(item); }
  add(item:Evidence):void{
    if(this.items.has(item.id))throw new Error(`Duplicate evidence id ${item.id}`);
    this.items.set(item.id,item);
  }
  get(id:string):Evidence|undefined{ return this.items.get(id); }
  valued(id:string):Valued|undefined{
    const item=this.items.get(id);
    return item&&item.kind!=='hypothesis'?item:undefined;
  }
}

/**
 * Whether `left` is really higher, lower or about the same as `right`.
 * With published margins: the Census Bureau's test (SE = MOE / 1.645, |difference| / SE > 1.645).
 * Without margins: the disclosed closeness band. `tested` says which was used.
 */
export function relationOf(left:Valued,right:Valued):{relation:Relation|null;tested:'z-test'|'closeness-band'|'not-comparable'}{
  if(left.value===null||right.value===null||left.unit!==right.unit||left.measure!==right.measure){
    return {relation:null,tested:'not-comparable'};
  }
  const lm=(left as Fact).moe, rm=(right as Fact).moe;
  if(typeof lm==='number'&&typeof rm==='number'){
    const se=Math.sqrt((lm/Z_90)**2+(rm/Z_90)**2);
    const diff=left.value-right.value;
    if(se===0)return {relation:diff===0?'similar':diff>0?'higher':'lower',tested:'z-test'};
    return {relation:Math.abs(diff)/se>Z_90?(diff>0?'higher':'lower'):'similar',tested:'z-test'};
  }
  if(left.unit==='%'){
    const gap=left.value-right.value;
    return {relation:Math.abs(gap)<CLOSE_POINTS?'similar':gap>0?'higher':'lower',tested:'closeness-band'};
  }
  if(right.value===0)return {relation:left.value===0?'similar':left.value>0?'higher':'lower',tested:'closeness-band'};
  const gap=(left.value-right.value)/Math.abs(right.value);
  return {relation:Math.abs(gap)<CLOSE_RELATIVE?'similar':gap>0?'higher':'lower',tested:'closeness-band'};
}

function mentionsNumber(text:string,value:number):boolean{
  const plain=text.replace(/[$,\s]/g,'');
  const candidates=[String(value),String(Math.round(value)),value.toFixed(1)];
  return candidates.some(candidate=>plain.includes(candidate.replace(/,/g,'')));
}

const RELATION_WORDS:Record<Relation,RegExp>={
  higher:/\b(higher|more|above|greater|larger|stronger)\b/i,
  lower:/\b(lower|less|fewer|below|smaller|weaker)\b/i,
  similar:/\b(similar|about the same|no clear difference|not clearly different)\b/i,
};

/** Weighted score per option; `null` when any criterion is missing for an option. */
function scores(store:EvidenceStore,options:string[],criteria:Array<{measure:string;weight:number;better:'higher'|'lower'}>,evidence:string[],weights?:number[]){
  const facts=evidence.map(id=>store.valued(id)).filter((item):item is Valued=>!!item);
  return options.map(option=>{
    let total=0;
    for(const [i,criterion] of criteria.entries()){
      const values=facts.filter(f=>f.measure===criterion.measure&&f.value!==null);
      const mine=values.find(f=>f.subject===option);
      if(!mine||mine.value===null)return null;
      const min=Math.min(...values.map(v=>v.value as number)), max=Math.max(...values.map(v=>v.value as number));
      const norm=max===min?0.5:(mine.value-min)/(max-min);
      total+=(weights?.[i]??criterion.weight)*(criterion.better==='higher'?norm:1-norm);
    }
    return total;
  });
}

export function checkClaim(claim:Claim,store:EvidenceStore):CheckResult{
  const problems:string[]=[];
  for(const id of claim.evidence)if(!store.get(id))problems.push(`missing_evidence:${id}`);
  for(const pattern of FORBIDDEN)if(pattern.test(claim.text))problems.push('forbidden_certainty');
  const a=claim.assertion;
  if(!a){
    // A stated limitation ("these figures don't measure rent") needs no numbers behind it.
    if(claim.role==='limitation')return {claim:claim.id,ok:problems.length===0,problems};
    problems.push('no_assertion');
    return {claim:claim.id,ok:false,problems};
  }
  if(CAUSAL.test(claim.text)&&a.type!=='causal')problems.push('causal_wording_without_causal_evidence');

  if(a.type==='value'){
    const item=store.valued(a.evidence);
    if(!item)problems.push(`missing_evidence:${a.evidence}`);
    else if(item.value===null)problems.push('value_not_published');
    else if(!mentionsNumber(claim.text,item.value))problems.push('text_does_not_state_the_value');
    if(claim.role==='support'||claim.role==='concern')problems.push('support_or_concern_without_benchmark');
  }

  if(a.type==='compare'){
    const left=store.valued(a.left), right=store.valued(a.right);
    if(!left||!right)problems.push('missing_compared_evidence');
    else{
      const {relation}=relationOf(left,right);
      if(relation===null)problems.push('not_comparable');
      else if(relation!==a.relation)problems.push(`relation_not_supported:${a.relation}_vs_${relation}`);
      if(!RELATION_WORDS[a.relation].test(claim.text))problems.push('text_does_not_state_the_relation');
      if(a.relation!=='similar'&&relation==='similar')problems.push('ranks_within_uncertainty');
    }
  }

  if(a.type==='recommendation'){
    const sum=a.criteria.reduce((total,c)=>total+c.weight,0);
    if(a.chosen!==null){
      if(!a.criteria.length||sum<=0)problems.push('recommendation_without_criteria');
      else{
        const base=scores(store,a.options,a.criteria,claim.evidence);
        if(base.some(score=>score===null))problems.push('recommendation_missing_evidence');
        else{
          const ranked=a.options.map((o,i)=>({o,s:base[i] as number})).sort((x,y)=>y.s-x.s);
          if(ranked[0].o!==a.chosen)problems.push('chosen_option_is_not_top_ranked');
          // Sensitivity: the choice must survive every single weight moved by +/-20%.
          for(const [i] of a.criteria.entries()){
            for(const factor of [0.8,1.2]){
              const weights=a.criteria.map((c,j)=>j===i?c.weight*factor:c.weight);
              const s=scores(store,a.options,a.criteria,claim.evidence,weights) as number[];
              const top=a.options[s.indexOf(Math.max(...s))];
              if(top!==a.chosen&&!problems.includes('choice_not_robust_to_weights'))problems.push('choice_not_robust_to_weights');
            }
          }
        }
      }
    }else if(VERDICT_WORDS.test(claim.text)&&!/no clear/i.test(claim.text)){
      problems.push('no_winner_claim_uses_verdict_words');
    }
  }

  if(a.type==='causal'){
    problems.push('causal_claim_from_observational_evidence');
  }

  if(a.type==='hypothesis'){
    const h=store.get(a.hypothesis);
    if(!h||h.kind!=='hypothesis')problems.push('missing_hypothesis');
    if(!/\b(may|might|could|possible|one explanation)\b/i.test(claim.text))problems.push('hypothesis_stated_as_fact');
  }

  return {claim:claim.id,ok:problems.length===0,problems:[...new Set(problems)]};
}

export function checkClaims(claims:Claim[],store:EvidenceStore):CheckResult[]{
  return claims.map(claim=>checkClaim(claim,store));
}
