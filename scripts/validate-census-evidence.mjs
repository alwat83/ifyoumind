// Real-data validation for the paid report's Census evidence (PR #29). Not part of CI.
//
// It needs a Census API key in the environment and runs against the local Firestore emulator,
// so nothing is written to production:
//   CENSUS_API_KEY=<key> npm run validate:census
// It writes docs/census-validation/REPORT.md with every check, and exits non-zero on any failure.
// The key is read from the environment only. It is never printed, stored or written to the report.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const KEY = process.env.CENSUS_API_KEY || '';
if (!KEY) {
  console.error('Set CENSUS_API_KEY in the environment (a Census Data API key). See docs/census-validation/README.md.');
  process.exit(2);
}
delete process.env.FUNCTIONS_EMULATOR;

const admin = require('../functions/node_modules/firebase-admin');
admin.initializeApp({ projectId: 'demo-ifyoumind' });
const { reportEvidenceFor } = require('../functions/lib/intelligence/market-intelligence.js');
const ev = require('../functions/lib/intelligence/evidence.js');

// Cases chosen to exercise each rule. Published values come from the ifYouMind guide, which was
// checked against data.census.gov and Census Reporter in October 2026.
const CASES = [
  { name: 'Sample report cities', location: 'Austin, TX', comparisons: ['Nashville, TN', 'Charlotte, NC'],
    published: { 'Austin, TX': { B01003_001: 979539, B19013_001: [93658, 1670], B25077_001: 555300 }, 'Charlotte, NC': { B01003_001: 903844, B19013_001: 82068, B25077_001: 385700 }, 'Nashville, TN': { B01003_001: 690130, B19013_001: 77371, B25077_001: 413600 } } },
  { name: 'Open-ended medians (top-coded income and home value)', location: 'Atherton, CA', comparisons: ['Palo Alto, CA'] },
  { name: 'Small place: wide margins, low reliability', location: 'Marfa, TX', comparisons: ['Alpine, TX'] },
  { name: 'Consolidated city-county and multi-word names', location: 'Louisville, KY', comparisons: ['Indianapolis, IN'] },
];

const VARS = [...ev.ACS_DETAIL_GROUPS[0], ...ev.ACS_DETAIL_GROUPS[1]];
const results = [];
const check = (caseName, label, ok, detail = '') => results.push({ caseName, label, ok: !!ok, detail });

async function raw(year, state, group) {
  const url = new URL(`https://api.census.gov/data/${year}/acs/acs5`);
  url.searchParams.set('get', ['NAME', ...ev.acsVariables(group)].join(','));
  url.searchParams.set('for', 'place:*');
  url.searchParams.set('in', `state:${state}`);
  url.searchParams.set('key', KEY);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Census HTTP ${res.status} for ${year} state ${state}`);
  return res.json();
}

const sameNumber = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-9;

for (const c of CASES) {
  const evidence = await reportEvidenceFor(c.location, c.comparisons, 'Specialty coffee shop');
  check(c.name, 'evidence built', evidence.status !== 'unavailable', evidence.status === 'unavailable' ? evidence.message : evidence.status);
  if (evidence.status === 'unavailable') continue;
  const text = JSON.stringify(evidence);
  check(c.name, 'no API key in the evidence payload', !text.includes(KEY));

  for (const place of evidence.places) {
    const state = place.geography.fips.slice(0, 2);
    const placeFips = place.geography.fips.slice(2);
    const [a, b, prior] = await Promise.all([raw(2024, state, ev.ACS_DETAIL_GROUPS[0]), raw(2024, state, ev.ACS_DETAIL_GROUPS[1]), raw(2019, state, ev.ACS_PRIOR_GROUP)]);
    const rowOf = (rows) => { const h = rows[0]; const r = rows.find(x => x[h.indexOf('place')] === placeFips); return r ? Object.fromEntries(h.map((k, i) => [k, r[i]])) : null; };
    const latest = { ...rowOf(a), ...rowOf(b) };
    const before = rowOf(prior);
    check(c.name, `${place.location}: geography is the Census place it names`, latest.NAME === place.geography.name, `${place.geography.name} (${place.geography.fips})`);

    // Every estimate and MOE the report shows equals what the API publishes for that place.
    const pairs = [['B01003_001', place.population], ['B19013_001', place.medianIncome], ['B25077_001', place.medianHomeValue], ['B19001_001', place.households]];
    for (const [v, shown] of pairs) {
      const expected = ev.acsValue(latest[`${v}E`], latest[`${v}M`], v);
      check(c.name, `${place.location}: ${v} matches the published estimate`, expected.value === shown.value, `${shown.value} (${shown.status})`);
      check(c.name, `${place.location}: ${v} margin matches`, expected.moe === shown.moe, `± ${shown.moe}`);
    }
    // Sums recomputed independently from the raw cells.
    const at75 = place.affordable.find(x => x.threshold === 75000);
    const cells = [13, 14, 15, 16, 17].map(i => `B19001_${String(i).padStart(3, '0')}`);
    const anyMissing = cells.some(v => Number(latest[`${v}E`]) < 0);
    if (anyMissing) check(c.name, `${place.location}: an unpublished bracket makes the $75k+ total unavailable`, at75.count.status === 'unavailable');
    else {
      const sum = cells.reduce((s, v) => s + Number(latest[`${v}E`]), 0);
      const moe = Math.sqrt(cells.reduce((s, v) => s + (Number(latest[`${v}E`]) === 0 ? 0 : Number(latest[`${v}M`]) ** 2), 0)
        + Math.max(0, ...cells.filter(v => Number(latest[`${v}E`]) === 0).map(v => Number(latest[`${v}M`]))) ** 2);
      check(c.name, `${place.location}: $75k+ households equal the sum of B19001_013 to _017`, sameNumber(at75.count.value, sum), `${at75.count.value}`);
      check(c.name, `${place.location}: $75k+ margin follows the Census sum rule`, Math.abs(at75.count.moe - moe) < 1e-6, `± ${at75.count.moe?.toFixed(1)}`);
    }
    // Annotation codes and open-ended medians are never shown as numbers that can be ranked.
    for (const [v, shown] of pairs) {
      if (Number(latest[`${v}E`]) < 0) check(c.name, `${place.location}: ${v} annotation shown as unavailable`, shown.value === null && shown.status === 'unavailable');
    }
    if (place.medianIncome.status === 'open-ended' || place.medianHomeValue.status === 'open-ended') {
      const tests = evidence.comparisons.filter(x => x.otherLocation !== place.location && ['medianIncome', 'medianHomeValue'].includes(x.metric) && [x.primary, x.other].some(v => v.status === 'open-ended'));
      check(c.name, `${place.location}: open-ended medians are never tested`, tests.every(t => t.test.verdict === 'not-testable'), `${tests.length} checks`);
    }
    check(c.name, `${place.location}: 2015–2019 period ${before ? 'found' : 'missing'} and handled`, before ? place.growth.value !== null : place.growth.status === 'unavailable');
    if (c.published?.[place.location]) {
      for (const [v, want] of Object.entries(c.published[place.location])) {
        const [est, moe] = Array.isArray(want) ? want : [want];
        const shown = { B01003_001: place.population, B19013_001: place.medianIncome, B25077_001: place.medianHomeValue }[v];
        check(c.name, `${place.location}: ${v} equals the published figure ${est}${moe ? ` ± ${moe}` : ''}`, shown.value === est && (moe === undefined || shown.moe === moe));
      }
    }
  }
  // Every comparison verdict follows from the published estimates and margins.
  for (const cmp of evidence.comparisons) {
    const again = ev.compareValues(cmp.primary, cmp.other);
    check(c.name, `verdict re-derived: ${cmp.label}, vs ${cmp.otherLocation}`, again.verdict === cmp.test.verdict, cmp.test.verdict);
  }
}

// Nothing stored in the emulator carries the key.
const cache = await admin.firestore().collection('censusPlaceCache').get();
check('Storage', 'no API key in the cached Census documents', !JSON.stringify(cache.docs.map(d => d.data())).includes(KEY), `${cache.size} documents`);

const failed = results.filter(r => !r.ok);
const out = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'census-validation');
fs.mkdirSync(out, { recursive: true });
const lines = ['# Census evidence validation report', '', `Run ${new Date().toISOString()} against the live Census Data API (ACS 5-year 2020–2024 and 2015–2019), Firestore emulator only.`, '', `**${results.length - failed.length}/${results.length} checks passed.**`, '', '| Case | Check | Result | Detail |', '| --- | --- | --- | --- |',
  ...results.map(r => `| ${r.caseName} | ${r.label} | ${r.ok ? 'PASS' : '**FAIL**'} | ${String(r.detail).replace(/\|/g, '/')} |`)];
fs.writeFileSync(path.join(out, 'REPORT.md'), lines.join('\n') + '\n');
console.log(`${results.length - failed.length}/${results.length} checks passed. Report: docs/census-validation/REPORT.md`);
process.exit(failed.length ? 1 : 0);
