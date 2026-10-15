// Every sentence the result shows, as a claim the evidence checker can grade.
import type { LifeEvidence } from './evidence';
import { betterOf } from './verdict';
import type { Criterion, DecisionInput, MoneyComparison, MoneyLine, OptionKey, Verdict } from './types';

export interface LifeClaim {
  id:string;
  role:'verdict'|'finding'|'limitation';
  text:string;
  evidence:string[];
  assertion?:
    | {type:'compare';left:string;right:string;relation:'higher'|'lower'|'similar'}
    | {type:'recommendation';options:OptionKey[];criteria:Array<{measure:string;weight:number;better:'higher'|'lower'}>;chosen:OptionKey|null};
}

const LABEL:Record<Criterion,string>={money:'money left each month',time:'commute time',career:'career growth',people:'being near family and friends'};
export const criterionLabel=(c:Criterion)=>LABEL[c];

export const usd=(v:number)=>`${v<0?'−':''}$${Math.round(Math.abs(v)).toLocaleString('en-US')}`;
const pct=(r:number)=>r<.1?`${(r*100).toFixed(1)}%`:`${Math.round(r*100)}%`;
const pctNote=(r:number|null)=>r===null?'':` (${pct(r)})`;
const CRITERIA_WEIGHTED=(input:DecisionInput)=>Object.values(input.weights).some(w=>(w||0)>0);
const cap=(t:string)=>t.charAt(0).toUpperCase()+t.slice(1);
const list=(xs:string[])=>xs.length<=1?xs.join(''):`${xs.slice(0,-1).join(', ')} or ${xs[xs.length-1]}`;

export function buildClaims(input:DecisionInput,money:[MoneyLine,MoneyLine],cmp:MoneyComparison,verdict:Verdict,evidence:LifeEvidence[]):LifeClaim[]{
  const name=(k:OptionKey)=>input.options[k==='A'?0:1].label;
  const ids=evidence.map(e=>e.id);
  const criteria=verdict.used.map(c=>({measure:c,weight:input.weights[c],better:betterOf(c)}));
  const claims:LifeClaim[]=[];

  // Name what the verdict rests on and what it leaves out, so an answer on one or two priorities
  // never reads as an overall judgement of the options.
  const usedText=verdict.used.map(criterionLabel).join(', ');
  const notRated=verdict.ignored.filter(i=>i.reason==='not_rated').map(i=>criterionLabel(i.criterion));
  const noWeight=verdict.ignored.filter(i=>i.reason==='no_weight').map(i=>criterionLabel(i.criterion));
  const same=verdict.ignored.filter(i=>i.reason==='not_different'&&(input.weights[i.criterion]||0)>0).map(i=>criterionLabel(i.criterion));
  const scope=[
    same.length?` ${cap(list(same).replace(' or ',' and '))} ${same.length>1?'are':'is'} too close between the options to decide this.`:'',
    notRated.length?` Not included: ${list(notRated).replace(' or ',' and ')} (not rated for both options).`:'',
    noWeight.length?` You gave no weight to ${list(noWeight).replace(' or ',' and ')}.`:'',
  ].join('');
  if(verdict.kind==='leader'&&verdict.leader){
    claims.push({id:'verdict',role:'verdict',
      text:`On the priorities you set (${usedText}), option ${verdict.leader} (${name(verdict.leader)}) comes out ahead, and that holds when any one priority moves a step up or down.${scope} It is not a judgement of which option is better overall.`,
      evidence:ids,assertion:{type:'recommendation',options:['A','B'],criteria,chosen:verdict.leader}});
  }else{
    const flips=verdict.flipsOn.map(criterionLabel);
    claims.push({id:'verdict',role:'verdict',
      text:verdict.used.length
        ?`No clear winner on your priorities.${flips.length?` The result changes if ${list(flips)} matters a little more or less to you.`:' The two options score almost the same on what you said matters.'}${scope}`
        :CRITERIA_WEIGHTED(input)
          ?`No clear winner: on the priorities you set, the two options are too close or not rated enough to separate.${scope}`
          :'No clear winner yet: set at least one priority to compare the options.',
      evidence:ids,assertion:{type:'recommendation',options:['A','B'],criteria,chosen:null}});
  }

  if(cmp.leader!=='none'){
    const lead=cmp.leader, other:OptionKey=lead==='A'?'B':'A';
    claims.push(cmp.small
      ?{id:'money',role:'finding',
        text:`Money left after housing and local prices is not clearly different: ${usd(Math.abs(cmp.gap))} a month${pctNote(cmp.relGap)}, small enough that real rent quotes or taxes could reverse it.`,
        evidence:[`${lead}.money`,`${other}.money`],assertion:{type:'compare',left:`${lead}.money`,right:`${other}.money`,relation:'similar'}}
      :{id:'money',role:'finding',
        text:`${name(lead)} leaves ${usd(Math.abs(cmp.gap))} more a month after housing and local prices${pctNote(cmp.relGap)}, before moving costs.`,
        evidence:[`${lead}.money`,`${other}.money`],assertion:{type:'compare',left:`${lead}.money`,right:`${other}.money`,relation:'higher'}});
  }

  const estimated=input.options.some(o=>(o.taxShare!==undefined?(o.taxShareSource??'user'):input.taxShareSource)==='estimate');
  const noState=input.options.some(o=>!(o.taxShare!==undefined?o.stateTaxIncluded:input.stateTaxIncluded));
  claims.push({id:'limits',role:'limitation',evidence:[],
    text:[
      estimated?'Take-home pay uses an estimated tax share (federal income tax, Social Security and Medicare for a single filer on the standard deduction).':'Take-home pay uses the tax share you entered.',
      noState?'State and local income tax is not included where noted.':'',
      'Price levels are area averages and leave out taxes.',
      'This is a reading of your own numbers and priorities, not financial or tax advice.',
    ].filter(Boolean).join(' ')});
  return claims;
}

export function nextSteps(input:DecisionInput,priceFallback:boolean):string[]{
  const steps=[
    input.relocationCovered?'Get the relocation package and start date in writing.':'Get the start date in writing and price the move itself; it is not in these numbers.',
    'Replace the housing estimates with two real listings or quotes in each place.',
    'Try the commute at rush hour before you decide.',
  ];
  if(priceFallback)steps.unshift('One place has no metro price data, so a broader average was used. Treat money left as rough.');
  return steps;
}

/** Copyable summary. Amounts are left out unless the user turns them on. */
export function shareText(input:DecisionInput,cmp:MoneyComparison,verdict:Verdict,includeAmounts=false):string{
  const [a,b]=input.options;
  const lines=[`Comparing: ${a.label} (A) vs ${b.label} (B).`];
  lines.push(verdict.kind==='leader'&&verdict.leader?`Result: option ${verdict.leader} comes out ahead on my priorities.`:'Result: no clear winner on my priorities.');
  if(cmp.leader!=='none')lines.push(cmp.small
    ?'Money after housing and local prices: not clearly different.'
    :`Money after housing and local prices: option ${cmp.leader} is ahead${cmp.relGap===null?'':` by about ${pct(cmp.relGap)}`}.`);
  if(includeAmounts)lines.push(`My numbers: salary ${usd(a.salary)} vs ${usd(b.salary)}; housing ${usd(a.housing)} vs ${usd(b.housing)} a month.`);
  lines.push('Estimates and sources: ifyoumind.com');
  return lines.join('\n');
}
