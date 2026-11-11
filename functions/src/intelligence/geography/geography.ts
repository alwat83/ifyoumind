// City -> counties -> metro area resolver (Phase 2 step R4.1). Not wired into reports yet.
//
// Counties come from the ACS "county (or part)" geography within a place (summary level 155): one
// Census request per city, which also returns each county part's population. Metro areas come from
// the bundled July 2023 CBSA delineation (cbsa-2023.ts).
//
// Rule: county figures are never apportioned to a city. The population shares returned here describe
// how a city's residents are split across counties, for display ("most of Austin is in Travis County");
// they must not be used to weight county statistics.
import { CBSA_2023, CBSA_2023_VINTAGE, COUNTY_TO_CBSA_2023 } from './cbsa-2023';

export interface CountyPart {
  /** 5-digit county FIPS (state + county). */
  fips: string;
  name: string;
  /** Residents of the city living in this county (ACS B01003, "county (or part)"), or null if not published. */
  population: number | null;
  /** This part's share of the city's residents, from the same estimates; null when any part is missing. */
  share: number | null;
}

export interface Cbsa { code: string; title: string; type: 'Metro' | 'Micro'; vintage: string; }

export interface PlaceGeography {
  place: { fips: string; name: string };
  counties: CountyPart[];
  /** The metro or micro area, when every county of the city belongs to the same one. */
  cbsa: Cbsa | null;
  /** All metro or micro areas the city's counties belong to (more than one is rare but possible). */
  cbsas: Cbsa[];
  notes: string[];
}

export function cbsaForCounty(countyFips: string): Cbsa | null {
  const code = COUNTY_TO_CBSA_2023[countyFips];
  const entry = code ? CBSA_2023[code] : undefined;
  return code && entry ? { code, title: entry[0], type: entry[1], vintage: CBSA_2023_VINTAGE } : null;
}

/** The Census request for the counties a place spans, with population per county part. */
export function countyPartsQuery(stateFips: string, placeFips: string): { path: string; params: Record<string, string> } {
  if (!/^\d{2}$/.test(stateFips) || !/^\d{5}$/.test(placeFips)) throw new Error('State FIPS must be 2 digits and place FIPS 5 digits.');
  return {
    path: '/data/2024/acs/acs5',
    params: { get: 'NAME,B01003_001E', for: 'county (or part):*', in: `state:${stateFips} place:${placeFips}` },
  };
}

/** Parses the Census response for `county (or part)` within a place. Annotated or missing values stay null. */
export function parseCountyParts(rows: unknown): CountyPart[] {
  if (!Array.isArray(rows) || !Array.isArray(rows[0])) throw new Error('Unexpected Census response shape.');
  const headers = rows[0] as string[];
  const at = (name: string) => headers.indexOf(name);
  const [iName, iPop, iState, iCounty] = [at('NAME'), at('B01003_001E'), at('state'), at('county (or part)')];
  if (iState < 0 || iCounty < 0) throw new Error('Census response is missing state or county columns.');
  const parts = (rows.slice(1) as string[][]).map(row => {
    const pop = Number(row[iPop]);
    return {
      fips: `${row[iState]}${row[iCounty]}`,
      name: String(row[iName] ?? '').split(';').map(s => s.trim())[0] || `County ${row[iCounty]}`,
      population: Number.isFinite(pop) && pop >= 0 ? pop : null,
      share: null as number | null,
    };
  });
  const total = parts.reduce((sum, p) => sum + (p.population ?? 0), 0);
  const complete = parts.every(p => p.population !== null) && total > 0;
  for (const p of parts) p.share = complete ? (p.population as number) / total : null;
  return parts.sort((a, b) => (b.population ?? -1) - (a.population ?? -1));
}

export function resolvePlaceGeography(place: { stateFips: string; placeFips: string; name: string }, counties: CountyPart[]): PlaceGeography {
  const notes: string[] = [];
  const found = new Map<string, Cbsa>();
  const outside: string[] = [];
  for (const county of counties) {
    const cbsa = cbsaForCounty(county.fips);
    if (cbsa) found.set(cbsa.code, cbsa); else outside.push(county.name);
  }
  const cbsas = [...found.values()];
  if (!counties.length) notes.push('The Census Bureau returned no counties for this place.');
  if (counties.length > 1) notes.push(`This city lies in ${counties.length} counties. County figures are shown for each county and are never apportioned to the city.`);
  if (outside.length) notes.push(`${outside.join(', ')} ${outside.length === 1 ? 'is' : 'are'} not part of any metro or micro area.`);
  if (cbsas.length > 1) notes.push('The city\'s counties belong to more than one metro or micro area, so metro figures are shown for each.');
  if (counties.some(c => c.population === null)) notes.push('The Census Bureau did not publish the population of every county part.');
  return {
    place: { fips: `${place.stateFips}${place.placeFips}`, name: place.name },
    counties,
    cbsa: cbsas.length === 1 && !outside.length ? cbsas[0] : null,
    cbsas,
    notes,
  };
}
