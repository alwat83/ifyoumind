import bills from './home-bill-examples.json';

export type HomeExampleId = 'cities' | 'electricity' | 'tax';

interface HomeExample {
  id: HomeExampleId;
  title: string;
  description: string;
  icon: string;
  question: string;
  label: string;
  context: string;
  columns: readonly string[];
  rows: readonly { label: string; values: readonly string[]; highlight?: number }[];
  takeaway: string;
  highlights: readonly { label: string; value: string; width?: number }[];
  limit: string;
  proof?: readonly { label: string; steps: readonly string[]; cells: readonly { cell: string; label: string; raw: string }[] }[];
  action: string;
}

export const HOME_EXAMPLES: readonly HomeExample[] = [
  {
    id: 'cities',
    title: 'Compare two cities',
    description: 'Austin and Charlotte',
    icon: 'people',
    question: 'Where would a coffee shop do better?',
    label: 'Public Census sample',
    context: 'Figures from the public sample report, which also compares Nashville.',
    columns: ['Austin, TX', 'Charlotte, NC'],
    rows: [
      { label: 'Population', values: ['979,539', '903,844'] },
      { label: 'Median household income', values: ['$93,658', '$82,068'], highlight: 0 },
      { label: 'Population change', values: ['+3.0%', '+5.4%'], highlight: 1 },
    ],
    takeaway: 'Austin has the higher income estimate. Charlotte’s population estimate grew more.',
    highlights: [
      { label: 'Austin median income gap', value: '+$11,590' },
      { label: 'Charlotte population change gap', value: '+2.4 percentage points' },
    ],
    limit: 'Check local demand, competition, and rent before choosing a site.',
    action: 'View the Full Sample Report',
  },
  {
    id: 'electricity',
    title: 'Electricity bills',
    description: 'Electricity use and cost',
    icon: 'bolt',
    question: 'What changed in two electricity bills?',
    label: 'Made-up bills',
    context: 'Two July bills with 31 billing days each.',
    ...bills.electricity,
    takeaway: 'The bill rose faster than energy use.',
    limit: 'The difference gives you a reason to check the itemized charges. These totals cannot establish the cause.',
    action: 'Explore the electricity example',
  },
  {
    id: 'tax',
    title: 'Property tax',
    description: 'Property-tax charges',
    icon: 'home',
    question: 'Which property-tax charge changed most?',
    label: 'Made-up statements',
    context: 'Two consecutive tax years for the same example property.',
    ...bills.tax,
    takeaway: `School charges accounted for ${bills.tax.share} of the increase.`,
    limit: 'This breakdown shows where the increase appeared. Check the assessed value and rates to investigate why.',
    action: 'Explore the property-tax example',
  },
];
