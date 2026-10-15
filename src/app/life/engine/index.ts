// ifYouMind Life, browser-only decision engine (PR L1). Pure and deterministic: no network,
// storage, DOM or Angular imports, so user inputs never leave the device.
import { buildEvidence, type LifeEvidence } from './evidence';
import { compareMoney, moneyLine } from './money';
import { buildClaims, nextSteps, type LifeClaim } from './summary';
import type { DecisionInput, MoneyComparison, MoneyLine, Verdict } from './types';
import { decide } from './verdict';

export * from './types';
export { estimateTax, TAX_2026_SINGLE } from './tax';
export { SMALL_GAP } from './money';
export { MIN_MARGIN, CRITERIA } from './verdict';
export { shareText, criterionLabel, usd } from './summary';
export type { LifeEvidence } from './evidence';
export type { LifeClaim } from './summary';

export interface DecisionResult {
  money:[MoneyLine,MoneyLine];
  comparison:MoneyComparison;
  verdict:Verdict;
  evidence:LifeEvidence[];
  claims:LifeClaim[];
  nextSteps:string[];
}

export function compareOptions(input:DecisionInput):DecisionResult{
  const money:[MoneyLine,MoneyLine]=[moneyLine(input.options[0],input.taxShare),moneyLine(input.options[1],input.taxShare)];
  const comparison=compareMoney(money[0],money[1]);
  const verdict=decide(input,money);
  const evidence=buildEvidence(input,money);
  const claims=buildClaims(input,money,comparison,verdict,evidence);
  const fallback=input.options.some(o=>o.priceLevelSource!=='metro');
  return {money,comparison,verdict,evidence,claims,nextSteps:nextSteps(input,fallback)};
}
