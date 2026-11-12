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
  supporting?: string;
  limit: string;
  proof?: readonly { label: string; steps: readonly string[]; cells: readonly { cell: string; label: string; raw: string }[] }[];
  action: string;
}

const taxIncrease = bills.tax.highlights[0].value.replace(/^\+|\.00$/g, '');
const schoolIncrease = bills.tax.highlights[1].value.replace(/^\+|\.00$/g, '');
const [billIncrease, useIncrease] = bills.electricity.highlights;

export const HOME_EXAMPLES: readonly HomeExample[] = [
  {
    id: 'tax',
    title: 'Property taxes',
    question: 'What changed on this property-tax bill?',
    label: 'Made-up example',
    context: 'Two consecutive tax years for the same property.',
    ...bills.tax,
    finding: { value: bills.tax.share, text: `of the ${taxIncrease} increase came from school charges.` },
    takeaway: `School charges accounted for ${bills.tax.share} of the ${taxIncrease} increase and rose by ${schoolIncrease}.`,
    supporting: `School charges rose by ${schoolIncrease}.`,
    limit: 'The bills show which charges changed. Check assessed value and tax rates to understand why.',
    action: 'Explore the property-tax example',
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
      { label: 'Median household income', values: ['$93,658', '$82,068'] },
      { label: 'Population change', values: ['+3.0%', '+5.4%'] },
    ],
    finding: { value: '$11,590', text: 'higher median household income in Austin’s estimate. Charlotte’s population estimate grew more.' },
    takeaway: 'Austin’s median household income estimate is $11,590 higher. Charlotte’s population estimate grew more.',
    limit: 'Check local demand, competition, and rent before choosing a site.',
    action: 'View the Full Sample Report',
  },
];
