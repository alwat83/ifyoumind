// Formatting for report evidence. Kept free of Angular so test/report-evidence.test.mjs can run it.

export interface FormattableValue { value:number|null; moe:number|null; status:string; }

export function formatUsd(value:number):string{
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
}

export function formatCount(value:number|null):string{
  return value===null?'Not published':Math.round(value).toLocaleString('en-US');
}

export function formatShare(value:number|null):string{
  return value===null?'Not published':`${(value*100).toFixed(1)}%`;
}

/** "± 1,670" style margin text, or an explanation when there is no usable margin. */
export function plusMinus(v:FormattableValue,kind:'count'|'share'|'usd'|'points'):string{
  if(v.value===null)return '';
  if(v.status==='open-ended')return 'open-ended range; no margin';
  if(v.moe===null)return 'no margin of error published';
  if(kind==='share')return `± ${(v.moe*100).toFixed(1)} pts`;
  if(kind==='usd')return `± ${formatUsd(v.moe)}`;
  if(kind==='points')return `± ${v.moe.toFixed(1)} pts`;
  return `± ${Math.round(v.moe).toLocaleString('en-US')}`;
}

export function verdictLabel(verdict:'higher'|'lower'|'similar'|'not-testable'):{text:string;tone:'clear'|'similar'|'unknown'}{
  if(verdict==='higher')return {text:'Real difference: higher',tone:'clear'};
  if(verdict==='lower')return {text:'Real difference: lower',tone:'clear'};
  if(verdict==='similar')return {text:'Within the margin of error',tone:'similar'};
  return {text:"Can't be tested",tone:'unknown'};
}
