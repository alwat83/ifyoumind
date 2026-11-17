// Design contract only. This directory is outside the Angular and Functions builds.
// Wire DTOs require runtime decoders. These types do not authorize requests.
export type Id = string; // Opaque, validated within one case revision.
export type DateText = string; // UTC ISO instant, or YYYY-MM-DD for a civil date.
export type NonEmpty<T> = readonly [T, ...T[]];
export type Domain = 'city-market' | 'property-tax' | 'electricity-bill';

// This is an integer encoded as text. Scale 2 is USD cents; scale 3 is milli-kWh.
// Ratios keep exact operands. Round only by the versioned formula's display rule.
export type Quantity =
  | { readonly unit: 'USD'; readonly integer: string; readonly scale: 0 | 2 }
  | { readonly unit: 'kWh'; readonly integer: string; readonly scale: 3 }
  | { readonly unit: 'people' | 'days'; readonly integer: string; readonly scale: 0 }
  | { readonly unit: '%' | 'percentage-point'; readonly integer: string; readonly scale: 1 | 2 | 6 }
  | { readonly unit: 'USD/kWh'; readonly integer: string; readonly scale: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 };
export interface Period {
  readonly start: DateText;
  readonly endExclusive: DateText;
}
export type CityMetric = 'population' | 'median-household-income' | 'median-home-value';

export interface PlaceKey {
  readonly stateFips: string;
  readonly placeFips: string;
}
export interface CityCandidate {
  readonly city: string;
  readonly state: string;
}
export type CityGoal = 'city-comparison' | 'market-context' | 'housing' | 'personal-living-cost';
export type CityIntent =
  | { readonly domain: 'city-market'; readonly goal: CityGoal; readonly resolution: 'ready';
      readonly primary: CityCandidate; readonly comparison?: CityCandidate }
  | { readonly domain: 'city-market'; readonly goal: CityGoal; readonly resolution: 'needs-place';
      readonly primary?: CityCandidate; readonly comparison?: CityCandidate };
export type BillIntent<D extends 'property-tax' | 'electricity-bill'> = {
  readonly domain: D;
  readonly goal: 'compare-statements' | 'local-rate' | 'bill-correctness';
  readonly resolution: 'ready' | 'needs-statements' | 'unsupported';
};
export type Intent = CityIntent | BillIntent<'property-tax'> | BillIntent<'electricity-bill'> |
  { readonly domain: 'unsupported'; readonly resolution: 'unclear' | 'unsupported' };

interface WebEvidence {
  readonly id: Id;
  readonly kind: 'acs-observation';
  readonly publisher: 'US Census Bureau';
  readonly dataset: 'acs/acs5';
  readonly vintage: number;
  readonly observationPeriod: Period;
  readonly queriedAt: DateText;
  readonly place: PlaceKey;
  readonly metric: CityMetric;
  readonly variable: 'B01003_001E' | 'B19013_001E' | 'B25077_001E';
  readonly sourceUrl: string; // Built by the adapter from validated IDs; never contains an API key.
  readonly uncertainty: 'margin-of-error-unavailable';
  readonly sourceDigest: string; // Canonical observed value and metadata, not the response body.
}
type TaxField = 'tax_year' | 'county_usd' | 'school_usd' | 'municipal_usd' | 'total_usd';
type ElectricField = 'period_start' | 'period_end' | 'unit' | 'currency' | 'consumption_kwh' |
  'charge_basis' | 'fixed_usd' | 'variable_usd' | 'other_usd' | 'total_usd';
type LocalEvidence =
  | { readonly id: Id; readonly kind: 'user-input'; readonly field: 'annual-salary' }
  | { readonly id: Id; readonly kind: 'statement-cell'; readonly source: 'local-csv' | 'example';
      readonly documentRef: Id; readonly row: number; readonly field: TaxField | ElectricField };
type Evidence = WebEvidence | LocalEvidence;
export interface Fact {
  readonly id: Id;
  readonly metric: string; // Closed metric keys per family at runtime.
  readonly subjectRef: Id;
  readonly period: Period;
  readonly amount: Quantity;
  readonly evidenceIds: NonEmpty<Id>;
}
export type ValueRef =
  | { readonly kind: 'fact'; readonly id: Id }
  | { readonly kind: 'calculation'; readonly id: Id }
  | { readonly kind: 'assumption'; readonly id: Id };
export type Formula =
  | 'difference/v1' | 'relative-change/v1' | 'sum-charge-parts/v1' | 'whole-bill-unit-cost/v1'
  | 'replace-cost-and-total/v1';
export type Computation =
  | { readonly kind: 'computed'; readonly value: Quantity }
  | { readonly kind: 'unavailable'; readonly reason: 'missing-input' | 'incompatible' | 'zero-denominator' | 'out-of-range' };
export interface Calculation {
  readonly id: Id;
  readonly formula: Formula;
  readonly operands: NonEmpty<{ readonly role: string; readonly ref: ValueRef }>;
  readonly outcome: Computation;
}
export interface Scenario {
  readonly id: Id;
  readonly baseRevision: number;
  readonly assumptions: NonEmpty<{ readonly id: Id; readonly replacesFact: Id; readonly value: Quantity; readonly origin: 'user-assumption' }>;
  readonly calculations: readonly Calculation[];
  readonly conclusions: readonly Claim[];
}
export type StatementTemplate = 'observed-value/v1' | 'comparison-gap/v1' | 'hypothetical-total/v1';
export type LimitTemplate = 'personal-expenses-missing/v1' | 'local-source-missing/v1' |
  'two-periods-not-a-trend/v1' | 'unknown-charge-split/v1' | 'uncertainty-not-reported/v1' |
  'not-enough-evidence/v1';
export type Claim =
  | { readonly id: Id; readonly kind: 'numeric'; readonly template: StatementTemplate;
      readonly values: NonEmpty<ValueRef>; readonly evidenceIds: NonEmpty<Id> }
  | { readonly id: Id; readonly kind: 'limit'; readonly template: LimitTemplate;
      readonly coverageItemId: Id; readonly evidenceIds: readonly Id[] };
export type CoverageState = 'answered' | 'partial' | 'ambiguous' | 'missing' | 'unsupported' | 'unavailable';
export interface CoverageItem {
  readonly id: Id;
  readonly target: 'city-context' | 'personal-expenses' | 'statement-change' | 'tariff' | 'tax-liability' | 'unknown';
  readonly state: CoverageState;
  readonly detail: 'complete' | 'place-ambiguous' | 'input-required' | 'scope-not-supported' |
    'source-unavailable' | 'data-stale' | 'incompatible-periods-or-units' | 'metric-unavailable' | 'budget-exhausted';
  readonly nextAction?: 'supply-state' | 'provide-second-statement' | 'check-authority' | 'try-again' | 'check-expenses';
}
export interface DecisionCaseV1<S, I extends Intent, E extends Evidence> {
  readonly schemaVersion: 1;
  readonly id: Id;
  readonly revision: number;
  readonly createdAt: DateText;
  readonly scope: S;
  readonly intent: I;
  readonly facts: readonly Fact[];
  readonly evidence: readonly E[];
  readonly calculations: readonly Calculation[];
  readonly scenarios: readonly Scenario[];
  readonly conclusions: readonly Claim[];
  readonly coverage: { readonly overall: CoverageState; readonly items: NonEmpty<CoverageItem> };
}
export type WorkspaceCase = DecisionCaseV1<
  { readonly kind: 'workspace'; readonly organizationId: Id; readonly existingProjectId?: Id }, CityIntent, WebEvidence
>;
export type BrowserCase = DecisionCaseV1<{ readonly kind: 'browser-memory' }, Intent, Evidence>;
export type DecisionCase = WorkspaceCase | BrowserCase;
export type ToolResult<E extends Evidence> = Pick<
  DecisionCaseV1<unknown, Intent, E>, 'facts' | 'evidence' | 'calculations' | 'conclusions' | 'coverage'
>;

// The local inputs are the existing parser's validated rows, not uploaded files.
type TaxRow = Readonly<Record<TaxField, string>>;
type ElectricityRow = Readonly<Record<ElectricField, string>>;
interface Tools {
  'city.acs.v1': {
    domain: 'city-market';
    input: { readonly primary: CityCandidate; readonly comparison?: CityCandidate };
    output: ToolResult<WebEvidence>;
    context: { readonly kind: 'workspace'; readonly uid: Id; readonly organizationId: Id;
      readonly role: 'owner' | 'admin'; readonly requestId: Id };
  };
  'tax.statement-change.v1': {
    domain: 'property-tax';
    input: { readonly rows: readonly [TaxRow, TaxRow]; readonly columns: readonly TaxField[] };
    output: ToolResult<LocalEvidence>;
    context: { readonly kind: 'browser-memory'; readonly source: 'local-csv' | 'example' };
  };
  'electricity.statement-change.v1': {
    domain: 'electricity-bill';
    input: { readonly rows: readonly [ElectricityRow, ElectricityRow]; readonly columns: readonly ElectricField[] };
    output: ToolResult<LocalEvidence>;
    context: { readonly kind: 'browser-memory'; readonly source: 'local-csv' | 'example' };
  };
}
export type ToolId = keyof Tools;
export type PlannedStep = { [K in ToolId]: { readonly id: K; readonly input: Tools[K]['input'] } }[ToolId];
export type Plan = readonly [] | readonly [PlannedStep] | readonly [PlannedStep, PlannedStep];
export interface Decoder<T> { parse(value: unknown): T }
export type ToolRegistry = { readonly [K in ToolId]: {
  readonly id: K;
  readonly domain: Tools[K]['domain'];
  readonly runtime: Tools[K]['context']['kind'];
  readonly permission: Tools[K]['context']['kind'] extends 'workspace' ? 'verified-owner-or-admin' : 'local';
  readonly input: Decoder<Tools[K]['input']>;
  readonly output: Decoder<Tools[K]['output']>;
  readonly limits: {
    readonly maxMs: number; readonly maxSourceRequests: number; readonly maxProviderTokens: 0;
    readonly maxInputBytes: number; readonly maxOutputBytes: number;
  };
  readonly execute: (input: Tools[K]['input'], authorizedContext: Tools[K]['context'], signal: AbortSignal) =>
    Promise<Tools[K]['output']>;
} };

// Model output is an optional ordering hint. It has no numeric claims, text or tool arguments.
export interface PresentationHintV1 {
  readonly schemaVersion: 1;
  readonly leadClaimId: Id;
  readonly orderedClaimIds: NonEmpty<Id>;
}
