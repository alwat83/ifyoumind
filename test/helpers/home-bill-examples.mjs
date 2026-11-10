// Project the public bill fixtures into display data. Keep this in test tooling
// so the homepage never imports the CSV parser or private-input code.
import { loadDiscovery } from './load-discovery.mjs';

export async function projectHomeBillExamples() {
  const electricity = await loadDiscovery('electricity-discovery');
  const tax = await loadDiscovery('tax-discovery');
  const electricInput = electricity.parseElectricityCsv(electricity.ELECTRICITY_CSV);
  const taxInput = tax.parseTaxCsv(tax.EXAMPLE_CSV);
  const electric = electricity.analyzeElectricity(electricInput.rows, electricInput.columns);
  const property = tax.analyzeTax(taxInput.rows, taxInput.columns);
  const finding = (analysis, id) => {
    const result = analysis.findings.find(item => item.id === id);
    if (analysis.status !== 'ready' || !result) throw new Error(`Public example missing ${id}`);
    return result;
  };
  const values = (item, field) => item.cells.filter(cell => cell.field === field).map(cell => cell.used);
  const proof = (label, item, fields) => ({
    label,
    steps: item.steps.map(step => step.split(' (rounded for display;')[0]),
    cells: item.cells
      .filter(cell => fields.includes(cell.field))
      .map(({ cell, label, raw }) => ({ cell, label, raw })),
  });

  const electricTotal = finding(electric, 'total');
  const usage = finding(electric, 'consumption');
  const usageBefore = electricity.consumptionUnits(electricInput.rows[0].consumption_kwh);
  const usageAfter = electricity.consumptionUnits(electricInput.rows[1].consumption_kwh);
  const usageChange = tax.percentChange(usageAfter - usageBefore, usageBefore);
  const electricPercent = Number.parseFloat(electric.percent);
  const usagePercent = Number.parseFloat(usageChange);
  const taxTotal = finding(property, 'total');
  const components = finding(property, 'components');
  const school = property.changes.find(change => change.label === 'School');
  if (!school) throw new Error('Public property tax example missing School charges');

  return {
    electricity: {
      columns: electric.years.map(value => new Intl.DateTimeFormat('en-US', {
        month: 'short', year: 'numeric', timeZone: 'UTC',
      }).format(new Date(value + 'T00:00:00Z'))),
      rows: [
        { label: 'Total billed', values: values(electricTotal, 'total_usd'), highlight: 1 },
        { label: 'Energy used', values: values(usage, 'consumption_kwh'), highlight: 1 },
      ],
      highlights: [
        { label: 'Bill increase', value: `+${electric.percent}`, width: 100 },
        { label: 'Energy use increase', value: `+${usageChange}`, width: 100 * usagePercent / electricPercent },
      ],
      proof: [
        proof('Total billed', electricTotal, ['total_usd']),
        proof('Energy used', usage, ['consumption_kwh']),
      ],
    },
    tax: {
      share: tax.percentChange(school.delta, property.delta),
      columns: property.years.map(String),
      rows: [
        { label: 'Total tax', values: values(taxTotal, 'total_usd'), highlight: 1 },
        { label: 'School charges', values: values(components, 'school_usd'), highlight: 1 },
      ],
      highlights: [
        { label: 'Total increase', value: tax.signedUsd(property.delta), width: 100 },
        { label: 'School charges', value: tax.signedUsd(school.delta), width: 100 * school.delta / property.delta },
      ],
      proof: [
        proof('Total tax', taxTotal, ['total_usd']),
        proof('How the charges add up', components, ['county_usd', 'school_usd', 'municipal_usd']),
      ],
    },
  };
}
