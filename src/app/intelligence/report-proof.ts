import type { MarketBrief } from './market-intelligence.service';

export type ProofKey = 'income' | 'growth';
export interface ProofRow { location: string; value: number | null; left: number; width: number; sourceUrl: string | null }
export interface ProofLens {
  key: ProofKey; label: string; period: string; rows: ProofRow[]; zero: number;
  highest: number | null; places: string; complete: boolean; highlightLabel: string;
}
export interface ProofSource { dataset: string; period: string; url: string; retrievedAt: string | null }
export interface ReportProof { lenses: ProofLens[]; sources: ProofSource[]; crossed: boolean }

/** Only display the official ACS references actually present in this saved report. */
function acsUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.hostname === 'api.census.gov' && /^\/data\/\d{4}\/acs\/acs5\/?$/.test(url.pathname) ? url : null;
  } catch { return null; }
}
function period(url: URL): string {
  const year = Number(url.pathname.split('/')[2]);
  return `${year - 4}–${year}`;
}
export function proofNumber(value: number, key: ProofKey): string {
  return key === 'income'
    ? new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits:0}).format(value)
    : `${value}%`;
}

/** Presentation of saved measures, not a score, recommendation or new analytical model. */
export function buildReportProof(location: string, brief: MarketBrief | undefined): ReportProof | null {
  if (!location || !brief || !Array.isArray(brief.metrics) || !Array.isArray(brief.comparisons)) return null;
  const places = [{location, metrics:brief.metrics}, ...brief.comparisons];
  if (places.length < 2 || places.some(p => !p?.location || !Array.isArray(p.metrics)) || new Set(places.map(p=>p.location)).size !== places.length) return null;
  const sources: ProofSource[] = (Array.isArray(brief.sources) ? brief.sources : []).flatMap(source => {
    const url = acsUrl(source?.url);
    if (!url) return [];
    const retrievedAt = typeof source.retrievedAt === 'string' && Number.isFinite(Date.parse(source.retrievedAt)) ? new Date(source.retrievedAt).toISOString() : null;
    return [{dataset:typeof source.dataset==='string'?source.dataset:'ACS 5-year estimates', period:period(url), url:url.href, retrievedAt}];
  });
  const lenses: ProofLens[] = [];
  for (const key of ['income','growth'] as const) {
    const rows: ProofRow[] = places.map(place => {
      const matches = place.metrics.filter(m=>m?.key===key);
      const metric = matches.length === 1 ? matches[0] : undefined;
      const value = metric?.unit === (key==='income'?'USD':'%') && typeof metric.value === 'number' && Number.isFinite(metric.value) && (key!=='income'||metric.value>=0) ? metric.value : null;
      return {location:place.location, value, left:0, width:0, sourceUrl:acsUrl(metric?.sourceUrl)?.href || null};
    });
    const values = rows.flatMap(r=>r.value===null?[]:[r.value]);
    if (values.length < 2) continue;
    // Normalize first so extreme finite values cannot overflow a diverging scale.
    const scale = Math.max(...values.map(Math.abs), 1);
    const low = Math.min(0,...values.map(v=>v/scale)), high = Math.max(0,...values.map(v=>v/scale));
    const span = high-low || 1, zero = -low/span*100;
    rows.forEach(row=>{if(row.value!==null){const position=(row.value/scale-low)/span*100;row.left=Math.min(zero,position);row.width=Math.abs(position-zero);}});
    const complete = values.length === rows.length;
    const highest = complete ? Math.max(...values) : null;
    const leaders = highest === null ? [] : rows.filter(r=>r.value===highest).map(r=>r.location);
    const incomePeriods = new Set(rows.map(r=>r.sourceUrl?period(new URL(r.sourceUrl)):null));
    const sourcePeriods = [...new Set(sources.map(s=>s.period))].sort();
    if (key==='income' && [...incomePeriods].filter(p=>p!==null).length>1) continue;
    const dataPeriod = key==='income'
      ? incomePeriods.size===1 && !incomePeriods.has(null) ? `${[...incomePeriods][0]} ACS estimates` : 'Data period not recorded consistently'
      : sourcePeriods.length===2 ? `${sourcePeriods.join(' to ')} ACS estimates` : 'Comparison periods not recorded';
    lenses.push({key, label:key==='income'?'Household income':'Population change', period:dataPeriod, rows, zero, highest, places:leaders.join(' / '), complete, highlightLabel:leaders.length===rows.length?'Same estimate in all cities':leaders.length>1?'Joint highest estimate':'Highest shown estimate'});
  }
  if (!lenses.length) return null;
  const [income,growth] = lenses;
  const crossed = lenses.length===2 && income.complete && growth.complete && income.rows.filter(r=>r.value===income.highest).length===1 && growth.rows.filter(r=>r.value===growth.highest).length===1 && income.places!==growth.places && (growth.highest ?? 0)>0;
  return {lenses, sources, crossed};
}
