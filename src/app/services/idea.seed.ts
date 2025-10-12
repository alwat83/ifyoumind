// Seed data for initial idea population (admin-triggered)
// Each object matches Partial<Idea> shape.
export const IDEA_SEED_DATA = [
  {
    title: 'Global Impact Dashboard',
    problem:
      'People can’t easily see cross-domain progress on climate, health, and education.',
    solution:
      'Unified open API + rolling visualization fed by trusted datasets.',
    impact: 'Improves transparency; helps align funders and volunteers.',
    category: 'general',
    tags: ['open-data', 'coordination'],
    isPublic: true,
  },
  {
    title: 'Low-Bandwidth AI Assistant',
    problem: 'Rural regions lack stable bandwidth for modern AI tools.',
    solution:
      'Quantized edge models (WebAssembly) auto-updating in tiny delta bundles.',
    impact: 'Expands access to knowledge & learning where infra is weak.',
    category: 'technology',
    tags: ['edge-ai', 'access'],
    isPublic: true,
  },
  {
    title: 'Micro Rewilding Kits',
    problem: 'Urban yards provide minimal biodiversity value.',
    solution:
      'Region-specific native seed + soil biome starter kits with app guidance.',
    impact: 'Restores pollinator corridors micro-parcel by micro-parcel.',
    category: 'environment',
    tags: ['biodiversity', 'urban'],
    isPublic: true,
  },
  {
    title: 'Offline Prenatal Guidance App',
    problem: 'Expectant mothers in low-connectivity regions lack timely info.',
    solution:
      'Offline-first localized app with staged pregnancy modules & SMS fallback.',
    impact: 'Improves maternal outcomes and reduces preventable complications.',
    category: 'health',
    tags: ['maternal-health', 'offline'],
    isPublic: true,
  },
  {
    title: 'Peer Micro-Tutoring Rotations',
    problem: 'Students wait too long for clarification on confusing concepts.',
    solution:
      '10-minute rotating peer tutoring cycles guided by AI scaffold cards.',
    impact: 'Delivers faster remediation and better retention.',
    category: 'education',
    tags: ['peer-learning'],
    isPublic: true,
  },
  {
    title: 'Civic Micro-Pledges',
    problem: 'Large time commitments deter local volunteering.',
    solution:
      'Platform listing 15-minute actionable civic tasks with measurable impact.',
    impact: 'Increases recurring civic participation and community engagement.',
    category: 'social',
    tags: ['civic-tech', 'micro-volunteering'],
    isPublic: true,
  },
  {
    title: 'Transparent Supplier Footprint Labels',
    problem: 'SMEs cannot easily assess upstream emissions.',
    solution:
      'API generating standardized scope 1–3 carbon intensity labels per SKU.',
    impact: 'Drives cleaner supplier selection & procurement transparency.',
    category: 'business',
    tags: ['sustainability', 'supply-chain'],
    isPublic: true,
  },
  {
    title: 'Ethical Risk Pre-Flight Checklist',
    problem: 'Small teams frequently ignore unintended consequence analysis.',
    solution:
      'Wizard that outputs risk summary + mitigation plan + public transparency badge.',
    impact: 'Reduces harmful side effects and builds user trust.',
    category: 'general',
    tags: ['ethics', 'governance'],
    isPublic: true,
  },
];
