import { compareCharges, recognizedCsv, moneyCents, usd } from './discovery-core';
import type { DiscoveryAnalysis, DiscoveryFinding, EvidenceCell, DiscoveryIssue } from './discovery-core';
export {moneyCents,usd,signedUsd,percentChange} from './discovery-core';

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
export type TaxIssue = DiscoveryIssue;
export type TaxCell = EvidenceCell;
export type TaxFinding = DiscoveryFinding;
export type TaxAnalysis = DiscoveryAnalysis;
export interface TaxInput { rows:TaxDraft[]; columns:TaxField[] }

export function parseTaxCsv(text:string):TaxInput {return recognizedCsv(text,TAX_FIELDS,'tax');}

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
  const cells=(fields:readonly TaxField[]):TaxCell[]=>[before,after].flatMap(row=>fields.map(field=>({
    cell:`${String.fromCharCode(65+columns.indexOf(field))}${row.index+2}`,field,label:LABELS[field],raw:row.raw[field],used:field==='tax_year'?String(row.year):usd(row.values[field]),
  })));
  result.status='ready';result.years=[before.year,after.year];result.totals=[totalBefore,totalAfter];
  result.changes=COMPONENTS.map(field=>({label:LABELS[field],before:before.values[field],after:after.values[field],delta:after.values[field]-before.values[field]}));
  Object.assign(result,compareCharges(totalBefore,totalAfter,result.years,result.changes,cells(['tax_year','total_usd']),cells(TAX_FIELDS),true));
  return result;
}
