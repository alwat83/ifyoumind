import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const AI_SYNTHESIS_MODEL = defineString('AI_SYNTHESIS_MODEL', { default: 'gpt-6-luna' });

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface SynthesisPoint {
  signalId: string;
  statement: string;
}

interface SynthesisResult {
  headline: string;
  explanation: string;
  evidencePoints: SynthesisPoint[];
  alternativeInterpretations: string[];
  caveats: string[];
  confidenceExplanation: string;
}

function cleanString(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new Error(`Invalid AI field: ${label}`);
  }
  return value.trim();
}

function cleanStringArray(value: unknown, label: string, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`Invalid AI field: ${label}`);
  return value.map((item, index) => cleanString(item, `${label}[${index}]`, maxLength));
}

function outputText(response: any): string {
  for (const item of response?.output || []) {
    if (item?.type !== 'message') continue;
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  throw new Error('AI response did not contain output text.');
}

function numericTokens(text: string): string[] {
  return text.match(/-?\d+(?:\.\d+)?/g) || [];
}

function validateNumbers(result: SynthesisResult, allowedNumbers: Set<string>): void {
  const prose = [
    result.headline,
    result.explanation,
    result.confidenceExplanation,
    ...result.alternativeInterpretations,
    ...result.caveats,
    ...result.evidencePoints.map((point) => point.statement),
  ].join(' ');

  for (const token of numericTokens(prose)) {
    const normalized = Number(token).toString();
    if (!allowedNumbers.has(normalized)) {
      throw new Error(`AI introduced unsupported numeric claim: ${token}`);
    }
  }
}

function validateSynthesis(raw: unknown, allowedSignalIds: Set<string>, allowedNumbers: Set<string>): SynthesisResult {
  if (!raw || typeof raw !== 'object') throw new Error('AI synthesis must be an object.');
  const data = raw as Record<string, unknown>;

  const evidenceRaw = data.evidencePoints;
  if (!Array.isArray(evidenceRaw) || evidenceRaw.length > 6) {
    throw new Error('Invalid AI evidence points.');
  }

  const evidencePoints: SynthesisPoint[] = evidenceRaw.map((point, index) => {
    if (!point || typeof point !== 'object') throw new Error(`Invalid evidence point ${index}`);
    const value = point as Record<string, unknown>;
    const signalId = cleanString(value.signalId, `evidencePoints[${index}].signalId`, 120);
    if (!allowedSignalIds.has(signalId)) throw new Error(`AI referenced unknown signal: ${signalId}`);
    return {
      signalId,
      statement: cleanString(value.statement, `evidencePoints[${index}].statement`, 300),
    };
  });

  const result: SynthesisResult = {
    headline: cleanString(data.headline, 'headline', 180),
    explanation: cleanString(data.explanation, 'explanation', 1400),
    evidencePoints,
    alternativeInterpretations: cleanStringArray(data.alternativeInterpretations, 'alternativeInterpretations', 4, 360),
    caveats: cleanStringArray(data.caveats, 'caveats', 5, 320),
    confidenceExplanation: cleanString(data.confidenceExplanation, 'confidenceExplanation', 500),
  };

  validateNumbers(result, allowedNumbers);
  return result;
}

export const synthesizeUniversalAnalysis = onCall(
  { secrets: [OPENAI_API_KEY], timeoutSeconds: 120 },
  async (request) => {
    const scope = await authorizeOrganization(
      request.auth?.uid,
      request.data?.organizationId,
      readMembership,
    );

    const analysisRunId: unknown = request.data?.analysisRunId;
    if (typeof analysisRunId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(analysisRunId)) {
      throw new HttpsError('invalid-argument', 'Invalid analysis run.');
    }

    const runRef = organizations().doc(scope.organizationId).collection('analysisRuns').doc(analysisRunId);
    const snapshot = await runRef.get();
    if (!snapshot.exists) throw new HttpsError('not-found', 'Analysis run not found.');

    const run = snapshot.data()!;
    const reasoning = run.result;
    if (!reasoning?.target || !Array.isArray(reasoning.allSignals)) {
      throw new HttpsError('failed-precondition', 'Analysis run does not contain a reasoning packet.');
    }

    const signals = reasoning.allSignals.map((signal: any, index: number) => ({
      signalId: `signal-${index + 1}`,
      datasetName: signal.datasetName,
      source: signal.source,
      correlation: signal.correlation,
      magnitude: signal.magnitude,
      direction: signal.direction,
      matchedObservations: signal.matchedObservations,
    }));

    const allowedSignalIds = new Set(signals.map((signal: any) => signal.signalId));
    const allowedNumbers = new Set<string>();
    for (const signal of signals) {
      allowedNumbers.add(Number(signal.correlation).toString());
      allowedNumbers.add(Number(signal.matchedObservations).toString());
    }

    const packet = {
      target: reasoning.target,
      deterministicConclusion: reasoning.conclusion,
      deterministicInterpretation: reasoning.interpretation,
      confidence: reasoning.confidence,
      signals,
      limitations: reasoning.limitations,
      policy: reasoning.reasoningPolicy,
    };

    const instructions = [
      'You are the synthesis layer for ifYouMind, an evidence-first data reasoning product.',
      'Use ONLY the supplied evidence packet. Do not introduce external facts, domain knowledge, causes, entities, numbers, or assumptions.',
      'Never claim causation. Association may be described only as association, relationship, pattern, or candidate explanatory signal.',
      'Distinguish supporting evidence from alternative interpretations and uncertainty.',
      'Return JSON only with keys: headline, explanation, evidencePoints, alternativeInterpretations, caveats, confidenceExplanation.',
      'evidencePoints must be objects with signalId and statement. Every signalId must come from the packet.',
      'Do not include any numeric value unless it appears verbatim in the evidence packet.',
      'Keep the prose concise and understandable to a non-statistician.',
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${OPENAI_API_KEY.value()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_SYNTHESIS_MODEL.value(),
        instructions,
        input: JSON.stringify(packet),
        max_output_tokens: 900,
        store: false,
      }),
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error('AI synthesis failed', response.status, responseData?.error?.type);
      throw new HttpsError('unavailable', 'AI synthesis is temporarily unavailable.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputText(responseData));
    } catch {
      throw new HttpsError('internal', 'AI synthesis returned an invalid format.');
    }

    let synthesis: SynthesisResult;
    try {
      synthesis = validateSynthesis(parsed, allowedSignalIds, allowedNumbers);
    } catch (error) {
      console.error('AI synthesis validation rejected response', error);
      throw new HttpsError('internal', 'AI synthesis failed evidence validation.');
    }

    await runRef.set({
      synthesis,
      synthesisModel: AI_SYNTHESIS_MODEL.value(),
      synthesizedAt: FieldValue.serverTimestamp(),
      synthesisPolicyVersion: 1,
    }, { merge: true });

    return {
      analysisRunId,
      synthesis,
      model: AI_SYNTHESIS_MODEL.value(),
    };
  },
);
