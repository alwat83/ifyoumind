import { parseCsv } from '../intelligence/csv-parser';
export interface DiscoveryIssue { row:number|null; field:string|null; message:string }
export interface EvidenceCell { cell:string; field:string; label:string; raw:string; used:string }
export interface DiscoveryFinding { id:string; title:string; detail:string; steps:string[]; cells:EvidenceCell[] }
export interface ComponentChange { label:string; delta:number; before:number; after:number }
export interface DiscoveryAnalysis {
  status:'ready'|'insufficient'|'invalid';issues:DiscoveryIssue[];findings:DiscoveryFinding[];
  years:(string|number)[];totals:number[];changes:ComponentChange[];delta:number;percent:string|null;
}
export const emptyAnalysis=():DiscoveryAnalysis=>({status:'insufficient',issues:[],findings:[],years:[],totals:[],changes:[],delta:0,percent:null});
/** Strict decimal USD, in exact integer cents. Missing and zero are different. */
export function moneyCents(raw:string):number|null {
  const text=raw.trim();
  if(!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(text))return null;
  const [whole,fraction='']=text.split('.');
  return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
export function usd(cents:number):string {
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(cents/100);
}
export const signedUsd = (cents:number):string => `${cents>0?'+':cents<0?'−':''}${usd(Math.abs(cents))}`;
export function percentChange(change:number,base:number):string|null {
  if(base===0)return null;
  // BigInt avoids floating-point intermediate rounding; one decimal, ties away from zero.
  let places=1;
  let scale=10n;
  const denominator=BigInt(base);
  let rounded=(BigInt(Math.abs(change))*100n*scale+denominator/2n)/denominator;
  // Keep a small real change from being described as 0%; supported money bounds need ≤10 places.
  while(change!==0&&rounded===0n&&places<10){
    places++;scale*=10n;
    rounded=(BigInt(Math.abs(change))*100n*scale+denominator/2n)/denominator;
  }
  const fraction=(rounded%scale).toString().padStart(places,'0').replace(/0+$/,'');
  return `${change<0&&rounded!==0n?'−':''}${rounded/scale}${fraction?'.'+fraction:''}%`;
}
/** The same strict tokenizer boundary for both explicitly recognized schemas. */
export function recognizedCsv<F extends string>(text:string,fields:readonly F[],kind:string):{columns:F[];rows:Record<F,string>[]} {
  if(text.length>2_000_000||text.includes('\0'))throw new Error('Use a text CSV no larger than 2 MB.');
  const input=text.replace(/^\uFEFF/,'');
  let state:'plain'|'quoted'|'closed'='plain';
  let atStart=true;
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(state==='quoted'){
      if(c==='"'){if(input[i+1]==='"')i++;else state='closed';}
      else if(c==='\n'||c==='\r')throw new Error('Use one line per statement. Multiline values are not supported.');
    }else if(c===','||c==='\n'||c==='\r'){state='plain';atStart=true;}
    else if(state==='closed'||(c==='"'&&!atStart))throw new Error('The CSV has invalid quotation marks. Download the example format and try again.');
    else if(c==='"'){state='quoted';atStart=false;}
    else atStart=false;
  }
  const table=parseCsv(input);
  if(table.headers.length!==fields.length||!fields.every(field=>table.headers.includes(field)))throw new Error(`This is not the supported ${kind} CSV. Use the exact column names in the example.`);
  if(!table.rows.length)throw new Error('The CSV has no data rows. Add one bill per row.');
  if(table.rows.length>2)throw new Error('This preview supports at most two bills.');
  const columns=table.headers as F[];
  return {columns,rows:table.rows.map(row=>Object.fromEntries(columns.map((field,i)=>[field,row[i]])) as Record<F,string>)};
}
/** Shared paired-charge discovery, not a second category-specific analysis engine. */
export function compareCharges(totalBefore:number,totalAfter:number,periods:(number|string)[],changes:ComponentChange[],totalCells:EvidenceCell[],allCells:EvidenceCell[],pattern=false,comparisonNote="This is a one-year comparison, not a trend."):{findings:DiscoveryFinding[];delta:number;percent:string|null} {
  const delta=totalAfter-totalBefore,rate=percentChange(delta,totalBefore),findings:DiscoveryFinding[]=[];
  findings.push({id:'total',title:delta===0?'Your total stayed the same.':`Your total ${delta>0?'rose':'fell'} by ${usd(Math.abs(delta))}.`,
    detail:rate===null?'The earlier total is $0.00, so a percentage change is not available.':`${rate.replace('−','')} ${delta>0?'increase':delta<0?'decrease':'change'} from ${periods[0]} to ${periods[1]}. ${comparisonNote}`,
    steps:[`${usd(totalAfter)} − ${usd(totalBefore)} = ${signedUsd(delta)}`,rate===null?'Percentage unavailable: dividing by an earlier total of zero is undefined.':`(${signedUsd(delta)} ÷ ${usd(totalBefore)}) × 100 = ${rate} (rounded for display; extra precision retained for small non-zero changes)`],cells:totalCells});
  
  if(changes.length){
  const ranked=[...changes].sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
  const biggest=ranked[0];const tied=ranked.filter(c=>Math.abs(c.delta)===Math.abs(biggest.delta));
  const aligned=delta!==0&&changes.every(c=>c.delta===0||Math.sign(c.delta)===Math.sign(delta));
  findings.push({id:'components',title:biggest.delta===0?'The individual charges stayed the same, too.':delta===0?'The total stayed the same, but the charges shifted.':tied.length>1?'There’s a tie for the biggest change.':`${biggest.label} changed the most.`,
    detail:biggest.delta===0?(pattern?'The county, school and municipal charges are each unchanged between these two bills.':'Each identified charge is unchanged between these two bills.'):aligned&&tied.length===1?`${biggest.label} went ${biggest.delta>0?'up':'down'} by ${usd(Math.abs(biggest.delta))}. That makes up ${percentChange(Math.abs(biggest.delta),Math.abs(delta))} of the ${usd(Math.abs(delta))} ${delta>0?'increase':'decrease'}. This shows how the difference adds up, not why it happened.`:delta===0||!aligned?'Some charges went up while others went down, so they partly or fully offset each other. Showing a share of the overall change could be misleading.':'The biggest dollar changes are tied. No single charge changed the most.',
    steps:[...changes.map(c=>`${c.label}: ${usd(c.after)} − ${usd(c.before)} = ${signedUsd(c.delta)}`),`${changes.map(c=>`(${signedUsd(c.delta)})`).join(' + ')} = ${signedUsd(delta)}`,...(aligned&&tied.length===1?[`(${usd(Math.abs(biggest.delta))} ÷ ${usd(Math.abs(delta))}) × 100 = ${percentChange(Math.abs(biggest.delta),Math.abs(delta))}`]:[])],cells:allCells});
  }
  const bases=changes.map(c=>c.before),deltas=changes.map(c=>c.delta);
  if(pattern && changes.length>0 && bases.every(n=>n>0)&&deltas[0]!==0&&deltas.every((n,i)=>BigInt(n)*BigInt(bases[0])===BigInt(deltas[0])*BigInt(bases[i]))){
    const common=percentChange(deltas[0],bases[0])!;
    findings.push({id:'pattern',title:`All three charges went ${deltas[0]>0?'up':'down'} by ${common.replace('−','')}.`,detail:'County, school and municipal charges changed by the same percentage. That doesn’t tell us why, whether the bill is correct, or what happens next.',steps:changes.map(c=>`${c.label}: (${signedUsd(c.delta)} ÷ ${usd(c.before)}) × 100 = ${common}`),cells:allCells});
  }
  return {findings,delta,percent:rate};
}
