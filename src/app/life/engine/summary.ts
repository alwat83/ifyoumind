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
const list=(xs:string[])=>xs.length<=1?xs.join(''):`${xs.slice(0,-1).join(', ')} or ${xs[xs.length-1]}`;

export function buildClaims(input:DecisionInput,money:[MoneyLine,MoneyLine],cmp:MoneyComparison,verdict:Verdict,evidence:LifeEvidence[]):LifeClaim[]{
  const name=(k:OptionKey)=>input.options[k==='A'?0:1].label;
  const ids=evidence.map(e=>e.id);
  const criteria=verdict.used.map(c=>({measure:c,weight:input.weights[c],better:betterOf(c)}));
  const claims:LifeClaim[]=[];

  if(verdict.kind==='leader'&&verdict.leader){
    claims.push({id:'verdict',role:'verdict',
      text:`On the priorities you set, ${verdict.leader==='A'?'option A':'option B'} (${name(verdict.leader)}) comes out ahead, and that holds when any one priority moves a step up or down.`,
      evidence:ids,assertion:{type:'recommendation',options:['A','B'],criteria,chosen:verdict.leader}});
  }else{
    const flips=verdict.flipsOn.map(criterionLabel);
    claims.push({id:'verdict',role:'verdict',
      text:verdict.used.length
        ?`No clear winner on your priorities.${flips.length?` The result changes if ${list(flips)} matters a little more or less to you.`:' The two options score almost the same on what you said matters.'}`
        :'No clear winner yet: set at least one priority to compare the options.',
      evidence:ids,assertion:{type:'recommendation',options:['A','B'],criteria,chosen:null}});
  }

  if(cmp.leader!=='none'){
    const lead=cmp.leader, other:OptionKey=lead==='A'?'B':'A';
    claims.push(cmp.small
      ?{id:'money',role:'finding',
        text:`Money left after housing and local prices is not clearly different: ${usd(Math.abs(cmp.gap))} a month (${pct(cmp.relGap)}), small enough that real rent quotes or taxes could reverse it.`,
        evidence:[`${lead}.money`,`${other}.money`],assertion:{type:'compare',left:`${lead}.money`,right:`${other}.money`,relation:'similar'}}
      :{id:'money',role:'finding',
        text:`${name(lead)} leaves ${usd(Math.abs(cmp.gap))} more a month after housing and local prices (${pct(cmp.relGap)}), before moving costs.`,
        evidence:[`${lead}.money`,`${other}.money`],assertion:{type:'compare',left:`${lead}.money`,right:`${other}.money`,relation:'higher'}});
  }

  claims.push({id:'limits',role:'limitation',evidence:[],
    text:'Take-home pay is an estimate (federal and payroll taxes only; state and local tax not included). Price levels are metro averages from 2024 and leave out taxes. This is a reading of your own numbers and priorities, not financial advice.'});
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
    ?`Money after housing and local prices: not clearly different (${pct(cmp.relGap)} gap).`
    :`Money after housing and local prices: option ${cmp.leader} is about ${pct(cmp.relGap)} ahead.`);
  if(includeAmounts)lines.push(`My numbers: salary ${usd(a.salary)} vs ${usd(b.salary)}; housing ${usd(a.housing)} vs ${usd(b.housing)} a month.`);
  lines.push('Estimates and sources: ifyoumind.com');
  return lines.join('\n');
}
