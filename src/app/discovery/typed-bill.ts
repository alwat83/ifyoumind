import { compareCharges, moneyCents, usd } from './discovery-core';
import type { DiscoveryFinding, EvidenceCell } from './discovery-core';
import { consumptionUnits, dateValue, kwh, unitCost } from './electricity-discovery';

export type BillCategory = 'tax' | 'electricity';
export type BillField = 'year' | 'total' | 'start' | 'end' | 'usage';
export type BillDraft = Partial<Record<BillField, string>>;
export type BillSide = 'current' | 'earlier';

interface BillIssue {
  side: BillSide;
  field?: BillField;
  message: string;
}

interface BillPeriod {
  label: string;
  total: number;
  start: number;
  end: number;
  usage: number;
  evidence: EvidenceCell[];
}

const day = 86_400_000;

// Accept the US display format people see on statements without guessing decimal conventions.
function stripThousands(value: string): string {
  return /^(?:[1-9]\d{0,2})(?:,\d{3})+(?:\.\d+)?$/.test(value)
    ? value.replaceAll(',', '')
    : value;
}

function billMoney(value: string): number | null {
  return moneyCents(stripThousands(value.trim().replace(/^\$/, '')));
}

function billUsage(value: string): number | null {
  return consumptionUnits(stripThousands(value.trim()));
}

function readBill(category: BillCategory, draft: BillDraft, side: BillSide, issues: BillIssue[]): BillPeriod | null {
  const raw = (field: BillField) => draft[field]?.trim() ?? '';
  const issue = (field: BillField, message: string) => issues.push({ side, field, message });
  const source = side === 'current' ? 'Current bill' : 'Earlier bill';
  const cells: EvidenceCell[] = [];
  const add = (field: BillField, label: string, used: string) => cells.push({ cell: source, field, label, raw: raw(field), used });
  const total = billMoney(raw('total'));
  if (total === null) issue('total', 'Enter a USD amount of zero or more, with up to two decimal places.');
  else add('total', category === 'tax' ? 'Annual property tax' : 'Electric charges for the period', usd(total));

  if (category === 'tax') {
    const year = raw('year');
    if (!/^(?:19|20|21)\d{2}$/.test(year)) issue('year', 'Enter a four-digit tax year from 1900 to 2199.');
    if (total === null || issues.some(item => item.side === side)) return null;
    add('year', 'Tax year', year);
    return { label: year, total, start: Number(year), end: Number(year), usage: 0, evidence: cells };
  }

  const start = dateValue(raw('start'));
  const end = dateValue(raw('end'));
  const usage = billUsage(raw('usage'));
  if (start === null) issue('start', 'Enter a valid start meter-read date.');
  else add('start', 'Start meter-read date', raw('start'));
  if (end === null) issue('end', 'Enter a valid end meter-read date.');
  else {
    add('end', 'End meter-read date', raw('end'));
    if (start !== null && (end <= start || end - start > 62 * day)) {
      issue('end', 'Use meter-read dates from a billing period of 1 to 62 days.');
    }
  }
  if (usage === null) issue('usage', 'Enter billed kWh of zero or more, with up to three decimal places.');
  else add('usage', 'Electricity used', kwh(usage));
  if (total === null || start === null || end === null || usage === null || issues.some(item => item.side === side)) return null;
  return { label: `${raw('start')} to ${raw('end')}`, total, start, end, usage, evidence: cells };
}

function taxSummary(bill: BillPeriod): DiscoveryFinding {
  // Round to the nearest cent using integer cents before formatting.
  const monthly = usd(Math.floor((bill.total + 6) / 12));
  return {
    id: 'tax-summary',
    title: `${usd(bill.total)} in ${bill.label} property tax.`,
    detail: `That averages ${monthly} per month for budgeting. Check the bill for payment dates and amounts.`,
    steps: [`${usd(bill.total)} ÷ 12 months ≈ ${monthly} per month`],
    cells: bill.evidence,
  };
}

function electricitySummary(bill: BillPeriod): DiscoveryFinding {
  const average = unitCost(bill.total, bill.usage);
  const days = (bill.end - bill.start) / day;
  return {
    id: 'electricity-summary',
    title: `${usd(bill.total)} in electric charges.`,
    detail: `You used ${kwh(bill.usage)} over ${days} ${days === 1 ? 'day' : 'days'}.${average === null
      ? ' A per-kWh average needs usage above zero.'
      : ` The bill averaged ${average} per kWh, including fees and taxes in those charges. Your utility may list separate rates.`}`,
    steps: [
      `End date − start date = ${days} ${days === 1 ? 'day' : 'days'}`,
      average === null ? 'A per-kWh average is unavailable at zero usage.' : `${usd(bill.total)} ÷ ${kwh(bill.usage)} ≈ ${average} per kWh`,
    ],
    cells: bill.evidence,
  };
}

export function analyzeTypedBill(category: BillCategory, current: BillDraft, earlier?: BillDraft, sameBill = false):
  { issues: BillIssue[]; finding: DiscoveryFinding | null } {
  const issues: BillIssue[] = [];
  const currentBill = readBill(category, current, 'current', issues);
  const earlierBill = earlier ? readBill(category, earlier, 'earlier', issues) : null;
  if (!currentBill || (earlier && !earlierBill)) return { issues, finding: null };
  if (!earlierBill) return { issues, finding: category === 'tax' ? taxSummary(currentBill) : electricitySummary(currentBill) };
  if (!sameBill) issues.push({ side: 'earlier', message: category === 'tax'
    ? 'Confirm both bills are for the same property.'
    : 'Confirm both bills cover the same electric service.' });
  if (category === 'tax' && earlierBill.start !== currentBill.start - 1) {
    issues.push({ side: 'earlier', field: 'year', message: 'Use the tax year immediately before the current bill.' });
  }
  if (category === 'electricity' && earlierBill.end > currentBill.start) {
    issues.push({ side: 'earlier', field: 'end', message: 'Choose an earlier billing period that ends on or before the current start date.' });
  }
  if (issues.length) return { issues, finding: null };
  const limit = category === 'tax'
    ? 'This compares the annual totals you entered. The totals alone cannot explain the change.'
    : 'This compares current-period charges. Billing days, season and rate plans can differ. These totals do not identify a cause.';
  const evidence = [...earlierBill.evidence, ...currentBill.evidence];
  const { findings, delta, percent } = compareCharges(earlierBill.total, currentBill.total, [earlierBill.label, currentBill.label], [], evidence, evidence, false, limit);
  const finding = findings[0];
  // The shared paired calculation omits its caveat when the baseline is zero.
  if (earlierBill.total === 0) finding.detail += ` ${limit}`;
  if (category === 'electricity') {
    const usageChange = currentBill.usage - earlierBill.usage;
    const currentDays = (currentBill.end - currentBill.start) / day;
    const earlierDays = (earlierBill.end - earlierBill.start) / day;
    const average = (bill: BillPeriod, days: number) =>
      new Intl.NumberFormat('en-US', { maximumSignificantDigits: 3 }).format(bill.usage / 1000 / days);
    const currentAverage = average(currentBill, currentDays);
    const earlierAverage = average(earlierBill, earlierDays);
    const change = delta > 0 ? 'higher' : 'lower';
    const changeDetail = percent === null ? 'The earlier charge was $0, so there’s no percentage comparison.'
      : delta === 0 ? '' : `Charges were ${percent.replace('−', '')} ${change}.`;
    finding.detail = `${changeDetail} You used ${kwh(currentBill.usage)} over ${currentDays} days, compared with ${kwh(earlierBill.usage)} over ${earlierDays} days.`.trim();
    finding.steps.push(`${kwh(currentBill.usage)} − ${kwh(earlierBill.usage)} = ${usageChange > 0 ? '+' : usageChange < 0 ? '−' : ''}${kwh(Math.abs(usageChange))}`);
    if (currentDays !== earlierDays) {
      finding.detail += ` Daily use averaged ${currentAverage} versus ${earlierAverage} kWh/day.`;
      finding.steps.push(`${kwh(currentBill.usage)} ÷ ${currentDays} days ≈ ${currentAverage} kWh/day`,
        `${kwh(earlierBill.usage)} ÷ ${earlierDays} days ≈ ${earlierAverage} kWh/day`);
    }
    finding.detail += ' Billing days, season and rate plans can differ. These totals do not identify a cause.';
  }
  return { issues, finding };
}
