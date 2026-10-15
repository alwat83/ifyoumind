// ifYouMind Life, browser-only decision engine: shared types.
// Spec: docs/research/life/mvp-implementation-spec.md (sections 4–5). Pure data, no I/O.

export type OptionKey='A'|'B';
export type Criterion='money'|'time'|'career'|'people';

/** Where a figure came from, shown to the user as a tag. */
export type Provenance='fact'|'estimate'|'user'|'calculation';

export interface OptionInput {
  /** What the user sees, e.g. "Denver, CO". Never used as an identifier. */
  label:string;
  salary:number;
  /** Monthly housing cost. */
  housing:number;
  housingSource:'estimate'|'user';
  commuteMinutes:number;
  /** Monthly commute spend, if the user gives one. */
  commuteCost?:number;
  /** 1–5 ratings from the user; a criterion is used only when both options have it. */
  career?:number;
  people?:number;
  /**
   * Price level, U.S. = 100 (BEA Regional Price Parities). It should exclude housing, because the
   * user's own housing cost is already subtracted; an all-items index would count rent twice.
   */
  priceLevel:number;
  /** 'non_housing' (default) or 'all_items' (rent included: flagged as a possible double count). */
  priceLevelKind?:'non_housing'|'all_items';
  priceLevelSource:'metro'|'state_nonmetro'|'national_default';
  /** Data year of the price level, e.g. 2024. */
  priceLevelYear?:number;
  /** Source record id for the price level, e.g. "bea-rpp-2024". */
  priceLevelSourceId?:string;
  /**
   * Tax share for this option only (0–0.6), e.g. when the two places have different state income
   * tax. Overrides the shared tax share. `stateTaxIncluded` says whether it covers state and local tax.
   */
  taxShare?:number;
  taxShareSource?:'estimate'|'user';
  stateTaxIncluded?:boolean;
}

export interface DecisionInput {
  options:[OptionInput,OptionInput];
  /** Share of salary lost to taxes, 0–0.6, used for any option without its own. */
  taxShare:number;
  taxShareSource:'estimate'|'user';
  /** Whether the shared tax share covers state and local income tax. Default false. */
  stateTaxIncluded?:boolean;
  /** Year to judge data age against (passed in, so results stay deterministic). */
  asOfYear?:number;
  /** 0–5 per criterion. */
  weights:Record<Criterion,number>;
  relocationCovered?:boolean;
}

export interface MoneyLine {
  takeHome:number; housing:number; commuteCost:number; left:number; buyingPower:number;
  /** The tax share and price level actually used, after validation. */
  taxShare:number; priceLevel:number;
}

export type WarningCode=
  | 'price_level_missing'       // no valid price level: U.S. average (100) used, shown as an estimate
  | 'price_level_fallback'      // state nonmetro or national value used instead of the metro
  | 'price_level_includes_rent' // all-items index with the user's own housing: rent may count twice
  | 'price_level_outdated'      // data year more than 2 years before asOfYear
  | 'shortfall'                 // housing and commute cost at least the estimated take-home pay
  | 'state_tax_not_included';   // the tax share for this option leaves out state and local income tax

export interface Warning { code:WarningCode; option:OptionKey; text:string }

export interface MoneyComparison {
  /** Buying power B − A per month. */
  gap:number;
  /** |gap| ÷ |other option's buying power|, as the evidence checker computes it; null when that is 0. */
  relGap:number|null;
  /** Under the flagging band: survey error and estimates could reverse it. A reading aid, not a test. */
  small:boolean;
  leader:OptionKey|'none';
}

export interface Verdict {
  kind:'leader'|'no_clear_winner';
  leader?:OptionKey;
  /** Criteria whose one-step change flips or ties the result. */
  flipsOn:Criterion[];
  /** Criteria actually used (both options have a value and the weight is above 0). */
  used:Criterion[];
  /** Criteria left out, and why. Shown with the verdict so it never reads as complete. */
  ignored:Array<{criterion:Criterion;reason:'not_rated'|'no_weight'|'not_different'}>;
  scores:Record<OptionKey,number>;
}
