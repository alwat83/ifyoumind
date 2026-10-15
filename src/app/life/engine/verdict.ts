import type { Criterion, DecisionInput, MoneyLine, OptionKey, Verdict } from './types';

export const CRITERIA:readonly Criterion[]=['money','time','career','people'];
/** A leader needs at least this score margin (scores run 0 to the sum of the weights). */
export const MIN_MARGIN=0.25;

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

/** Weighted score per option: each criterion min-max scaled 0–1 within the pair. */
export function score(values:Values,weights:Record<Criterion,number>):Record<OptionKey,number>{
  let A=0,B=0;
  for(const c of CRITERIA){
    const v=values[c]; if(!v)continue;
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
export function decide(input:DecisionInput,money:[MoneyLine,MoneyLine]):Verdict{
  const values=criterionValues(input,money);
  const used=CRITERIA.filter(c=>values[c]&&(input.weights[c]||0)>0);
  const scores=score(values,input.weights);
  const base=leaderOf(scores);
  const flips=new Set<Criterion>();
  for(const c of CRITERIA){
    if(!values[c])continue;
    for(const d of [-1,1]){
      const w={...input.weights,[c]:Math.min(5,Math.max(0,(input.weights[c]||0)+d))};
      if(leaderOf(score(values,w))!==base)flips.add(c);
    }
  }
  if(base==='tie'||flips.size||!used.length){
    return {kind:'no_clear_winner',flipsOn:[...flips],used,scores};
  }
  return {kind:'leader',leader:base,flipsOn:[],used,scores};
}
