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
  /** Non-housing price level, U.S. = 100 (BEA Regional Price Parities). */
  priceLevel:number;
  priceLevelSource:'metro'|'state_nonmetro'|'national_default';
  /** Source record id for the price level, e.g. "bea-rpp-2024". */
  priceLevelSourceId?:string;
}

export interface DecisionInput {
  options:[OptionInput,OptionInput];
  /** Share of salary lost to taxes, 0–0.6. */
  taxShare:number;
  taxShareSource:'estimate'|'user';
  /** 0–5 per criterion. */
  weights:Record<Criterion,number>;
  relocationCovered?:boolean;
}

export interface MoneyLine { takeHome:number; housing:number; commuteCost:number; left:number; buyingPower:number }

export interface MoneyComparison {
  /** Buying power B − A per month. */
  gap:number;
  /** |gap| relative to the lower option's buying power. */
  relGap:number;
  /** Under the flagging band: survey error and estimates could reverse it. A reading aid, not a test. */
  small:boolean;
  leader:OptionKey|'none';
}

export interface Verdict {
  kind:'leader'|'no_clear_winner';
  leader?:OptionKey;
  /** Criteria whose one-step change flips or ties the result. */
  flipsOn:Criterion[];
  /** Criteria actually used (both options rated). */
  used:Criterion[];
  scores:Record<OptionKey,number>;
}
