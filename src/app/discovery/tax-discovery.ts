import { parseCsv } from '../intelligence/csv-parser';

export const TAX_FORMAT = 'phase1-tax-v1';
export const TAX_FIELDS = ['tax_year','county_usd','school_usd','municipal_usd','total_usd'] as const;
export type TaxField = typeof TAX_FIELDS[number];
export type TaxDraft = Record<TaxField,string>;
export const LABELS:Record<TaxField,string> = {
  tax_year:'Tax year',county_usd:'County',school_usd:'School',municipal_usd:'Municipal',total_usd:'Total billed',
};
const COMPONENTS = ['county_usd','school_usd','municipal_usd'] as const;
export const EXAMPLE_CSV = 'tax_year,county_usd,school_usd,municipal_usd,total_usd\n2024,900.00,2400.00,900.00,4200.00\n2025,990.00,2640.00,990.00,4620.00\n';
export const blankRow = ():TaxDraft => ({tax_year:'',county_usd:'',school_usd:'',municipal_usd:'',total_usd:''});
export interface TaxIssue { row:number|null; field:TaxField|null; message:string }
export interface TaxCell { cell:string; field:TaxField; label:string; raw:string; used:string }
export interface TaxFinding { id:string; title:string; detail:string; steps:string[]; cells:TaxCell[] }
export interface ComponentChange { label:string; delta:number; before:number; after:number }
export interface TaxAnalysis {
  status:'ready'|'insufficient'|'invalid'; issues:TaxIssue[]; findings:TaxFinding[];
  years:number[]; totals:number[]; changes:ComponentChange[]; delta:number; percent:string|null;
}
export interface TaxInput { rows:TaxDraft[]; columns:TaxField[] }

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
export function parseTaxCsv(text:string):TaxInput {
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
  if(table.headers.length!==TAX_FIELDS.length||!TAX_FIELDS.every(field=>table.headers.includes(field))){
    throw new Error('This is not the supported tax CSV. Use the five exact column names in the example.');
  }
  if(table.rows.length===0)throw new Error('The CSV has no data rows. Add one annual statement per row.');
  if(table.rows.length>2)throw new Error('This preview supports at most two annual statements for one property.');
  const columns=table.headers as TaxField[];
  return {columns,rows:table.rows.map(row=>Object.fromEntries(columns.map((field,i)=>[field,row[i]])) as TaxDraft)};
}

export function analyzeTax(rows:readonly TaxDraft[],columns:readonly TaxField[]=TAX_FIELDS):TaxAnalysis {
  const result:TaxAnalysis={status:'insufficient',issues:[],findings:[],years:[],totals:[],changes:[],delta:0,percent:null};
  if(columns.length!==5||new Set(columns).size!==5||!TAX_FIELDS.every(field=>columns.includes(field))){
    result.status='invalid';result.issues.push({row:null,field:null,message:'The source columns do not match the supported format.'});return result;
  }
  if(rows.length>2){result.status='invalid';result.issues.push({row:null,field:null,message:'Use at most two annual statements for one property.'});return result;}
  const active=rows.map((raw,index)=>({raw,index})).filter(({raw})=>TAX_FIELDS.some(field=>raw[field].trim()!==''));
  const parsed=active.map(({raw,index})=>{
    const values:Record<string,number>={};
    if(!/^(?:19|20|21)\d{2}$/.test(raw.tax_year.trim()))result.issues.push({row:index,field:'tax_year',message:'Enter a four-digit tax year between 1900 and 2199.'});
    for(const field of [...COMPONENTS,'total_usd'] as const){
      const cents=moneyCents(raw[field]);
      if(cents===null)result.issues.push({row:index,field,message:raw[field].trim()===''?'An amount is missing. Enter an amount; 0 is valid.':'Use a non-negative USD amount with up to two decimals, without symbols, commas or formulas.'});
      else values[field]=cents;
    }
    if(COMPONENTS.every(field=>values[field]!==undefined)&&values['total_usd']!==undefined&&COMPONENTS.reduce((n,f)=>n+values[f],0)!==values['total_usd']){
      result.issues.push({row:index,field:'total_usd',message:'The three components do not add up to the total. Correct the amounts before comparing.'});
    }
    return {raw,index,year:Number(raw.tax_year),values};
  });
  if(result.issues.length){result.status='invalid';return result;}
  if(parsed.length<2){result.issues.push({row:null,field:null,message:parsed.length===1?'One statement is not enough to compare years. Add the other annual statement.':'Add two annual statements, or try the example.'});return result;}
  if(parsed[0].year===parsed[1].year){result.status='invalid';result.issues.push({row:null,field:null,message:'Both statements have the same tax year. Use one statement for each of two different years; duplicates are not combined.'});return result;}
  const [before,after]=parsed.sort((a,b)=>a.year-b.year);
  if(after.year-before.year!==1){result.status='invalid';result.issues.push({row:null,field:null,message:'Use two consecutive tax years. This preview does not annualize a gap between years.'});return result;}
  const totalBefore=before.values['total_usd'],totalAfter=after.values['total_usd'];
  const delta=totalAfter-totalBefore;
  const rate=percentChange(delta,totalBefore);
  const cells=(fields:readonly TaxField[]):TaxCell[]=>[before,after].flatMap(row=>fields.map(field=>({
    cell:`${String.fromCharCode(65+columns.indexOf(field))}${row.index+2}`,field,label:LABELS[field],raw:row.raw[field],used:field==='tax_year'?String(row.year):usd(row.values[field]),
  })));
  result.status='ready';result.years=[before.year,after.year];result.totals=[totalBefore,totalAfter];result.delta=delta;result.percent=rate;
  result.findings.push({id:'total',title:delta===0?'Your total stayed the same.':`Your total ${delta>0?'rose':'fell'} by ${usd(Math.abs(delta))}.`,
    detail:rate===null?'The earlier total is $0.00, so a percentage change is not available.':`${rate.replace('−','')} ${delta>0?'increase':delta<0?'decrease':'change'} from ${before.year} to ${after.year}. This is a one-year comparison, not a trend.`,
    steps:[`${usd(totalAfter)} − ${usd(totalBefore)} = ${signedUsd(delta)}`,rate===null?'Percentage unavailable: dividing by an earlier total of zero is undefined.':`(${signedUsd(delta)} ÷ ${usd(totalBefore)}) × 100 = ${rate} (rounded for display; extra precision retained for small non-zero changes)`],cells:cells(['tax_year','total_usd'])});
  result.changes=COMPONENTS.map(field=>({label:LABELS[field],before:before.values[field],after:after.values[field],delta:after.values[field]-before.values[field]}));
  const ranked=[...result.changes].sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
  const biggest=ranked[0];const tied=ranked.filter(c=>Math.abs(c.delta)===Math.abs(biggest.delta));
  const aligned=delta!==0&&result.changes.every(c=>c.delta===0||Math.sign(c.delta)===Math.sign(delta));
  result.findings.push({id:'components',title:biggest.delta===0?'The individual charges stayed the same, too.':delta===0?'The total stayed the same, but the charges shifted.':tied.length>1?'There’s a tie for the biggest change.':`${biggest.label} changed the most.`,
    detail:biggest.delta===0?'The county, school and municipal charges are each unchanged between these two bills.':aligned&&tied.length===1?`${biggest.label} went ${biggest.delta>0?'up':'down'} by ${usd(Math.abs(biggest.delta))}. That makes up ${percentChange(Math.abs(biggest.delta),Math.abs(delta))} of the ${usd(Math.abs(delta))} ${delta>0?'increase':'decrease'}. This shows how the difference adds up, not why it happened.`:delta===0||!aligned?'Some charges went up while others went down, so they partly or fully offset each other. Showing a share of the overall change could be misleading.':'The biggest dollar changes are tied. No single charge changed the most.',
    steps:[...result.changes.map(c=>`${c.label}: ${usd(c.after)} − ${usd(c.before)} = ${signedUsd(c.delta)}`),`${result.changes.map(c=>`(${signedUsd(c.delta)})`).join(' + ')} = ${signedUsd(delta)}`,...(aligned&&tied.length===1?[`(${usd(Math.abs(biggest.delta))} ÷ ${usd(Math.abs(delta))}) × 100 = ${percentChange(Math.abs(biggest.delta),Math.abs(delta))}`]:[])],cells:cells(TAX_FIELDS)});
  const bases=COMPONENTS.map(field=>before.values[field]);const changes=COMPONENTS.map(field=>after.values[field]-before.values[field]);
  if(bases.every(n=>n>0)&&changes[0]!==0&&changes.every((n,i)=>BigInt(n)*BigInt(bases[0])===BigInt(changes[0])*BigInt(bases[i]))){
    const common=percentChange(changes[0],bases[0])!;
    result.findings.push({id:'pattern',title:`All three charges went ${changes[0]>0?'up':'down'} by ${common.replace('−','')}.`,detail:'County, school and municipal charges changed by the same percentage. That doesn’t tell us why, whether the bill is correct, or what happens next.',steps:COMPONENTS.map((field,i)=>`${LABELS[field]}: (${signedUsd(changes[i])} ÷ ${usd(bases[i])}) × 100 = ${common}`),cells:cells(TAX_FIELDS)});
  }
  return result;
}
