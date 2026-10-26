import {compareCharges,emptyAnalysis,moneyCents,percentChange,recognizedCsv,usd} from './discovery-core';
import type {DiscoveryAnalysis,EvidenceCell} from './discovery-core';
export const ELECTRICITY_FIELDS=['period_start','period_end','unit','currency','consumption_kwh','charge_basis','fixed_usd','variable_usd','other_usd','total_usd'] as const;
export type ElectricityField=typeof ELECTRICITY_FIELDS[number];
export type ElectricityDraft=Record<ElectricityField,string>;
export const ELECTRICITY_LABELS:Record<ElectricityField,string>={period_start:'Period start',period_end:'Period end (not included)',unit:'Usage unit',currency:'Currency',consumption_kwh:'Consumption (kWh)',charge_basis:'Charge labels (identified or unknown)',fixed_usd:'Identified fixed charges (USD)',variable_usd:'Identified variable charges (USD)',other_usd:'Other charges (USD)',total_usd:'Total billed (USD)'};
export const ELECTRICITY_CSV=ELECTRICITY_FIELDS.join(',')+'\n2025-07-01,2025-08-01,kWh,USD,600,identified,20.00,90.00,10.00,120.00\n2026-07-01,2026-08-01,kWh,USD,660,identified,20.00,115.20,10.00,145.20\n';
export const blankElectricity=():ElectricityDraft=>Object.fromEntries(ELECTRICITY_FIELDS.map(f=>[f,''])) as ElectricityDraft;
export const parseElectricityCsv=(text:string)=>recognizedCsv(text,ELECTRICITY_FIELDS,'electricity');
/** Exact thousandths of kWh; no locale guesses, formulas or conversions. */
export function consumptionUnits(raw:string):number|null {
 const s=raw.trim();if(!/^(?:0|[1-9]\d{0,8})(?:\.\d{1,3})?$/.test(s))return null;
 const [whole,fraction='']=s.split('.');return Number(whole)*1000+Number(fraction.padEnd(3,'0'));
}
export const kwh=(units:number):string=>`${new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(units/1000)} kWh`;
function dateValue(raw:string):number|null {
 const s=raw.trim();if(!/^(?:19|20|21)\d{2}-\d{2}-\d{2}$/.test(s))return null;
 const n=Date.parse(s+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s?n:null;
}
/** Rounded only for display; preserve extra precision instead of showing a nonzero cost as zero. */
export function unitCost(cents:number,usage:number):string|null {
 if(usage===0)return null;
 let places=4,scale=10000n;
 const numerator=BigInt(cents)*10n,denominator=BigInt(usage);
 let rounded=(numerator*scale+denominator/2n)/denominator;
 while(cents!==0&&rounded===0n&&places<14){places++;scale*=10n;rounded=(numerator*scale+denominator/2n)/denominator;}
 return `$${rounded/scale}.${(rounded%scale).toString().padStart(places,'0')}`;
}
export function analyzeElectricity(rows:readonly ElectricityDraft[],columns:readonly ElectricityField[]=ELECTRICITY_FIELDS):DiscoveryAnalysis {
 const result=emptyAnalysis();
 const issue=(row:number|null,field:ElectricityField|null,message:string)=>result.issues.push({row,field,message});
 if(columns.length!==ELECTRICITY_FIELDS.length||new Set(columns).size!==columns.length||!ELECTRICITY_FIELDS.every(f=>columns.includes(f))){issue(null,null,'The source columns do not match the electricity format.');result.status='invalid';return result;}
 if(rows.length>2){issue(null,null,'Use at most two bills for one household meter.');result.status='invalid';return result;}
 const parsed=rows.map((raw,index)=>({raw,index})).filter(({raw})=>ELECTRICITY_FIELDS.some(f=>raw[f].trim()!=='')).map(({raw,index})=>{
  const start=dateValue(raw.period_start),end=dateValue(raw.period_end),usage=consumptionUnits(raw.consumption_kwh),total=moneyCents(raw.total_usd),basis=raw.charge_basis.trim();
  if(start===null)issue(index,'period_start','Enter a real YYYY-MM-DD start date between 1900 and 2199.');
  if(end===null)issue(index,'period_end','Enter a real YYYY-MM-DD end date (the first day not billed).');
  const days=start!==null&&end!==null?(end-start)/86400000:0;
  if(start!==null&&end!==null&&(days<1||days>62))issue(index,'period_end','Use a billing period from 1 to 62 days, with the end after the start.');
  if(raw.unit.trim()!=='kWh')issue(index,'unit','Only kWh is supported. Do not mix kWh, MWh, kW or meter readings.');
  if(raw.currency.trim()!=='USD')issue(index,'currency','Only USD is supported; no currency conversion is performed.');
  if(usage===null)issue(index,'consumption_kwh','Enter billed consumption as a non-negative kWh amount, up to three decimals. Missing is not zero.');
  if(total===null)issue(index,'total_usd','Enter the non-negative total billed in USD, up to two decimals. Missing is not zero.');
  const charges=['fixed_usd','variable_usd','other_usd'] as const;
  const amounts=charges.map(f=>moneyCents(raw[f]));
  if(!['identified','unknown'].includes(basis))issue(index,'charge_basis','Use identified only when the bill explicitly identifies the charge types; otherwise use unknown.');
  if(basis==='identified'){
   charges.forEach((f,i)=>{if(amounts[i]===null)issue(index,f,'Enter each identified charge amount. Use an explicit 0 for a charge that is absent.');});
   if(amounts.every(n=>n!==null)&&total!==null&&amounts.reduce<number>((a,n)=>a+(n??0),0)!==total)issue(index,'total_usd','Identified fixed, variable and other charges must add up to the total billed.');
  }else if(basis==='unknown'&&charges.some(f=>raw[f].trim()!==''))issue(index,'charge_basis','For unknown charge types, leave the three charge amounts blank. We will not guess a fixed or variable split.');
  return {raw,index,start:start??0,end:end??0,days,usage:usage??0,total:total??0,basis,amounts:amounts.map(n=>n??0)};
 });
 if(result.issues.length){result.status='invalid';return result;}
 if(parsed.length<2){issue(null,null,'One bill is not enough to compare periods. Add the second compatible bill, or try the example.');return result;}
 const [before,after]=parsed.sort((a,b)=>a.start-b.start);
 const a=new Date(before.start),b=new Date(after.start);
 if(before.end>after.start||before.start===after.start)issue(null,null,'Duplicate or overlapping billing periods cannot be compared.');
 if(before.days!==after.days||b.getUTCFullYear()-a.getUTCFullYear()!==1||b.getUTCMonth()!==a.getUTCMonth()||b.getUTCDate()!==a.getUTCDate())issue(null,null,'Use the same start month and day in adjacent years, with equal billing days. Different seasons or period lengths are not normalized in this prototype.');
 if(result.issues.length){result.status='invalid';return result;}
 const cells=(fields:readonly ElectricityField[]):EvidenceCell[]=>[before,after].flatMap(row=>fields.map(field=>({cell:`${String.fromCharCode(65+columns.indexOf(field))}${row.index+2}`,field,label:ELECTRICITY_LABELS[field],raw:row.raw[field],used:field==='consumption_kwh'?kwh(row.usage):field.endsWith('_usd')&&row.basis==='identified'||field==='total_usd'?usd(moneyCents(row.raw[field])??0):row.raw[field].trim()})));
 result.status='ready';result.years=[before.raw.period_start.trim(),after.raw.period_start.trim()];result.totals=[before.total,after.total];
 const known=before.basis==='identified'&&after.basis==='identified';
 if(known)result.changes=['Fixed charges','Variable charges','Other charges'].map((label,i)=>({label,before:before.amounts[i],after:after.amounts[i],delta:after.amounts[i]-before.amounts[i]}));
 Object.assign(result,compareCharges(before.total,after.total,result.years,result.changes,cells(['period_start','period_end','currency','total_usd']),cells(ELECTRICITY_FIELDS),false,`${before.days} billing days in each period. Matching periods do not prove why the bill changed.`));
 const usageDelta=after.usage-before.usage,usagePercent=percentChange(usageDelta,before.usage);
 result.findings.splice(1,0,{id:'consumption',title:usageDelta===0?'You used the same amount of electricity.':`You used ${kwh(Math.abs(usageDelta))} ${usageDelta>0?'more':'less'}.`,detail:usagePercent===null?'The earlier consumption is zero, so a percentage comparison is unavailable.':`${usagePercent.replace('−','')} ${usageDelta>0?'more':usageDelta<0?'less':'change'} across two ${before.days}-day periods. This is consumption, not the amount charged.`,steps:[`${kwh(after.usage)} − ${kwh(before.usage)} = ${usageDelta<0?'−':'+'}${kwh(Math.abs(usageDelta))}`,usagePercent===null?'Percentage unavailable: earlier consumption is zero.':`(${usageDelta/1000} ÷ ${before.usage/1000}) × 100 = ${usagePercent} (rounded)`],cells:cells(['period_start','period_end','unit','consumption_kwh'])});
 const costs=[unitCost(before.total,before.usage),unitCost(after.total,after.usage)];
 result.findings.splice(2,0,{id:'unit-cost',title:costs[1]===null?'A unit cost needs nonzero consumption.':`Your whole-bill average was ${costs[1]} per kWh.`,detail:`Earlier: ${costs[0]??'unavailable (zero kWh)'}. Later: ${costs[1]??'unavailable (zero kWh)'}. Total billed ÷ consumption includes all charges. It is not the supplier’s tariff or proof that an electricity price changed.`,steps:[before,after].map((row,i)=>row.usage===0?`${row.raw.period_start}: undefined — cannot divide by zero kWh.`:`${usd(row.total)} ÷ ${kwh(row.usage)} = ${costs[i]} per kWh (rounded for display; extra precision for small nonzero costs)`),cells:cells(['currency','unit','consumption_kwh','total_usd'])});
 result.findings.push({id:'classification',title:known?'Your bill labels identify the charge types.':'We can’t identify the fixed and variable split.',detail:known?'The CSV marks these amounts as bill-identified fixed, variable and other charges. We have not verified that classification against a provider tariff. A fixed charge can change between periods; a variable amount alone does not identify a rate.':'At least one bill marks charge types as unknown. Consumption, total and whole-bill averages still work; no fixed/variable split or contribution is guessed.',steps:known?[before,after].map(row=>`${usd(row.amounts[0])} fixed + ${usd(row.amounts[1])} variable + ${usd(row.amounts[2])} other = ${usd(row.total)}`):['No fixed/variable classification inferred from amounts, matching changes or consumption.'],cells:cells(['charge_basis','fixed_usd','variable_usd','other_usd','total_usd'])});
 return result;
}
