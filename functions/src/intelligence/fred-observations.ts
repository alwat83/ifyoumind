export type FredObservation = { date: string; value: number };

export function parseFredObservations(payload: unknown): FredObservation[] {
  const rows = (payload as { observations?: unknown })?.observations;
  if (!Array.isArray(rows)) throw new Error('Unexpected FRED response');
  const observations = rows
    .filter((row): row is { date: string; value: string } =>
      typeof row?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
      && typeof row?.value === 'string' && row.value.trim() !== '')
    .map((row) => ({ date: row.date, value: Number(row.value) }))
    .filter((row) => Number.isFinite(row.value))
    .reverse();
  if (!observations.length) throw new Error('No numeric observations');
  return observations;
}
