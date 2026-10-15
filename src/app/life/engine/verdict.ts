import type { Criterion, DecisionInput, MoneyComparison, MoneyLine, OptionKey, Verdict } from './types';

export const CRITERIA:readonly Criterion[]=['money','time','career','people'];
/** A leader needs at least this score margin (scores run 0 to the sum of the weights). */
export const MIN_MARGIN=0.25;
/** Commute times this close are treated as the same (a reading aid, disclosed with the result). */
export const COMMUTE_TIE_MINUTES=5;

type Values=Record<Criterion,[number,number]|null>;

/** Raw values per criterion, or null when either option lacks it (it is then not used). */
export function criterionValues(input:DecisionInput,money:[MoneyLine,MoneyLine]):Values{
  const [a,b]=input.options;
  const rating=(x?:number,y?:number):[number,number]|null=>
    Number.isFinite(x)&&Number.isFinite(y)?[x as number,y as number]:null;
  return {
    money:[money[0].buyingPower,money[1].buyingPower],
    time:[a.commuteMinutes,b.commuteMinutes],
    career:rating(a.career,b.career),
    people:rating(a.people,b.people),
  };
}

const BETTER:Record<Criterion,'higher'|'lower'>={money:'higher',time:'lower',career:'higher',people:'higher'};
export const betterOf=(c:Criterion)=>BETTER[c];

/**
 * Criteria whose two values are too close to separate the options. Min-max scaling would otherwise
 * turn a $50 or one-minute difference into a full point, so they are left out of the score.
 */
export function tiedCriteria(values:Values,cmp:MoneyComparison):Set<Criterion>{
  const tied=new Set<Criterion>();
  if(cmp.small||cmp.leader==='none')tied.add('money');
  const t=values.time; if(t&&Math.abs(t[0]-t[1])<COMMUTE_TIE_MINUTES)tied.add('time');
  for(const c of ['career','people'] as const){ const v=values[c]; if(v&&v[0]===v[1])tied.add(c); }
  return tied;
}

/** Weighted score per option: each criterion min-max scaled 0–1 within the pair. */
export function score(values:Values,weights:Record<Criterion,number>,skip:Set<Criterion>=new Set()):Record<OptionKey,number>{
  let A=0,B=0;
  for(const c of CRITERIA){
    const v=values[c]; if(!v||skip.has(c))continue;
    const w=Math.max(0,weights[c]||0);
    const [lo,hi]=[Math.min(...v),Math.max(...v)];
    const norm=(x:number)=>hi===lo?.5:(x-lo)/(hi-lo);
    const fit=(x:number)=>BETTER[c]==='higher'?norm(x):1-norm(x);
    A+=w*fit(v[0]); B+=w*fit(v[1]);
  }
  return {A,B};
}

function leaderOf(s:Record<OptionKey,number>):OptionKey|'tie'{
  return Math.abs(s.A-s.B)<MIN_MARGIN?'tie':s.A>s.B?'A':'B';
}

/**
 * A leader only when it holds for every one-step (±1 on 0–5) change to any single weight.
 * This is at least as strict as the evidence checker's ±20% rule, so every leader passes it.
 */
export function decide(input:DecisionInput,money:[MoneyLine,MoneyLine],cmp:MoneyComparison):Verdict{
  const values=criterionValues(input,money);
  const tied=tiedCriteria(values,cmp);
  const used=CRITERIA.filter(c=>values[c]&&!tied.has(c)&&(input.weights[c]||0)>0);
  const ignored=CRITERIA.filter(c=>!used.includes(c)).map(c=>({criterion:c,
    reason:!values[c]?'not_rated' as const:tied.has(c)?'not_different' as const:'no_weight' as const}));
  const scores=score(values,input.weights,tied);
  const base=leaderOf(scores);
  const flips=new Set<Criterion>();
  for(const c of CRITERIA){
    if(!values[c]||tied.has(c))continue;
    for(const d of [-1,1]){
      const w={...input.weights,[c]:Math.min(5,Math.max(0,(input.weights[c]||0)+d))};
      if(leaderOf(score(values,w,tied))!==base)flips.add(c);
    }
  }
  if(base==='tie'||flips.size||!used.length){
    return {kind:'no_clear_winner',flipsOn:[...flips],used,ignored,scores};
  }
  return {kind:'leader',leader:base,flipsOn:[],used,ignored,scores};
}
