import bills from './home-bill-examples.json';

export type HomeExampleId = 'cities' | 'electricity' | 'tax';
export type StatementVerdict = 'supported' | 'not-supported' | 'cannot-tell';

/** A preset statement about one example. The verdict is computed from the example's own values; it never checks visitor-written claims. */
export interface HomeStatement {
  text: string;
  verdict: StatementVerdict;
  finding: string;
  steps: readonly string[];
  cells: readonly { cell: string; label: string; raw: string }[];
  limit?: string;
}

interface HomeExample {
  id: HomeExampleId;
  title: string;
  question: string;
  label: string;
  context: string;
  columns: readonly string[];
  rows: readonly { label: string; values: readonly string[] }[];
  takeaway: string;
  guidance: string;
  finding: { value: string; text: string };
  limit: string;
  evidenceLead?: string;
  proof?: readonly { label: string; steps: readonly string[]; cells: readonly { cell: string; label: string; raw: string }[] }[];
  action: string;
  figure: string;
  figureText: string;
  statements: readonly HomeStatement[];
}

const money = (value: number) => '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
const cellsOf = (proof: typeof bills.tax.proof, ...ids: string[]) => proof.flatMap(group => group.cells).filter(cell => ids.includes(cell.cell));
const raw = (proof: typeof bills.tax.proof, id: string) => Number(cellsOf(proof, id)[0].raw);
const step = (lines: readonly string[], prefix: string) => lines.find(line => line.startsWith(prefix))!;
const verdictWhen = (supported: boolean): StatementVerdict => supported ? 'supported' : 'not-supported';

// Property tax: per-charge changes come from the example CSV's source cells (row 2 = 2024, row 3 = 2025).
const taxCharges = (['B', 'C', 'D'] as const).map(column => ({ column, change: raw(bills.tax.proof, column + '3') - raw(bills.tax.proof, column + '2') }));
const [countyChange, schoolChange] = taxCharges.map(charge => charge.change);
const taxTotalChange = taxCharges.reduce((sum, charge) => sum + charge.change, 0);
const largestTaxChange = Math.max(...taxCharges.map(charge => charge.change));

// Electricity: percentages come from the example's own proof cells.
const percentChange = (from: string, to: string) => (raw(bills.electricity.proof, to) - raw(bills.electricity.proof, from)) / raw(bills.electricity.proof, from) * 100;
const billChange = percentChange('J2', 'J3');
const useChange = percentChange('E2', 'E3');

// Cities: the public sample report's estimates shown in the example table.
const [austinGrowth, charlotteGrowth] = [3.0, 5.4];
const cityCaveat = 'City-level estimates. Differences have not been tested for statistical significance.';

const taxIncrease = bills.tax.highlights[0].value.replace(/^\+|\.00$/g, '');
const schoolIncrease = bills.tax.highlights[1].value.replace(/^\+|\.00$/g, '');
const [taxTotalProof, taxChargeProof] = bills.tax.proof;
const [billIncrease, useIncrease] = bills.electricity.highlights;
const [austinIncome, charlotteIncome] = [93_658, 82_068];
const incomeValues = [austinIncome, charlotteIncome].map(income => '$' + income.toLocaleString('en-US'));

export const HOME_EXAMPLES: readonly HomeExample[] = [
  {
    id: 'tax',
    title: 'Property taxes',
    question: 'Why did my property taxes go up?',
    label: 'Made-up example',
    context: 'Two consecutive tax years for the same property.',
    ...bills.tax,
    finding: { value: taxIncrease, text: 'more than the year before.' },
    evidenceLead: taxChargeProof.steps.at(-1),
    proof: [taxTotalProof, { ...taxChargeProof, steps: taxChargeProof.steps.slice(0, -1) }],
    takeaway: `School taxes rose by ${schoolIncrease} and accounted for most of the increase.`,
    guidance: `School taxes rose by ${schoolIncrease}. Two bills alone can’t tell you whether you paid too much.`,
    limit: 'Check your county’s assessment notice and exemptions. To check how the total was calculated, look up your assessed value and local tax rates.',
    action: 'Open the full tax example',
    figure: bills.tax.highlights[0].value.replace(/\.00$/, ''),
    figureText: `${bills.tax.rows[0].values[0].replace(/\.00$/, '')} → ${bills.tax.rows[0].values[1].replace(/\.00$/, '')}, ${bills.tax.columns.join('–')}`,
    statements: [
      {
        text: 'It’s mostly school charges.',
        verdict: verdictWhen(schoolChange / taxTotalChange > 0.5),
        finding: `School charges added ${money(schoolChange)} of the ${money(taxTotalChange)} increase.`,
        steps: [step(taxChargeProof.steps, 'School:'), taxChargeProof.steps.at(-1)!],
        cells: cellsOf(bills.tax.proof, 'C2', 'C3'),
      },
      {
        text: 'County charges rose the most.',
        verdict: verdictWhen(countyChange === largestTaxChange),
        finding: `County charges rose ${money(countyChange)}. School charges rose ${money(schoolChange)}.`,
        steps: [step(taxChargeProof.steps, 'County:'), step(taxChargeProof.steps, 'School:')],
        cells: cellsOf(bills.tax.proof, 'B2', 'B3', 'C2', 'C3'),
      },
      {
        text: 'The bill was calculated wrong.',
        verdict: 'cannot-tell',
        finding: 'Two bills show what changed, not whether the total is correct.',
        steps: [taxTotalProof.steps[0]],
        cells: [],
        limit: 'To check the total, look up your assessed value and local tax rates.',
      },
    ],
  },
  {
    id: 'electricity',
    title: 'Electricity bills',
    question: 'Did my bill rise faster than my energy use?',
    label: 'Made-up example',
    context: 'Two July bills with 31 billing days each.',
    ...bills.electricity,
    finding: { value: billIncrease.value, text: `in total billed, compared with ${useIncrease.value} in electricity use.` },
    takeaway: `The bill rose ${billIncrease.value.slice(1)} and electricity use rose ${useIncrease.value.slice(1)}.`,
    guidance: 'Check the individual charges to see what else changed.',
    limit: 'Check itemized charges to investigate why the bill rose faster than energy use.',
    action: 'Explore the electricity example',
    figure: billIncrease.value,
    figureText: `${bills.electricity.rows[0].values[0]} → ${bills.electricity.rows[0].values[1]}, ${bills.electricity.columns.join('–')}`,
    statements: [
      {
        text: 'I used more electricity.',
        verdict: verdictWhen(useChange > 0),
        finding: `Energy use rose ${useIncrease.value}.`,
        steps: bills.electricity.proof[1].steps,
        cells: cellsOf(bills.electricity.proof, 'E2', 'E3'),
      },
      {
        text: 'Using more explains all of it.',
        verdict: verdictWhen(billChange <= useChange),
        finding: `The bill rose ${billIncrease.value}; energy use rose ${useIncrease.value}.`,
        steps: [...bills.electricity.proof[0].steps, bills.electricity.proof[1].steps[1]],
        cells: cellsOf(bills.electricity.proof, 'J2', 'J3', 'E2', 'E3'),
      },
      {
        text: 'My electricity rate went up.',
        verdict: 'cannot-tell',
        finding: 'Two bill totals don’t show rates or itemized charges.',
        steps: [bills.electricity.proof[0].steps[1]],
        cells: [],
        limit: 'Check itemized charges to investigate why the bill rose faster than energy use.',
      },
    ],
  },
  {
    id: 'cities',
    title: 'Compare cities',
    question: 'How do Austin and Charlotte compare?',
    label: 'Public Census sample',
    context: 'The full report compares Austin, Charlotte, and Nashville.',
    columns: ['Austin, TX', 'Charlotte, NC'],
    rows: [
      { label: 'Population', values: ['979,539', '903,844'] },
      { label: 'Median household income', values: incomeValues },
      { label: 'Population change', values: [austinGrowth, charlotteGrowth].map(value => `+${value.toFixed(1)}%`) },
    ],
    finding: { value: '$11,590', text: 'higher median household income in Austin’s estimate. Charlotte’s population estimate grew more.' },
    takeaway: 'Austin’s median household income estimate is $11,590 higher. Charlotte’s population estimate grew more.',
    guidance: 'These estimates give you a starting point for checking local demand, competition, and rent.',
    limit: 'Check local demand, competition, and rent before choosing a site.',
    action: 'View the Full Sample Report',
    figure: '2 cities',
    figureText: 'Austin, TX and Charlotte, NC',
    statements: [
      {
        text: 'Austin’s income estimate is higher.',
        verdict: verdictWhen(austinIncome > charlotteIncome),
        finding: `Austin’s estimate is ${money(austinIncome - charlotteIncome)} higher.`,
        steps: [`Median household income: ${incomeValues[0]} − ${incomeValues[1]} = ${money(austinIncome - charlotteIncome)}.`],
        cells: [],
        limit: cityCaveat,
      },
      {
        text: 'Austin’s population estimate grew more.',
        verdict: verdictWhen(austinGrowth > charlotteGrowth),
        finding: `Charlotte’s grew more: +${charlotteGrowth.toFixed(1)}% vs +${austinGrowth.toFixed(1)}%.`,
        steps: [`Population change: ${charlotteGrowth.toFixed(1)}% − ${austinGrowth.toFixed(1)}% = ${(charlotteGrowth - austinGrowth).toFixed(1)} percentage points.`],
        cells: [],
        limit: cityCaveat,
      },
      {
        text: 'Austin is better for a coffee shop.',
        verdict: 'cannot-tell',
        finding: 'Income and growth point in different directions, and neither measures demand.',
        steps: [],
        cells: [],
        limit: 'Check local demand, competition, and rent before choosing a site.',
      },
    ],
  },
];
