import type { MoneyComparison, MoneyLine, OptionInput, OptionKey } from './types';

/** Flagging band for money gaps (relative). Same disclosed reading aid as the Business summary. */
export const SMALL_GAP=0.05;

export function moneyLine(option:OptionInput,taxShare:number):MoneyLine{
  const share=Math.min(.6,Math.max(0,taxShare));
  const takeHome=Math.max(0,option.salary)*(1-share)/12;
  const commuteCost=Math.max(0,option.commuteCost??0);
  const left=takeHome-option.housing-commuteCost;
  const level=option.priceLevel>0?option.priceLevel:100;
  return {takeHome,housing:option.housing,commuteCost,left,buyingPower:left/(level/100)};
}

export function compareMoney(a:MoneyLine,b:MoneyLine):MoneyComparison{
  const gap=b.buyingPower-a.buyingPower;
  if(gap===0)return {gap,relGap:0,small:true,leader:'none'};
  const leader:OptionKey=gap>0?'B':'A';
  const other=leader==='B'?a.buyingPower:b.buyingPower;
  // Relative to the other option, as the evidence checker's relationOf does (left − right) / |right|.
  const relGap=other===0?Infinity:Math.abs(gap)/Math.abs(other);
  return {gap,relGap,small:relGap<SMALL_GAP,leader};
}
