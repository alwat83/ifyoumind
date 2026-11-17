// Read-only projection of the authorized Decision Brief. The legacy save schema is unchanged.
const METRICS = {
  homeValue: { variable: 'B25077_001E', unit: 'USD', label: 'Median home value' },
  income: { variable: 'B19013_001E', unit: 'USD', label: 'Median household income' },
  population: { variable: 'B01003_001E', unit: 'people', label: 'Population' },
} as const;

type MetricKey = keyof typeof METRICS;
type CensusVariable = typeof METRICS[MetricKey]['variable'];
type CityUnit = typeof METRICS[MetricKey]['unit'];

const STATE_FIPS: Readonly<Record<string, string>> = {
  AL:'01', AK:'02', AZ:'04', AR:'05', CA:'06', CO:'08', CT:'09', DE:'10', DC:'11', FL:'12', GA:'13',
  HI:'15', ID:'16', IL:'17', IN:'18', IA:'19', KS:'20', KY:'21', LA:'22', ME:'23', MD:'24', MA:'25',
  MI:'26', MN:'27', MS:'28', MO:'29', MT:'30', NE:'31', NV:'32', NH:'33', NJ:'34', NM:'35', NY:'36',
  NC:'37', ND:'38', OH:'39', OK:'40', OR:'41', PA:'42', RI:'44', SC:'45', SD:'46', TN:'47',
  TX:'48', UT:'49', VT:'50', VA:'51', WA:'53', WV:'54', WI:'55', WY:'56',
};
const ACS = 'https://api.census.gov/data/2024/acs/acs5';
const sourceLabel = 'U.S. Census Bureau · 2024 ACS 5-year';

export interface CityObservation {
  readonly id: string;
  readonly key: MetricKey;
  readonly label: string;
  readonly value: number;
  readonly unit: CityUnit;
  readonly sourceLabel: string;
  readonly sourceUrl: string;
  readonly variable: CensusVariable;
  readonly direction: 'context';
}

export interface CityEvidencePlace {
  readonly location: string;
  readonly stateFips: string;
  readonly placeFips: string;
  readonly metrics: CityObservation[];
}

export interface CityDifference {
  readonly id: string;
  readonly formula: 'difference/v1';
  readonly label: string;
  readonly comparison: string;
  readonly primary: CityObservation;
  readonly other: CityObservation;
  readonly value: number;
}

export interface CityDecisionCase {
  readonly schemaVersion: 1;
  readonly intent: 'personal-living-cost' | 'city-comparison';
  readonly coverage: 'complete' | 'partial' | 'unavailable';
  readonly vintage: 2024;
  readonly primary: CityEvidencePlace | null;
  readonly places: CityEvidencePlace[];
  readonly calculations: CityDifference[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function observation(input: unknown, key: MetricKey, stateFips: string) {
  const row = asRecord(input);
  const spec = METRICS[key];
  if (!row || row['key'] !== key || row['unit'] !== spec.unit || typeof row['value'] !== 'number' ||
      !Number.isSafeInteger(row['value']) || row['value'] < 0 || typeof row['sourceUrl'] !== 'string' ||
      row['sourceUrl'].length > 512) return null;

  let source: URL;
  try { source = new URL(row['sourceUrl']); } catch { return null; }
  if (source.origin + source.pathname !== ACS || source.username || source.password || source.hash) return null;
  const params = source.searchParams;
  const tokens: string[] = [];
  params.forEach((_, name) => tokens.push(name));
  if (tokens.length !== 3 || new Set(tokens).size !== 3 || !['get', 'for', 'in'].every(name => params.has(name))) return null;
  if (params.get('in') !== 'state:' + stateFips || !params.get('get')?.split(',').includes(spec.variable)) return null;
  const placeFips = /^place:(\d{5})$/.exec(params.get('for') ?? '')?.[1];
  if (!placeFips || placeFips === '00000') return null;

  const id = `acs-2024-${stateFips}-${placeFips}-${spec.variable}`;
  // Link to the public table for that place. Census API data queries require a key.
  const table = spec.variable.split('_')[0];
  const publicTable = `https://data.census.gov/table/ACSDT5Y2024.${table}?g=160XX00US${stateFips}${placeFips}`;
  const metric: CityObservation = { id, key, ...spec, value: row['value'], sourceLabel, sourceUrl: publicTable, direction: 'context' };
  return { placeFips, metric };
}

function decodePlace(input: unknown): CityEvidencePlace | null {
  const place = asRecord(input);
  const location = place?.['location'];
  const metrics = place?.['metrics'];
  if (typeof location !== 'string' || !Array.isArray(metrics) || metrics.length > 12) return null;
  const state = /^[^,]{1,150}, ([A-Z]{2})$/.exec(location)?.[1];
  const stateFips = state && STATE_FIPS[state];
  if (!stateFips) return null;

  const rows = (Object.keys(METRICS) as MetricKey[]).flatMap(key => {
    const candidates = metrics.filter(row => asRecord(row)?.['key'] === key);
    const decoded = candidates.length === 1 ? observation(candidates[0], key, stateFips) : null;
    return decoded ? [decoded] : [];
  });
  const placeFips = rows[0]?.placeFips;
  if (!placeFips || rows.some(row => row.placeFips !== placeFips)) return null;
  return { location, stateFips, placeFips, metrics: rows.map(row => row.metric) };
}

/** Accept only observed ACS receipts. Historic growth rows do not carry both source observations. */
export function buildCityDecisionCase(primary: unknown, comparisons: readonly unknown[],
  intent: CityDecisionCase['intent']): CityDecisionCase {
  const main = decodePlace(primary);
  const seen = new Set<string>();
  if (main) seen.add(main.stateFips + main.placeFips);
  const primaryLocation = asRecord(primary)?.['location'];
  const validComparisons = comparisons.slice(0, 3).flatMap(input => {
    const place = decodePlace(input);
    const key = place && place.stateFips + place.placeFips;
    if (!place || !key || place.location === primaryLocation || seen.has(key)) return [];
    seen.add(key);
    return [place];
  });
  const places = main ? [main, ...validComparisons] : validComparisons;
  const calculations: CityDifference[] = [];
  for (const place of validComparisons) {
    for (const first of main?.metrics ?? []) {
      const other = place.metrics.find(metric => metric.key === first.key);
      if (!other) continue;
      calculations.push({ id: first.id + '-' + other.id, formula: 'difference/v1', label: first.label,
        comparison: place.location, primary: first, other, value: first.value - other.value });
    }
  }
  const complete = !!main && comparisons.length > 0 && validComparisons.length === comparisons.length &&
    places.every(place => place.metrics.length === Object.keys(METRICS).length);
  return { schemaVersion: 1, intent, vintage: 2024, primary: main, places, calculations,
    coverage: !places.length ? 'unavailable' : complete && intent === 'city-comparison' ? 'complete' : 'partial' };
}
