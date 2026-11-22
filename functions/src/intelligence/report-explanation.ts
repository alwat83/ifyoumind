import { createHash } from 'node:crypto';
import { EXPLANATION_MODEL, sendExplanationRequest, ProviderDiagnostic } from './openai-explanation';
import { decisionReportAccess, decisionView } from './report-entitlement-logic';

export const REPORT_AI_LIMITS = { userDay: 3, globalDay: 20, globalMonth: 200, reservedMicroUsd: 5_000, monthlyMicroUsd: 1_000_000 } as const;
export const REPORT_AI_CONSENT = 'public-census-explanation-v1';
const meanings: Record<string, { label: string; unit: string; limitation: string }> = {
  population: { label: 'population estimate', unit: 'people', limitation: 'Population does not establish demand for a particular business.' },
  income: { label: 'median household income estimate', unit: 'USD', limitation: 'Household income is not an individual salary or a personal cost-of-living calculation.' },
  homeValue: { label: 'median home value estimate', unit: 'USD', limitation: 'Home value is not rent, a current listing price, or a prediction of your housing costs.' },
};
export const REPORT_AI_NEXT = {
  costs: 'Check current housing, transport and other costs that matter to your decision. These Census estimates do not measure your personal expenses.',
  demand: 'Check local demand, competition and commercial rent before committing to a business location.',
  housing: 'Compare current listings and your actual housing budget before deciding where to live.',
} as const;
export interface ReportFact { id: string; place: string; label: string; value: number; unit: string; statement: string; limitation: string; sourceUrl: string; }
export interface ReportPacket { facts: ReportFact[]; digest: string; }
const record = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

/** Match the existing reader's entitlement-filtered view. Explaining a free brief never unlocks a report. */
export function visibleReportEvidence(project: Record<string, unknown>): ReportPacket | null {
  const access = project.decisionReportGenerationRequired === true ? 'none' : decisionReportAccess(project);
  const view = decisionView(project, access);
  return projectReportEvidence({ mode: project.mode, brief: view.brief });
}

/** Only public, sourced metrics. No question, name, concept, city name, bill or identifier leaves the server. */
export function projectReportEvidence(project: unknown): ReportPacket | null {
  if (!record(project) || project.mode !== 'live' || !record(project.brief)) return null;
  const brief = project.brief;
  if (!Array.isArray(brief.metrics) || !brief.metrics.length || !Array.isArray(brief.comparisons) || brief.comparisons.length > 3) return null;
  const places = [{ metrics: brief.metrics }, ...brief.comparisons];
  const facts: ReportFact[] = [];
  for (const [index, place] of places.entries()) {
    if (!record(place) || !Array.isArray(place.metrics) || place.metrics.length > 8) return null;
    const seen = new Set<string>();
    for (const m of place.metrics) {
      if (!record(m) || typeof m.key !== 'string' || !Object.prototype.hasOwnProperty.call(meanings, m.key)) continue;
      const meaning = meanings[m.key];
      if (seen.has(m.key) || typeof m.value !== 'number' || !Number.isFinite(m.value) || m.value <= 0 || m.value > 1e12 ||
          m.unit !== meaning.unit || typeof m.sourceUrl !== 'string') return null;
      // Exact existing Census retrieval route; URL cannot carry arbitrary user text or another host.
      let url: URL;
      try { url = new URL(m.sourceUrl); } catch { return null; }
      if (url.origin !== 'https://api.census.gov' || url.pathname !== '/data/2024/acs/acs5' || url.hash || url.username || url.password ||
          url.searchParams.get('get') !== 'NAME,B01003_001E,B19013_001E,B25077_001E' ||
          !/^place:\d{1,7}$/.test(url.searchParams.get('for') || '') || !/^state:\d{2}$/.test(url.searchParams.get('in') || '') ||
          [...url.searchParams.keys()].sort().join(',') !== 'for,get,in') return null;
      seen.add(m.key);
      const alias = `Place ${index + 1}`;
      const display = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, ...(meaning.unit === 'USD' ? { style: 'currency', currency: 'USD' } : {}) }).format(m.value);
      facts.push({ id: `p${index}.${m.key}`, place: alias, label: meaning.label, value: m.value, unit: meaning.unit,
        statement: `${alias}: the saved 2024 ACS five-year ${meaning.label} is ${display}${meaning.unit === 'people' ? ' people' : ''}.`,
        limitation: meaning.limitation, sourceUrl: url.toString() });
    }
    if (!seen.size) return null; // Invalid/unavailable primary evidence must never leave a comparison-only conclusion.
  }
  if (!facts.length) return null;
  return { facts, digest: createHash('sha256').update(JSON.stringify(facts)).digest('hex') };
}

export interface ReportSelection { lead: string; observations: string[]; nextStep: keyof typeof REPORT_AI_NEXT; }
export function validReportSelection(selected: unknown, packet: ReportPacket): selected is ReportSelection {
  const ids = packet.facts.map(f => f.id);
  return record(selected) && Object.keys(selected).sort().join(',') === 'lead,nextStep,observations' &&
    typeof selected.lead === 'string' && ids.includes(selected.lead) && Array.isArray(selected.observations) &&
    selected.observations.length >= Math.min(2, ids.length - 1) && selected.observations.length <= 3 && selected.observations.every(id => typeof id === 'string' && ids.includes(id)) &&
    new Set([selected.lead, ...selected.observations]).size === selected.observations.length + 1 &&
    typeof selected.nextStep === 'string' && Object.prototype.hasOwnProperty.call(REPORT_AI_NEXT, selected.nextStep);
}
export function renderReportExplanation(packet: ReportPacket, selection: ReportSelection, source: 'openai' | 'deterministic') {
  const by = new Map(packet.facts.map(f => [f.id, f]));
  return { source, schemaVersion: 1, takeaway: by.get(selection.lead)!, observations: selection.observations.map(id => by.get(id)!),
    nextStep: REPORT_AI_NEXT[selection.nextStep], limitation: 'Saved public Census estimates, not a current market forecast. Differences are not tested for statistical significance. This does not establish causation, personal expenses, demand or profitability.',
    evidenceDigest: packet.digest };
}
export function deterministicReportExplanation(packet: ReportPacket) {
  return renderReportExplanation(packet, { lead: packet.facts[0].id, observations: packet.facts.slice(1, 4).map(f => f.id), nextStep: 'costs' }, 'deterministic');
}

export async function explainReportEvidence(packet: ReportPacket, apiKey: string, send: typeof fetch = fetch, observe?: (value: ProviderDiagnostic) => void) {
  const ids = packet.facts.map(f => f.id);
  const body = JSON.stringify({ model: EXPLANATION_MODEL, store: false, service_tier: 'default', truncation: 'disabled',
    reasoning: { effort: 'none' }, max_output_tokens: 512,
    instructions: 'Compose a useful evidence summary by selecting the most relevant supplied fact as the takeaway and up to three other facts as observations. Select one useful next check. Return only IDs. The server renders every amount, source and limitation; do not generate prose or infer causation, demand, savings or personal expenses. Place aliases follow the report order.',
    input: JSON.stringify({ facts: packet.facts.map(({ id, place, label, value, unit }) => ({ id, place, label, value, unit })), scope: 'public-city-evidence' }),
    text: { format: { type: 'json_schema', name: 'report_evidence_summary', strict: true, schema: { type: 'object', additionalProperties: false,
      required: ['lead', 'observations', 'nextStep'], properties: { lead: { type: 'string', enum: ids },
        observations: { type: 'array', minItems: Math.min(2, ids.length - 1), maxItems: 3, items: { type: 'string', enum: ids } },
        nextStep: { type: 'string', enum: Object.keys(REPORT_AI_NEXT) } } } } },
  });
  return sendExplanationRequest(apiKey, body, response => {
    if (!record(response) || response.status !== 'completed' || response.error != null || response.incomplete_details != null || response.service_tier !== 'default' ||
        !record(response.usage) || !Number.isSafeInteger(response.usage.input_tokens) || !Number.isSafeInteger(response.usage.output_tokens) ||
        Number(response.usage.input_tokens) < 1 || Number(response.usage.input_tokens) > 16_384 || Number(response.usage.output_tokens) < 1 || Number(response.usage.output_tokens) > 512 ||
        !Array.isArray(response.output) || response.output.length !== 1) return null;
    const message = response.output[0];
    if (!record(message) || message.type !== 'message' || message.role !== 'assistant' || message.status !== 'completed' || !Array.isArray(message.content) || message.content.length !== 1) return null;
    const content = message.content[0];
    if (!record(content) || content.type !== 'output_text' || typeof content.text !== 'string') return null;
    let selected: unknown;
    try { selected = JSON.parse(content.text); } catch { return null; }
    if (!record(selected) || Object.keys(selected).join(',') !== 'lead,observations,nextStep' ||
        content.text.replace(/\s/g, '') !== JSON.stringify(selected) || typeof selected.lead !== 'string' || !ids.includes(selected.lead) ||
        !validReportSelection(selected, packet) || !Array.isArray(selected.observations) || selected.observations.length > 3 || selected.observations.some(id => typeof id !== 'string' || !ids.includes(id)) ||
        new Set([selected.lead, ...selected.observations]).size !== selected.observations.length + 1 ||
        typeof selected.nextStep !== 'string' || !Object.prototype.hasOwnProperty.call(REPORT_AI_NEXT, selected.nextStep)) return null;
    return { selection: selected as unknown as ReportSelection, usage: { inputTokens: Number(response.usage.input_tokens), outputTokens: Number(response.usage.output_tokens),
      estimatedMicroUsd: Math.ceil(Number(response.usage.input_tokens) / 10 + Number(response.usage.output_tokens) / 2) }, model: EXPLANATION_MODEL };
  }, send, 12_288, observe);
}

export function reportExplanationEnabled(env: NodeJS.ProcessEnv = process.env, organizationId = ''): boolean {
  if (env.GCLOUD_PROJECT !== 'ifyoumind-473fe' || env.ENABLE_REPORT_OPENAI_EXPLANATION !== 'true' || env.FUNCTIONS_EMULATOR === 'true' ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(organizationId)) return false;
  const enrollment = env.REPORT_OPENAI_ENROLLMENT || '';
  if (enrollment === 'public') return true;
  const ids = enrollment.split(',').filter(Boolean);
  return ids.length > 0 && ids.length <= 10 && ids.every(id => /^[A-Za-z0-9_-]{1,128}$/.test(id)) && ids.includes(organizationId);
}
