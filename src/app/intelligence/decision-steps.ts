export type DecisionType='business'|'compare'|'growth'|'custom';

/** Places typed into the comparison box, separated by semicolons, at most three. */
export function parseComparisons(input:string):string[]{
  return (input||'').split(';').map(value=>value.trim()).filter(Boolean).slice(0,3);
}

/** Business and comparison decisions need at least one comparison city to be useful. */
export function requiresComparison(type:DecisionType):boolean{
  return type==='business'||type==='compare';
}

/** The flow has three steps (type, place, context); visitors who arrive with a type skip the first. */
export function stepProgress(step:number,startStep:number):{current:number;total:number}{
  const total=3-startStep+1;
  return {current:Math.min(Math.max(step-startStep+1,1),total),total};
}
