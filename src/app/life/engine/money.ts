import type { DecisionInput, MoneyComparison, MoneyLine, OptionInput, OptionKey, Warning } from './types';

/** Flagging band for money gaps (relative). Same disclosed reading aid as the Business summary. */
export const SMALL_GAP=0.05;

const finite=(v:unknown,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
export const validPriceLevel=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=50&&v<=200;

/**
 * Money for one option. Housing is subtracted once, as the user's own figure; the price level
 * then adjusts only what is left, so it must be a non-housing index (see `price_level_includes_rent`).
 */
export function moneyLine(option:OptionInput,sharedTaxShare:number):MoneyLine{
  const share=Math.min(.6,Math.max(0,finite(option.taxShare??sharedTaxShare)));
  const takeHome=Math.max(0,finite(option.salary))*(1-share)/12;
  const housing=Math.max(0,finite(option.housing));
  const commuteCost=Math.max(0,finite(option.commuteCost));
  const left=takeHome-housing-commuteCost;
  const level=validPriceLevel(option.priceLevel)?option.priceLevel:100;
  return {takeHome,housing,commuteCost,left,buyingPower:left/(level/100),taxShare:share,priceLevel:level};
}

export function moneyWarnings(input:DecisionInput,money:[MoneyLine,MoneyLine]):Warning[]{
  const out:Warning[]=[];
  (['A','B'] as OptionKey[]).forEach((k,i)=>{
    const o=input.options[i], m=money[i], name=`${o.label} (${k})`;
    if(!validPriceLevel(o.priceLevel))out.push({code:'price_level_missing',option:k,text:`No price data for ${name}, so the U.S. average was assumed. Money left there is rough.`});
    else if(o.priceLevelSource!=='metro')out.push({code:'price_level_fallback',option:k,text:`${name} has no metro price data, so a ${o.priceLevelSource==='state_nonmetro'?'state nonmetro':'national'} average was used.`});
    if(o.priceLevelKind==='all_items')out.push({code:'price_level_includes_rent',option:k,text:`The price level for ${name} includes rent, which your housing cost already covers, so local prices may be counted twice there.`});
    if(validPriceLevel(o.priceLevel)&&o.priceLevelYear&&input.asOfYear&&input.asOfYear-o.priceLevelYear>2)out.push({code:'price_level_outdated',option:k,text:`Price data for ${name} is from ${o.priceLevelYear}; prices may have moved since.`});
    if(m.left<=0)out.push({code:'shortfall',option:k,text:`In ${name}, housing and commute cost at least as much as the estimated take-home pay.`});
    const included=o.taxShare!==undefined?!!o.stateTaxIncluded:!!input.stateTaxIncluded;
    if(!included)out.push({code:'state_tax_not_included',option:k,text:`State and local income tax is not included for ${name}.`});
  });
  return out;
}

export function compareMoney(a:MoneyLine,b:MoneyLine):MoneyComparison{
  const gap=b.buyingPower-a.buyingPower;
  if(gap===0)return {gap,relGap:0,small:true,leader:'none'};
  const leader:OptionKey=gap>0?'B':'A';
  const other=leader==='B'?a.buyingPower:b.buyingPower;
  // Relative to the other option, as the evidence checker's relationOf does (left − right) / |right|.
  const relGap=other===0?null:Math.abs(gap)/Math.abs(other);
  return {gap,relGap,small:relGap!==null&&relGap<SMALL_GAP,leader};
}
