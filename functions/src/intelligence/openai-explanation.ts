export const EXPLANATION_MODEL = 'gpt-6-luna';
export const MAX_INPUT_TOKENS = 768;
export const MAX_OUTPUT_TOKENS = 128;
const MAX_REQUEST_BYTES = 1_024;
const MAX_RESPONSE_BYTES = 16_384;
const PROVIDER_TIMEOUT_MS = 5_000;
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

const facts = { households: { marketA: 12_000, marketB: 9_000 }, income: { marketA: 62_000, marketB: 68_000 } };
const number = new Intl.NumberFormat('en-US');
const households = facts.households;
const income = facts.income;
const householdDifference = households.marketA - households.marketB;
const incomeDifference = income.marketB - income.marketA;
const source = 'Synthetic market fixture. Illustrative figures, not real places or Census results.';
const evidence = {
  households: {
    id: 'households',
    statement: `Market A has ${number.format(households.marketA)} households and Market B has ${number.format(households.marketB)}. The difference is ${number.format(householdDifference)} households.`,
    source,
  },
  income: {
    id: 'income',
    statement: `Market A has a median household income of $${number.format(income.marketA)} and Market B has $${number.format(income.marketB)}. Market B is $${number.format(incomeDifference)} higher.`,
    source,
  },
} as const;
const caveat = 'Household counts and median income do not establish customer demand, profitability, or why the markets differ.';

type EvidenceId = keyof typeof evidence;

export function renderExplanation(lead: EvidenceId, source: 'openai' | 'deterministic') {
  const secondary = lead === 'households' ? 'income' : 'households';
  return { source, synthetic: true as const, evidence: [evidence[lead], evidence[secondary]], caveat };
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;
}

function tokenCount(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= max;
}

export function validateExplanationResponse(value: unknown) {
  const response = object(value);
  if (response?.status !== 'completed' || response.error != null || response.incomplete_details != null ||
      response.service_tier !== 'default') return null;
  const usage = object(response.usage);
  if (!tokenCount(usage?.input_tokens, MAX_INPUT_TOKENS) || !tokenCount(usage?.output_tokens, MAX_OUTPUT_TOKENS)) return null;
  // With reasoning off and no tools the only expected item is a completed assistant message.
  if (!Array.isArray(response.output) || response.output.length !== 1) return null;
  const message = object(response.output[0]);
  if (message?.type !== 'message' || message.role !== 'assistant' || message.status !== 'completed' ||
      !Array.isArray(message.content) || message.content.length !== 1) return null;
  const part = object(message.content[0]);
  if (part?.type !== 'output_text' || typeof part.text !== 'string' || part.text.length > 128) return null;
  // Canonical single-field JSON. Reject duplicate keys and any generated prose, even with a valid citation.
  const selection = /^\{\s*"lead"\s*:\s*"(households|income)"\s*\}$/.exec(part.text.trim());
  return selection ? {
    lead: selection[1] as EvidenceId,
    usage: { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens, serviceTier: response.service_tier },
  } : null;
}

const requestInput = {
  model: EXPLANATION_MODEL,
  instructions: 'Choose which verified fact should lead a plain-language overview of market tradeoffs. Return only the requested evidence ID. All figures and caveats are rendered by the server.',
  input: JSON.stringify({
    synthetic: true,
    facts: [
      { id: 'households', metric: 'households', ...households, differenceAOverB: householdDifference },
      { id: 'income', metric: 'median household income USD', ...income, differenceBOverA: incomeDifference },
    ],
    limitation: 'These figures cannot establish demand, profitability, or causation.',
  }),
  reasoning: { effort: 'none' },
  text: {
    format: {
      type: 'json_schema', name: 'explanation_lead', strict: true,
      schema: {
        type: 'object', additionalProperties: false, required: ['lead'],
        properties: { lead: { type: 'string', enum: Object.keys(evidence) } },
      },
    },
  },
};

const requestBody = JSON.stringify({
  ...requestInput, max_output_tokens: MAX_OUTPUT_TOKENS, store: false, service_tier: 'default', truncation: 'disabled',
});

async function readBoundedJson(response: Response): Promise<unknown> {
  if (!response.ok) {
    await response.body?.cancel();
    return null;
  }
  const reader = response.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '';
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) return null;
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function selectExplanationLead(apiKey: string, send: typeof fetch = fetch) {
  // Guard the fixed payload before spending a request. Provider framing is checked via reported usage below.
  if (Buffer.byteLength(requestBody, 'utf8') > MAX_REQUEST_BYTES) return null;
  try {
    const signal = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);
    const response = await readBoundedJson(await send(RESPONSES_URL, {
      method: 'POST', redirect: 'error', signal,
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: requestBody,
    }));
    return signal.aborted ? null : validateExplanationResponse(response);
  } catch {
    // Provider responses and exception messages can include content. Return no raw details.
    return null;
  }
}
