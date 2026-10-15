// Evidence objects for one comparison, in the same shape as the decision engine's EvidenceStore
// (functions/src/engine/evidence.ts), so the claim checker can grade every sentence in tests.
// Subjects are the option keys 'A' and 'B', never user text.
import type { DecisionInput, MoneyLine, OptionKey, Provenance } from './types';

export interface LifeEvidence {
  id:string;
  kind:'fact'|'observation'|'calculation'|'estimate';
  subject:OptionKey|'both';
  measure:string;
  unit:string;
  value:number|null;
  /** What the page shows next to the figure. */
  tag:Provenance;
  sourceId?:string;
  period?:string;
  geography?:{level:'metro'|'state'|'nation';name:string};
  source?:{publisher:string;dataset:string};
  method?:string; version?:string; inputs?:string[];
  assumptions?:Array<{name:string;value:string|number;editable:boolean}>;
  origin?:{manual:true}; qualityFlags?:string[];
}

export const ENGINE_VERSION='life-engine-1';

export function buildEvidence(input:DecisionInput,money:[MoneyLine,MoneyLine]):LifeEvidence[]{
  const out:LifeEvidence[]=[];
  const keys:OptionKey[]=['A','B'];
  keys.forEach((k,i)=>{
    const o=input.options[i], m=money[i];
    out.push({id:`${k}.priceLevel`,kind:'fact',subject:k,measure:'price_level',unit:'index',value:o.priceLevel,tag:'fact',
      sourceId:o.priceLevelSourceId,period:'2024',
      geography:{level:o.priceLevelSource==='metro'?'metro':o.priceLevelSource==='state_nonmetro'?'state':'nation',name:o.label},
      source:{publisher:'U.S. Bureau of Economic Analysis',dataset:'Regional Price Parities'}});
    out.push({id:`${k}.salary`,kind:'observation',subject:k,measure:'salary',unit:'USD/year',value:o.salary,tag:'user',origin:{manual:true},qualityFlags:[]});
    out.push(o.housingSource==='user'
      ?{id:`${k}.housing`,kind:'observation',subject:k,measure:'housing',unit:'USD/month',value:o.housing,tag:'user',origin:{manual:true},qualityFlags:[]}
      :{id:`${k}.housing`,kind:'estimate',subject:k,measure:'housing',unit:'USD/month',value:o.housing,tag:'estimate',inputs:[],
        assumptions:[{name:'typical rent for the chosen size',value:o.housing,editable:true}]});
    out.push({id:`${k}.money`,kind:'calculation',subject:k,measure:'money',unit:'USD/month',value:m.buyingPower,tag:'calculation',
      method:'(salary × (1 − tax share) ÷ 12 − housing − commute cost) ÷ (price level ÷ 100)',version:ENGINE_VERSION,
      inputs:[`${k}.salary`,`${k}.housing`,`${k}.priceLevel`,'taxShare']});
    out.push({id:`${k}.time`,kind:'observation',subject:k,measure:'time',unit:'minutes',value:o.commuteMinutes,tag:'user',origin:{manual:true},qualityFlags:[]});
    if(Number.isFinite(o.career))out.push({id:`${k}.career`,kind:'observation',subject:k,measure:'career',unit:'rating',value:o.career as number,tag:'user',origin:{manual:true},qualityFlags:[]});
    if(Number.isFinite(o.people))out.push({id:`${k}.people`,kind:'observation',subject:k,measure:'people',unit:'rating',value:o.people as number,tag:'user',origin:{manual:true},qualityFlags:[]});
  });
  out.push(input.taxShareSource==='user'
    ?{id:'taxShare',kind:'observation',subject:'both',measure:'tax_share',unit:'share',value:input.taxShare,tag:'user',origin:{manual:true},qualityFlags:[]}
    :{id:'taxShare',kind:'estimate',subject:'both',measure:'tax_share',unit:'share',value:input.taxShare,tag:'estimate',inputs:[],
      assumptions:[{name:'single filer, standard deduction, federal + FICA only',value:input.taxShare,editable:true}]});
  return out;
}
