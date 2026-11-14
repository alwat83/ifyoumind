import bills from './home-bill-examples.json';

export type HomeExampleId = 'cities' | 'electricity' | 'tax';

interface HomeExample {
  id: HomeExampleId;
  title: string;
  question: string;
  label: string;
  context: string;
  columns: readonly string[];
  rows: readonly { label: string; values: readonly string[] }[];
  takeaway: string;
  finding: { value: string; text: string };
  chart: { title: string; measures: readonly { label: string; value: string; width: number }[] };
  limit: string;
  evidenceLead?: string;
  proof?: readonly { label: string; steps: readonly string[]; cells: readonly { cell: string; label: string; raw: string }[] }[];
  action: string;
}

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
    question: 'What changed on this tax bill?',
    label: 'Made-up example',
    context: 'Two consecutive tax years for the same property.',
    ...bills.tax,
    finding: { value: taxIncrease, text: 'more than the year before.' },
    chart: {
      title: 'What went up',
      measures: [
        { ...bills.tax.highlights[0], label: 'Total tax increase' },
        { ...bills.tax.highlights[1], label: 'School charge increase' },
      ],
    },
    evidenceLead: taxChargeProof.steps.at(-1),
    proof: [taxTotalProof, { ...taxChargeProof, steps: taxChargeProof.steps.slice(0, -1) }],
    takeaway: `School taxes rose by ${schoolIncrease} and accounted for most of the increase.`,
    limit: 'Two bills show what changed. To check whether the total is right, look up your assessed value and local tax rates.',
    action: 'Open the full tax example',
  },
  {
    id: 'electricity',
    title: 'Electricity bills',
    question: 'Did my bill rise faster than my energy use?',
    label: 'Made-up example',
    context: 'Two July bills with 31 billing days each.',
    ...bills.electricity,
    finding: { value: billIncrease.value, text: `in total billed, compared with ${useIncrease.value} in electricity use.` },
    chart: { title: 'Change over the same billing period', measures: bills.electricity.highlights },
    takeaway: `The bill rose ${billIncrease.value.slice(1)} and electricity use rose ${useIncrease.value.slice(1)}.`,
    limit: 'Check itemized charges to investigate why the bill rose faster than energy use.',
    action: 'Explore the electricity example',
  },
  {
    id: 'cities',
    title: 'Compare cities',
    question: 'Where would a coffee shop do better?',
    label: 'Public Census sample',
    context: 'The full report compares Austin, Charlotte, and Nashville.',
    columns: ['Austin, TX', 'Charlotte, NC'],
    rows: [
      { label: 'Population', values: ['979,539', '903,844'] },
      { label: 'Median household income', values: incomeValues },
      { label: 'Population change', values: ['+3.0%', '+5.4%'] },
    ],
    finding: { value: '$11,590', text: 'higher median household income in Austin’s estimate. Charlotte’s population estimate grew more.' },
    chart: {
      title: 'Estimated median household income',
      measures: [
        { label: 'Austin, TX', value: incomeValues[0], width: 100 },
        { label: 'Charlotte, NC', value: incomeValues[1], width: charlotteIncome / austinIncome * 100 },
      ],
    },
    takeaway: 'Austin’s median household income estimate is $11,590 higher. Charlotte’s population estimate grew more.',
    limit: 'Check local demand, competition, and rent before choosing a site.',
    action: 'View the Full Sample Report',
  },
];
