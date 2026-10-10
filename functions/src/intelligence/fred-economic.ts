import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const fredApiKey = defineSecret('FRED_API_KEY');
const SERIES = {
  inflation: { id: 'CPIAUCSL', label: 'Consumer Price Index', units: 'index', frequency: 'monthly' },
  unemployment: { id: 'UNRATE', label: 'Unemployment rate', units: 'percent', frequency: 'monthly' },
  policyRate: { id: 'DFEDTARU', label: 'Federal funds target range upper limit', units: 'percent', frequency: 'daily' },
  gdp: { id: 'GDP', label: 'Gross domestic product', units: 'billions of dollars', frequency: 'quarterly' },
  housing: { id: 'HOUST', label: 'Housing starts', units: 'thousands of units', frequency: 'monthly' },
} as const;

type Indicator = keyof typeof SERIES;

export const getFredEconomicIndicators = onCall(
  { secrets: [fredApiKey], timeoutSeconds: 45, maxInstances: 10 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to access economic data.');
    const indicator = request.data?.indicator as Indicator;
    if (!Object.prototype.hasOwnProperty.call(SERIES, indicator)) {
      throw new HttpsError('invalid-argument', 'Choose a supported economic indicator.');
    }
    const key = fredApiKey.value();
    if (!key) throw new HttpsError('failed-precondition', 'Economic data service is not configured.');
    const series = SERIES[indicator];
    const url = new URL('https://api.stlouisfed.org/fred/series/observations');
    url.searchParams.set('series_id', series.id);
    url.searchParams.set('api_key', key);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '24');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('FRED HTTP ' + response.status);
      const payload = await response.json() as { observations?: Array<{ date?: string; value?: string }> };
      if (!Array.isArray(payload.observations)) throw new Error('Unexpected FRED response');
      const observations = payload.observations
        .filter((row) => typeof row.date === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(row.date) && typeof row.value === 'string' && row.value.trim() !== '')
        .map((row) => ({ date: row.date!, value: Number(row.value) }))
        .filter((row) => Number.isFinite(row.value))
        .reverse();
      if (!observations.length) throw new Error('No numeric observations');
      return { indicator, seriesId: series.id, label: series.label, units: series.units,
        frequency: series.frequency, source: 'Federal Reserve Bank of St. Louis (FRED)',
        sourceUrl: 'https://fred.stlouisfed.org/series/' + series.id,
        retrievedAt: new Date().toISOString(), observations };
    } catch (error) {
      console.error('FRED request failed', { seriesId: series.id, message: error instanceof Error ? error.message : 'Unknown error' });
      throw new HttpsError('unavailable', 'Economic data is temporarily unavailable.');
    }
  },
);
