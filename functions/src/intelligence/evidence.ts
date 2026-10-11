// Statistical evidence for the paid Decision Report, built from ACS 5-year estimates and their
// margins of error. Every formula follows the Census Bureau's published guidance for ACS data
// users ("Understanding and Using American Community Survey Data", Chapter 8 and Appendix):
//   SE = MOE / 1.645 (ACS MOEs are published at the 90% confidence level)
//   sum of estimates:  MOE = sqrt(sum of MOE_i^2)   (approximation; see aggregateMoe)
//   proportion X/Y:    MOE = sqrt(MOE_X^2 - p^2 * MOE_Y^2) / Y, or the ratio form if negative
//   ratio X/Y:         MOE = sqrt(MOE_X^2 + R^2 * MOE_Y^2) / Y
//   difference test:   Z = (A - B) / sqrt(SE_A^2 + SE_B^2); significant at 90% when |Z| > 1.645
// Pure functions only: no I/O, so every number can be checked by hand in tests.

export const Z90 = 1.645;

export type EvidenceStatus = 'ok' | 'controlled' | 'open-ended' | 'unavailable';
export type Reliability = 'good' | 'fair' | 'low' | 'unknown';
export type EvidenceLabel = 'survey_estimate' | 'calculated';
export type Verdict = 'higher' | 'lower' | 'similar' | 'not-testable';

export interface EvidenceValue {
  value: number | null;
  moe: number | null;
  status: EvidenceStatus;
  reliability: Reliability;
  cv: number | null;
  note?: string;
}

// ACS annotation values (census.gov "Notes on ACS API Variable Types"). Estimates and MOEs use
// these negative sentinels instead of numbers.
const ESTIMATE_UNAVAILABLE = new Set([-666666666, -999999999, -888888888, -222222222, -333333333, -555555555]);
const MOE_CONTROLLED = -555555555;
const MOE_UNAVAILABLE = new Set([-222222222, -333333333, -666666666, -888888888, -999999999]);

// Open-ended medians are published as the edge of the top or bottom interval.
const OPEN_ENDED: Record<string, { low: number; high: number }> = {
  B19013_001: { low: 2499, high: 250001 },
  B25077_001: { low: 9999, high: 2000001 },
  B25064_001: { low: 99, high: 3501 },
};

/** Reliability policy (ifYouMind's, stated in the report): CV up to 15% good, up to 30% fair, above 30% low. */
export function reliabilityFor(value: number | null, moe: number | null): { cv: number | null; reliability: Reliability } {
  if (value === null || moe === null || value === 0) return { cv: null, reliability: 'unknown' };
  const cv = moe / Z90 / Math.abs(value);
  return { cv, reliability: cv <= 0.15 ? 'good' : cv <= 0.30 ? 'fair' : 'low' };
}

function toNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Reads one ACS estimate/MOE pair, turning annotation codes into explicit statuses. */
export function acsValue(estimateRaw: unknown, moeRaw: unknown, variable = ''): EvidenceValue {
  const estimate = toNumber(estimateRaw);
  const moe = toNumber(moeRaw);
  if (estimate === null || ESTIMATE_UNAVAILABLE.has(estimate) || estimate < 0) {
    return { value: null, moe: null, status: 'unavailable', reliability: 'unknown', cv: null, note: 'The Census Bureau did not publish this estimate for this place.' };
  }
  const bounds = OPEN_ENDED[variable];
  if (bounds && (estimate >= bounds.high || estimate <= bounds.low)) {
    const edge = estimate >= bounds.high ? 'at least' : 'at most';
    return { value: estimate, moe: null, status: 'open-ended', reliability: 'unknown', cv: null, note: `The median is in the open-ended top or bottom range (${edge} ${estimate.toLocaleString('en-US')}), so it can't be compared precisely.` };
  }
  if (moe === MOE_CONTROLLED) {
    return { value: estimate, moe: 0, status: 'controlled', reliability: 'good', cv: 0, note: 'Controlled estimate: no sampling error.' };
  }
  if (moe === null || MOE_UNAVAILABLE.has(moe) || moe < 0) {
    return { value: estimate, moe: null, status: 'ok', reliability: 'unknown', cv: null, note: 'No margin of error was published, so reliability is unknown.' };
  }
  return { value: estimate, moe, status: 'ok', ...reliabilityFor(estimate, moe) };
}

function unavailable(note: string): EvidenceValue {
  return { value: null, moe: null, status: 'unavailable', reliability: 'unknown', cv: null, note };
}

/**
 * Sum of estimates with the Census approximation for its MOE. Census guidance: when several
 * components are zero, include only the largest of their MOEs. Any unavailable component makes
 * the sum unavailable rather than silently low.
 */
export function aggregate(parts: EvidenceValue[]): EvidenceValue {
  if (!parts.length || parts.some(p => p.value === null)) return unavailable('One or more parts of this total were not published.');
  const value = parts.reduce((sum, p) => sum + (p.value as number), 0);
  if (parts.some(p => p.moe === null)) return { value, moe: null, status: 'ok', reliability: 'unknown', cv: null, note: 'A margin of error was missing for part of this total.' };
  const zeroMoes = parts.filter(p => p.value === 0).map(p => p.moe as number);
  const nonZero = parts.filter(p => p.value !== 0).map(p => p.moe as number);
  const squares = [...nonZero, ...(zeroMoes.length ? [Math.max(...zeroMoes)] : [])].reduce((s, m) => s + m * m, 0);
  const moe = Math.sqrt(squares);
  return { value, moe, status: 'ok', ...reliabilityFor(value, moe) };
}

/** Share X / Y where X is a subset of Y (Census proportion formula, falling back to the ratio form). */
export function proportion(part: EvidenceValue, whole: EvidenceValue): EvidenceValue {
  if (part.value === null || whole.value === null || whole.value <= 0) return unavailable('The share could not be calculated.');
  const p = part.value / whole.value;
  if (part.moe === null || whole.moe === null) return { value: p, moe: null, status: 'ok', reliability: 'unknown', cv: null };
  const radicand = part.moe ** 2 - p * p * whole.moe ** 2;
  const moe = (radicand >= 0 ? Math.sqrt(radicand) : Math.sqrt(part.moe ** 2 + p * p * whole.moe ** 2)) / whole.value;
  return { value: p, moe, status: 'ok', ...reliabilityFor(p, moe) };
}

/** Ratio X / Y for figures that aren't subsets of each other (Census ratio formula). */
export function ratio(numerator: EvidenceValue, denominator: EvidenceValue): EvidenceValue {
  if (numerator.value === null || denominator.value === null || denominator.value === 0) return unavailable('The ratio could not be calculated.');
  const r = numerator.value / denominator.value;
  if (numerator.moe === null || denominator.moe === null) return { value: r, moe: null, status: 'ok', reliability: 'unknown', cv: null };
  const moe = Math.sqrt(numerator.moe ** 2 + r * r * denominator.moe ** 2) / denominator.value;
  return { value: r, moe, status: 'ok', ...reliabilityFor(r, moe) };
}

/** Percent change from an earlier, non-overlapping period: 100 * (later / earlier - 1), MOE from the ratio. */
export function percentChange(later: EvidenceValue, earlier: EvidenceValue): EvidenceValue {
  const r = ratio(later, earlier);
  if (r.value === null) return unavailable('The change could not be calculated because one period is missing.');
  const value = (r.value - 1) * 100;
  const moe = r.moe === null ? null : r.moe * 100;
  // CV is not meaningful for a change that can be near zero, so reliability comes from the ratio.
  const controlled = later.status === 'controlled' && earlier.status === 'controlled';
  return { value, moe, status: controlled ? 'controlled' : 'ok', reliability: r.reliability, cv: r.cv };
}

export interface DifferenceTest { gap: number | null; z: number | null; verdict: Verdict; }

/** Census difference test at 90% confidence. Open-ended, unavailable or MOE-less values are not testable. */
export function compareValues(a: EvidenceValue, b: EvidenceValue): DifferenceTest {
  if (a.value === null || b.value === null) return { gap: null, z: null, verdict: 'not-testable' };
  const gap = a.value - b.value;
  if (a.status === 'open-ended' || b.status === 'open-ended' || a.moe === null || b.moe === null) {
    return { gap, z: null, verdict: 'not-testable' };
  }
  const se = Math.sqrt((a.moe / Z90) ** 2 + (b.moe / Z90) ** 2);
  if (se === 0) return { gap, z: null, verdict: gap === 0 ? 'similar' : gap > 0 ? 'higher' : 'lower' };
  const z = gap / se;
  return { gap, z, verdict: Math.abs(z) > Z90 ? (z > 0 ? 'higher' : 'lower') : 'similar' };
}

// ---- Report evidence ----

export const INCOME_THRESHOLDS = [50000, 75000, 100000, 150000] as const;
// First B19001 bracket at or above each threshold (B19001_011 = $50,000 to $59,999, ...).
const BRACKET_FROM: Record<number, number> = { 50000: 11, 75000: 13, 100000: 14, 150000: 16 };
const AGE_CELLS_25_44 = ['B01001_011', 'B01001_012', 'B01001_013', 'B01001_014', 'B01001_035', 'B01001_036', 'B01001_037', 'B01001_038'];

/** Variables fetched for the paid report, split to stay under the API's 50-variable limit. */
export const ACS_DETAIL_GROUPS: string[][] = [
  ['B01003_001', 'B19013_001', 'B25077_001', ...Array.from({ length: 17 }, (_, i) => `B19001_${String(i + 1).padStart(3, '0')}`)],
  ['B01001_001', ...AGE_CELLS_25_44],
];
export const ACS_PRIOR_GROUP = ['B01003_001'];

export function acsVariables(group: string[]): string[] {
  return group.flatMap(v => [`${v}E`, `${v}M`]);
}

/** Raw ACS values for one place: `{ 'B19013_001E': '93658', 'B19013_001M': '1670', ... }`. */
export type AcsRow = Record<string, string | number | null | undefined>;

export interface PlaceDetail {
  location: string;
  censusName: string;
  stateFips: string;
  placeFips: string;
  latest: AcsRow;   // ACS 5-year 2020–2024
  prior: AcsRow | null; // ACS 5-year 2015–2019
}

export interface PlaceEvidence {
  location: string;
  geography: { level: 'place'; name: string; fips: string };
  population: EvidenceValue;
  medianIncome: EvidenceValue;
  medianHomeValue: EvidenceValue;
  growth: EvidenceValue;
  households: EvidenceValue;
  affordable: Array<{ threshold: number; count: EvidenceValue; share: EvidenceValue }>;
  age25to44: { count: EvidenceValue; share: EvidenceValue };
}

const get = (row: AcsRow | null, v: string, variable = v) => (row ? acsValue(row[`${v}E`], row[`${v}M`], variable) : unavailable('This period was not available for this place.'));

export function placeEvidence(detail: PlaceDetail): PlaceEvidence {
  const r = detail.latest;
  const households = get(r, 'B19001_001');
  const affordable = INCOME_THRESHOLDS.map(threshold => {
    const cells = Array.from({ length: 17 - BRACKET_FROM[threshold] + 1 }, (_, i) => `B19001_${String(BRACKET_FROM[threshold] + i).padStart(3, '0')}`);
    const count = aggregate(cells.map(c => get(r, c)));
    return { threshold, count, share: proportion(count, households) };
  });
  const people = get(r, 'B01001_001');
  const ageCount = aggregate(AGE_CELLS_25_44.map(c => get(r, c)));
  const population = get(r, 'B01003_001');
  return {
    location: detail.location,
    geography: { level: 'place', name: detail.censusName, fips: `${detail.stateFips}${detail.placeFips}` },
    population,
    medianIncome: get(r, 'B19013_001'),
    medianHomeValue: get(r, 'B25077_001'),
    growth: detail.prior ? percentChange(population, get(detail.prior, 'B01003_001')) : unavailable('The 2015–2019 estimate was not available for this place.'),
    households,
    affordable,
    age25to44: { count: ageCount, share: proportion(ageCount, people) },
  };
}

export interface ComparisonCheck {
  metric: 'population' | 'medianIncome' | 'medianHomeValue' | 'growth' | 'affordableShare' | 'age25to44Share';
  label: string;
  unit: 'USD' | 'pct_points' | 'share' | 'count';
  primary: EvidenceValue;
  other: EvidenceValue;
  otherLocation: string;
  test: DifferenceTest;
  wording: string;
}

const usd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export function wordingFor(label: string, primary: string, other: string, test: DifferenceTest): string {
  const thing = label.charAt(0).toLowerCase() + label.slice(1);
  switch (test.verdict) {
    case 'higher': return `${label}: ${primary} is higher than ${other}.`;
    case 'lower': return `${label}: ${primary} is lower than ${other}.`;
    case 'similar': return `${label}: ${primary} and ${other} are statistically similar. The difference is within the margin of error, so don't rank them on ${thing}.`;
    default: return `${label}: ${primary} and ${other} can't be compared reliably, because a figure or its margin of error is missing or open-ended.`;
  }
}

export function compareEvidence(primary: PlaceEvidence, others: PlaceEvidence[], threshold = 75000): ComparisonCheck[] {
  const share = (p: PlaceEvidence) => p.affordable.find(a => a.threshold === threshold)?.share ?? unavailable('');
  const metrics: Array<[ComparisonCheck['metric'], string, ComparisonCheck['unit'], (p: PlaceEvidence) => EvidenceValue]> = [
    ['population', 'Population', 'count', p => p.population],
    ['medianIncome', 'Median household income', 'USD', p => p.medianIncome],
    ['affordableShare', `Share of households earning ${usd(threshold)} or more`, 'share', share],
    ['age25to44Share', 'Share of residents aged 25 to 44', 'share', p => p.age25to44.share],
    ['growth', 'Population change between 2015–2019 and 2020–2024', 'pct_points', p => p.growth],
    ['medianHomeValue', 'Median home value', 'USD', p => p.medianHomeValue],
  ];
  return others.flatMap(other => metrics.map(([metric, label, unit, pick]) => {
    const a = pick(primary), b = pick(other);
    const test = compareValues(a, b);
    const controlled = a.status === 'controlled' && b.status === 'controlled' && test.verdict !== 'not-testable';
    const wording = controlled
      ? `${wordingFor(label, primary.location, other.location, test)} These are controlled estimates with no sampling error, so no margin-of-error test applies.`
      : wordingFor(label, primary.location, other.location, test);
    return { metric, label, unit, primary: a, other: b, otherLocation: other.location, test, wording };
  }));
}

export interface ReportEvidence {
  schemaVersion: 1;
  status: 'ready' | 'partial';
  period: { latest: '2020–2024'; prior: '2015–2019' };
  source: { agency: 'U.S. Census Bureau'; dataset: 'American Community Survey 5-year estimates'; tables: string[]; url: string; retrievedAt: string };
  thresholds: number[];
  defaultThreshold: number;
  places: PlaceEvidence[];
  comparisons: ComparisonCheck[];
  reliabilityPolicy: string;
  method: string;
  plainText: string;
}

export const RELIABILITY_POLICY = 'Reliability uses the coefficient of variation (standard error divided by the estimate): up to 15% is good, up to 30% is fair, and above 30% is low. Low-reliability figures are shown with a caution.';
export const METHOD = 'Differences are tested with the Census Bureau method at 90% confidence: each margin of error is divided by 1.645 to get a standard error, and a difference counts as real when it is more than 1.645 combined standard errors. Totals and shares use the Census Bureau approximation formulas for margins of error.';

const pct = (v: number | null) => (v === null ? 'n/a' : `${(v * 100).toFixed(1)}%`);
const int = (v: number | null) => (v === null ? 'n/a' : Math.round(v).toLocaleString('en-US'));
const pm = (v: EvidenceValue, f: (n: number | null) => string) => (v.moe === null ? '' : ` (± ${f(v.moe)})`);
const pts = (v: number | null) => (v === null ? 'n/a' : `${(v * 100).toFixed(1)} percentage points`);

export function evidenceText(e: Pick<ReportEvidence, 'places' | 'comparisons' | 'defaultThreshold' | 'source'>, business: string | null): string {
  const lines: string[] = [];
  const [primary] = e.places;
  if (!primary) return '';
  lines.push(`Target market${business ? ` for a ${business}` : ''}`);
  for (const place of e.places) {
    const a = place.affordable.find(x => x.threshold === e.defaultThreshold);
    const parts: string[] = [];
    if (a && a.count.value !== null) parts.push(`${int(a.count.value)} households earn ${usd(e.defaultThreshold)} or more${pm(a.count, int)}, ${pct(a.share.value)} of households${pm(a.share, pts)}`);
    if (place.age25to44.count.value !== null) parts.push(`${int(place.age25to44.count.value)} residents are aged 25 to 44${pm(place.age25to44.count, int)}, ${pct(place.age25to44.share.value)} of residents`);
    lines.push(`- ${place.location} (city): ${parts.length ? parts.join('; ') : 'figures not published for this place'}.`);
  }
  lines.push('');
  lines.push('How sure the comparisons are');
  for (const c of e.comparisons) lines.push(`- ${c.wording}`);
  lines.push('');
  lines.push(`Source: ${e.source.agency}, ${e.source.dataset}, 2020–2024 (and 2015–2019 for change), tables ${e.source.tables.join(', ')}; city (Census place) level; margins of error at 90% confidence. Retrieved ${e.source.retrievedAt.slice(0, 10)}. ${METHOD}`);
  return lines.join('\n');
}

export function buildReportEvidence(primary: PlaceDetail, comparisons: PlaceDetail[], business: string | null, retrievedAt: string): ReportEvidence {
  const places = [primary, ...comparisons].map(placeEvidence);
  const checks = compareEvidence(places[0], places.slice(1));
  const anyMissing = places.some(p => [p.population, p.medianIncome, p.medianHomeValue, p.growth, p.households, p.age25to44.count].some(v => v.status === 'unavailable'));
  const source = {
    agency: 'U.S. Census Bureau' as const,
    dataset: 'American Community Survey 5-year estimates' as const,
    tables: ['B01003', 'B19013', 'B25077', 'B19001', 'B01001'],
    url: 'https://api.census.gov/data/2024/acs/acs5',
    retrievedAt,
  };
  const base = { places, comparisons: checks, defaultThreshold: 75000, source };
  return {
    schemaVersion: 1,
    status: anyMissing ? 'partial' : 'ready',
    period: { latest: '2020–2024', prior: '2015–2019' },
    source,
    thresholds: [...INCOME_THRESHOLDS],
    defaultThreshold: 75000,
    places,
    comparisons: checks,
    reliabilityPolicy: RELIABILITY_POLICY,
    method: METHOD,
    plainText: evidenceText(base, business),
  };
}

const ANALYSIS_METRIC: Record<string, ComparisonCheck['metric']> = { population: 'population', income: 'medianIncome', homeValue: 'medianHomeValue', growth: 'growth' };

/** Looks up the difference-test verdict for the primary place against one comparison. */
export function confidenceFrom(evidence: Pick<ReportEvidence, 'comparisons'>) {
  return (metric: 'population' | 'income' | 'homeValue' | 'growth', otherLocation: string): Verdict | undefined =>
    evidence.comparisons.find(c => c.metric === ANALYSIS_METRIC[metric] && c.otherLocation === otherLocation)?.test.verdict;
}

/** Suffix that states whether a comparison is a real difference. */
export function verdictSuffix(verdict: Verdict | undefined): string {
  if (verdict === 'higher' || verdict === 'lower') return ' This is a real difference at 90% confidence.';
  if (verdict === 'similar') return ' This is within the margin of error, so it is not a real difference.';
  if (verdict === 'not-testable') return " This difference can't be tested because a margin of error is missing.";
  return '';
}
