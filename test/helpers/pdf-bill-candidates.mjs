// Test-only contract for a future text-layer reader. Rows are positioned, grouped
// text from one page, with a field label and its adjacent value kept together.
function readFields(rows, page, expected, reject) {
  if (rows.some(row => reject.test(row.label))) return null;
  const values = {};
  const evidence = {};
  for (const [field, label] of Object.entries(expected)) {
    const matches = rows.filter(row => row.page === page && row.label === label);
    if (matches.length !== 1 || typeof matches[0].value !== 'string' || !matches[0].value.trim()) return null;
    values[field] = matches[0].value.trim();
    evidence[field] = { page, label };
  }
  return { values, evidence };
}

export function lakeCountyCandidate(rows) {
  const fields = readFields(rows, 1, {
    issuer: 'LAKE COUNTY TREASURER',
    year: 'Tax Year',
    total: 'Total Current Year Tax',
  }, /corrected|supplemental/i);
  if (!fields || fields.values.issuer !== 'Illinois' || !/^\d{4}$/.test(fields.values.year)) return null;
  const { year, total } = fields.values;
  return { draft: { year, total }, evidence: { year: fields.evidence.year, total: fields.evidence.total } };
}

export function pgeCandidate(rows) {
  const fields = readFields(rows, 3, {
    section: 'Details of Electric Charges',
    period: 'Billing period',
    usage: 'Total Usage',
    total: 'Total Electric Charges',
  }, /net energy metering|details of nem charges|estimated reading/i);
  if (!fields || fields.values.section !== 'PG&E') return null;
  const period = /^(\d{2})\/(\d{2})\/(\d{4}) to (\d{2})\/(\d{2})\/(\d{4})$/.exec(fields.values.period);
  const usage = /^([\d,.]+) kWh$/.exec(fields.values.usage);
  if (!period || !usage) return null;
  const [, startMonth, startDay, startYear, endMonth, endDay, endYear] = period;
  return {
    draft: {
      start: `${startYear}-${startMonth}-${startDay}`, end: `${endYear}-${endMonth}-${endDay}`,
      usage: usage[1], total: fields.values.total,
    },
    evidence: { start: fields.evidence.period, end: fields.evidence.period, usage: fields.evidence.usage, total: fields.evidence.total },
    needsConfirmation: ['start', 'end'],
  };
}
