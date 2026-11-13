import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDiscovery } from './helpers/load-discovery.mjs';
import { lakeCountyCandidate, pgeCandidate } from './helpers/pdf-bill-candidates.mjs';

const { analyzeTypedBill } = await loadDiscovery('typed-bill');
const tax = { year: '2026', total: '$4,620.00' };
const electric = { start: '2026-07-01', end: '2026-08-01', usage: '660', total: '145.20' };

test('one annual property tax amount has a reproducible monthly budgeting average', () => {
  const { finding, issues } = analyzeTypedBill('tax', tax);
  assert.deepEqual(issues, []);
  assert.equal(finding.title, '$4,620.00 in 2026 property tax.');
  assert.match(finding.detail, /\$385.00 per month for budgeting/);
  assert.match(finding.detail, /Check the bill for payment dates/);
  assert.deepEqual(finding.steps, ['$4,620.00 ÷ 12 months ≈ $385.00 per month']);
  assert.equal(finding.cells[0].raw, '$4,620.00');
});

test('tax comparison requires confirmation and consecutive tax years', () => {
  assert.match(analyzeTypedBill('tax', tax, { year: '2025', total: '4200' }).issues[0].message, /same property/);
  for (const year of ['2024', '2026', '2027']) {
    assert.equal(analyzeTypedBill('tax', tax, { year, total: '4200' }, true).finding, null);
  }
  const { finding } = analyzeTypedBill('tax', tax, { year: '2025', total: '4200' }, true);
  assert.equal(finding.title, 'Your total rose by $420.00.');
  assert.match(finding.steps[1], /10%/);
  assert.match(finding.detail, /cannot explain/);
});

test('invalid money is rejected and an explicit zero has no change percentage', () => {
  for (const total of ['', '-1', '1e2', '4,20.00', '12.001', '42 USD', '1000000000']) {
    assert.equal(analyzeTypedBill('tax', { ...tax, total }).finding, null, total);
  }
  assert.equal(analyzeTypedBill('tax', { ...tax, total: '0' }).finding.title, '$0.00 in 2026 property tax.');
  assert.match(analyzeTypedBill('tax', tax, { year: '2025', total: '0' }, true).finding.detail, /percentage change is not available.*cannot explain/);
});

test('one electricity bill gives usage, days and whole-bill average', () => {
  const { finding } = analyzeTypedBill('electricity', electric);
  assert.match(finding.detail, /660 kWh over 31 days/);
  assert.match(finding.detail, /\$0.2200 per kWh/);
  assert.match(finding.steps[1], /145.20.*660 kWh/);
  assert.match(analyzeTypedBill('electricity', { ...electric, usage: '0' }).finding.detail, /usage above zero/);
});

test('electricity comparison shows raw and daily usage when periods differ', () => {
  const earlier = { start: '2026-06-01', end: '2026-07-01', usage: '600', total: '120' };
  const { finding } = analyzeTypedBill('electricity', electric, earlier, true);
  assert.equal(finding.title, 'Your total rose by $25.20.');
  assert.match(finding.detail, /21.3 versus 20 kWh\/day/);
  assert.ok(finding.steps.includes('660 kWh − 600 kWh = +60 kWh'));
  assert.match(finding.detail, /do not identify a cause/);
  assert.equal(analyzeTypedBill('electricity', electric, { ...earlier, end: '2026-07-02' }, true).finding, null);
});

test('electricity rejects impossible dates, reversed or long periods and incorrect units', () => {
  for (const invalid of [{ start: '2026-02-29' }, { end: '2026-07-01' }, { end: '2026-10-01' },
    { usage: '10 MWh' }, { usage: '1000 kWh' }, { usage: '0.0001' }]) {
    assert.equal(analyzeTypedBill('electricity', { ...electric, ...invalid }).finding, null);
  }
  assert.match(analyzeTypedBill('electricity', { ...electric, start: '2024-02-29', end: '2024-03-01' }).finding.detail, /over 1 day/);
});

const rows = (page, fields) => Object.entries(fields).map(([label, value]) => ({ page, label, value }));

test('unqualified Lake County candidate maps only its synthetic current-year fields', () => {
  const fixture = rows(1, { 'LAKE COUNTY TREASURER': 'Illinois', 'Tax Year': '2026',
    'Total Current Year Tax': '$4,620.00', 'First installment': '$2,310.00', 'Amount due': '$4,700.00' });
  const candidate = lakeCountyCandidate(fixture);
  assert.deepEqual(candidate.draft, tax);
  assert.deepEqual(candidate.evidence.total, { page: 1, label: 'Total Current Year Tax' });
  assert.equal(analyzeTypedBill('tax', candidate.draft).finding.title, '$4,620.00 in 2026 property tax.');
  assert.equal(lakeCountyCandidate(fixture.filter(row => row.label !== 'Total Current Year Tax')), null);
  assert.equal(lakeCountyCandidate([...fixture, ...rows(1, { 'Total Current Year Tax': '50' })]), null);
  assert.equal(lakeCountyCandidate([...fixture, ...rows(1, { 'Corrected bill': 'Yes' })]), null);
});

test('unqualified PG&E candidate avoids amount due, gas and net metering and requires dates to be confirmed', () => {
  const fixture = rows(3, { 'Details of Electric Charges': 'PG&E', 'Billing period': '07/01/2026 to 08/01/2026',
    'Total Usage': '660 kWh', 'Total Electric Charges': '145.20', 'Amount due': '300', 'Total Gas Charges': '90' });
  const candidate = pgeCandidate(fixture);
  assert.deepEqual(candidate.draft, electric);
  assert.deepEqual(candidate.needsConfirmation, ['start', 'end']);
  assert.deepEqual(candidate.evidence.usage, { page: 3, label: 'Total Usage' });
  assert.equal(pgeCandidate([...fixture, ...rows(3, { 'Details of NEM Charges': 'yes' })]), null);
  assert.equal(pgeCandidate(fixture.map(row => ({ ...row, page: 4 }))), null);
  assert.equal(pgeCandidate(fixture.map(row => row.label === 'Total Usage' ? { ...row, value: '660 kW' } : row)), null);
});
