import { analyzeTypedBill, type BillCategory, type BillDraft } from '../../src/app/discovery/typed-bill';
import type { DiscoveryFinding } from '../../src/app/discovery/discovery-core';

type Point = { text: string; evidence: string };
type Demo = {
  category: BillCategory;
  current: BillDraft;
  earlier?: BillDraft;
  explain?: (finding: DiscoveryFinding) => Editorial;
};
type Editorial = {
  takeaways: Record<string, string>;
  observations: Record<string, Point>;
  nextSteps: Record<string, string>;
  limit: string;
};
const point = (text: string, evidence: string): Point => ({ text, evidence });
function figure(finding: DiscoveryFinding, field: string, cell = 'Current bill'): string {
  const value = finding.cells.find(item => item.field === field && item.cell === cell)?.used;
  if (value === undefined) throw new Error('A demo evidence reference is missing.');
  return value;
}
const fixtures = {
  'tax-single': {
    category: 'tax', current: { year: '2026', total: '4620.37' },
    explain: finding => ({
      takeaways: { budget: 'Use the annual bill to plan what to set aside each month.' },
      observations: {
        monthly_average: point(finding.steps[0] + ' for budgeting.', 'Monthly budgeting calculation'),
        annual_scope: point(`${figure(finding, 'total')} is the annual tax shown, rather than an installment amount.`, 'Annual property tax'),
      },
      nextSteps: {
        due_dates: 'Check the bill’s due dates and installment amounts before setting a budget reminder.',
        previous_year: 'Find the prior annual bill for the same property if you want to see what changed.',
      },
      limit: 'One bill cannot show a year-over-year change. The monthly average does not set your payment schedule.',
    }),
  },
  'tax-pair': {
    category: 'tax', current: { year: '2026', total: '4620.37' }, earlier: { year: '2025', total: '4200.00' },
    explain: finding => ({
      takeaways: { higher_total: 'Use the higher annual figure for budgeting. Check the itemized bills to understand the increase.' },
      observations: {
        size_of_change: point(`The full-year tax was ${figure(finding, 'total', 'Earlier bill')} before and ${figure(finding, 'total')} after.`, 'Annual property tax'),
        comparable_years: point(`This compares ${figure(finding, 'year', 'Earlier bill')} and ${figure(finding, 'year')} for the same property in this example.`, 'Tax years'),
      },
      nextSteps: {
        compare_lines: 'Compare assessed value, tax rate and any exemptions on both itemized statements to see which lines changed.',
        locate_itemization: 'If either bill only shows a total, look for the itemized statement before trying to explain the difference.',
      },
      limit: 'Two totals cannot establish why the bill rose, whether it is correct, or whether there are grounds for an appeal.',
    }),
  },
  'electricity': {
    category: 'electricity', current: { total: '145.20', usage: '660', start: '2026-07-01', end: '2026-08-01' },
    explain: finding => ({
      takeaways: { separate_usage_and_rate: 'Use this bill to see how much electricity you used and what it cost for that period.' },
      observations: {
        whole_bill_average: point(finding.steps[1] + ', including the fees and taxes in these charges.', 'Whole-bill cost calculation'),
        measured_usage: point(`The meter-read dates cover the period for the ${figure(finding, 'usage')} shown.`, 'Meter-read dates and electricity used'),
      },
      nextSteps: {
        itemize_charges: 'Look for the energy charge and fixed charges on the itemized bill to see what makes up the total.',
        prior_usage: 'For a comparison, find an earlier bill for the same service and use the meter-read dates from each bill.',
      },
      limit: 'An all-in average is not a tariff. One period cannot show what caused charges or usage to change.',
    }),
  },
  'missing-usage': {
    category: 'electricity', current: { total: '145.20', start: '2026-07-01', end: '2026-08-01' },
  },
  'incompatible-years': {
    category: 'tax', current: { year: '2026', total: '4620.37' }, earlier: { year: '2024', total: '4200.00' },
  },
} satisfies Record<string, Demo>;

type FixtureId = keyof typeof fixtures;
export function reviewFixture(id: string) {
  if (!Object.hasOwn(fixtures, id)) throw new Error('Choose a built-in fixture.');
  const fixture: Demo = fixtures[id as FixtureId];
  const result = analyzeTypedBill(fixture.category, fixture.current, fixture.earlier, Boolean(fixture.earlier));
  return { ...result, editorial: result.finding && fixture.explain ? fixture.explain(result.finding) : null };
}
export type Review = ReturnType<typeof reviewFixture>;

export function planSchema(editorial: Editorial) {
  const enumeration = (options: object) => ({ type: 'string', enum: Object.keys(options) });
  return {
    type: 'object', additionalProperties: false,
    required: ['takeaway', 'firstObservation', 'secondObservation', 'nextStep'],
    properties: {
      takeaway: enumeration(editorial.takeaways), firstObservation: enumeration(editorial.observations),
      secondObservation: enumeration(editorial.observations), nextStep: enumeration(editorial.nextSteps),
    },
  };
}
type Schema = ReturnType<typeof planSchema>;
type Transport = (schema: Schema) => Promise<{ status: string; text?: unknown }>;
const mockTransport: Transport = async ({ properties: options }) => ({
  status: 'completed', text: JSON.stringify({
    takeaway: options.takeaway.enum[0], firstObservation: options.firstObservation.enum[1],
    secondObservation: options.secondObservation.enum[0], nextStep: options.nextStep.enum[0],
  }),
});

export async function explainFixture(review: Review, agreed: boolean, transport = mockTransport) {
  const editorial = review.editorial;
  if (!agreed || !editorial) return { kind: 'unavailable' } as const;
  const schema = planSchema(editorial);
  try {
    const response = await transport(schema);
    if (response.status !== 'completed' || typeof response.text !== 'string' || response.text.length > 512) throw Error();
    const plan: unknown = JSON.parse(response.text);
    if (!plan || typeof plan !== 'object' || Array.isArray(plan) || Object.keys(plan).length !== schema.required.length) throw Error();
    // This contract accepts only short, unescaped IDs. Comparing with the parsed
    // form prevents duplicate JSON keys from silently overriding a selection.
    if (JSON.stringify(plan) !== response.text.replace(/\s/g, '')) throw Error();
    const field = (key: keyof Schema['properties']) => {
      if (!Object.hasOwn(plan, key)) throw Error();
      const value = (plan as Record<string, unknown>)[key];
      if (typeof value !== 'string' || !schema.properties[key].enum.includes(value)) throw Error();
      return value;
    };
    const first = field('firstObservation');
    const second = field('secondObservation');
    if (first === second) throw Error();
    return {
      kind: 'mock', takeaway: editorial.takeaways[field('takeaway')],
      observations: [editorial.observations[first], editorial.observations[second]],
      limit: editorial.limit, nextStep: editorial.nextSteps[field('nextStep')],
    } as const;
  } catch {
    return { kind: 'fallback' } as const;
  }
}
