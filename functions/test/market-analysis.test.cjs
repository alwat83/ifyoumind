const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildMarketAnalysis, businessPhrase, conceptPhrase, marketAnalysisText } = require('../lib/intelligence/market-analysis');
const { buildLiveBrief } = require('../lib/intelligence/market-intelligence');

const place=(location,population,income,homeValue,growth)=>({
  location,population,income,homeValue,populationChangePct:growth,placeFips:'1',stateFips:'1',
});
const primary=place('Austin, TX',900000,90000,550000,5.2);
const nashville=place('Nashville, TN',700000,75000,400000,3.1);
const charlotte=place('Charlotte, NC',880000,80000,350000,8.4);

test('concept phrase is tidy and keeps acronyms', () => {
  assert.equal(conceptPhrase('Specialty coffee shop.'),'specialty coffee shop');
  assert.equal(conceptPhrase('HVAC company'),'HVAC company');
  assert.equal(conceptPhrase('  '),'business');
});

test('analysis is tailored to the concept and cites only input figures', () => {
  const section=buildMarketAnalysis({concept:'Specialty coffee shop',primary,comparisons:[nashville,charlotte],retrievedAt:'2026-10-10T00:00:00Z'});
  assert.equal(section.title,'Market analysis: specialty coffee shop in Austin, TX');
  const text=marketAnalysisText(section);
  assert.match(text,/\$90,000/);
  assert.match(text,/900,000/);
  assert.match(text,/specialty coffee shop/);
  assert.match(text,/Retrieved 2026-10-10/);
  assert.doesNotMatch(text,/lender[- ]approved|guarantee/i);
});

test('rankings and comparative position follow the data', () => {
  const section=buildMarketAnalysis({concept:'Gym',primary,comparisons:[nashville,charlotte],retrievedAt:'2026-10-10'});
  const income=section.rankings.find(r=>r.metric==='Median household income');
  assert.deepEqual(income.ordered.map(r=>r.location),['Austin, TX','Charlotte, NC','Nashville, TN']);
  const position=section.paragraphs.find(p=>p.heading==='Comparative position');
  assert.match(position.text,/leads on household income and population/);
  const growth=section.paragraphs.find(p=>p.heading==='Market size and growth');
  assert.match(growth.text,/2nd highest estimate of the 3 locations evaluated \(margins of error not checked\)/);
  assert.match(position.text,/Margins of error were not checked/);
});

test('single-location analysis omits comparison content', () => {
  const section=buildMarketAnalysis({concept:'Bakery',primary:place('Boise, ID',230000,70000,450000,null),comparisons:[],retrievedAt:'2026-10-10'});
  assert.equal(section.rankings.length,0);
  assert.equal(section.paragraphs.some(p=>p.heading==='Comparative position'),false);
  assert.match(section.paragraphs[0].text,/not available/);
});

test('decision-type defaults are never written as if they were a business', () => {
  for (const concept of ['Location comparison', 'Market growth', 'Location decision', '', '  ']) {
    assert.equal(businessPhrase(concept), null, concept);
    const section = buildMarketAnalysis({ concept, primary, comparisons: [nashville], retrievedAt: '2026-10-10' });
    assert.equal(section.title, 'Market analysis: Austin, TX');
    const text = marketAnalysisText(section).toLowerCase();
    assert.doesNotMatch(text, /location comparison|market growth|location decision|your business|business competitors/);
  }
  assert.equal(businessPhrase('Specialty coffee shop'), 'specialty coffee shop');
});

test('the free brief keeps neutral questions when no business was given', () => {
  const generic = buildLiveBrief(primary, [nashville], 'Market growth');
  assert.equal(generic.questions[0], 'What local competitors serve the same customer as Austin, TX?');
  assert.doesNotMatch(JSON.stringify(generic), /market growth competitors|your market growth/i);
  const tailored = buildLiveBrief(primary, [nashville], 'Gym');
  assert.match(tailored.questions[0], /How many gym competitors/);
  assert.match(tailored.decisionReport.decisionTriggers.strengthens, /your gym/);
});

// ---- Wording that follows the 90% difference tests (evidence.ts) ----
const { withEvidence } = require('../lib/intelligence/market-intelligence');
const { buildReportEvidence } = require('../lib/intelligence/evidence');

const verdictTable = (table) => (metric, other) => table[metric]?.[other];
const austin = place('Austin, TX', 900000, 90000, 550000, 5.2);
const nash = place('Nashville, TN', 700000, 89500, 400000, 3.1);
const char = place('Charlotte, NC', 880000, 80000, 350000, 8.4);

test('a place is never called the highest when a difference is within the margin of error', () => {
  const confidence = verdictTable({
    income: { 'Nashville, TN': 'similar', 'Charlotte, NC': 'higher' },
    population: { 'Nashville, TN': 'higher', 'Charlotte, NC': 'similar' },
    homeValue: { 'Nashville, TN': 'higher', 'Charlotte, NC': 'higher' },
    growth: { 'Nashville, TN': 'similar', 'Charlotte, NC': 'lower' },
  });
  const section = buildMarketAnalysis({ concept: 'Specialty coffee shop', primary: austin, comparisons: [nash, char], retrievedAt: '2026-10-11', confidence });
  const text = marketAnalysisText(section);
  const income = section.paragraphs.find(p => p.heading === 'Household purchasing power').text;
  assert.match(income, /higher than Charlotte, NC; statistically similar to Nashville, TN \(the difference is within the margin of error\)/);
  assert.doesNotMatch(income, /the highest/);
  const home = section.paragraphs.find(p => p.heading === 'Property cost context').text;
  assert.match(home, /clearly the highest of the 3 locations evaluated/);
  const position = section.paragraphs.find(p => p.heading === 'Comparative position').text;
  assert.doesNotMatch(position, /leads on household income/);
  assert.match(position, /not clearly ahead or behind/);
  assert.match(position, /shouldn't be ranked/);
  assert.equal(section.rankings.find(r => r.metric === 'Median home value').note, undefined);
  assert.match(section.rankings.find(r => r.metric === 'Median household income').note, /not a clear ranking/);
  assert.doesNotMatch(text, /margins of error not checked/);
});

test('clear differences on every comparison are stated as leads', () => {
  const allHigher = verdictTable({
    income: { 'Nashville, TN': 'higher', 'Charlotte, NC': 'higher' },
    population: { 'Nashville, TN': 'higher', 'Charlotte, NC': 'higher' },
    homeValue: { 'Nashville, TN': 'higher', 'Charlotte, NC': 'higher' },
    growth: { 'Nashville, TN': 'higher', 'Charlotte, NC': 'lower' },
  });
  const section = buildMarketAnalysis({ concept: 'Gym', primary: austin, comparisons: [nash, char], retrievedAt: '2026-10-11', confidence: allHigher });
  const position = section.paragraphs.find(p => p.heading === 'Comparative position').text;
  assert.match(position, /leads on household income and population/);
  assert.match(position, /population growth/);
  assert.doesNotMatch(position, /on the point estimates/);
});

test('untestable comparisons are not ranked either', () => {
  const missing = verdictTable({ income: { 'Nashville, TN': 'not-testable', 'Charlotte, NC': 'higher' } });
  const section = buildMarketAnalysis({ concept: 'Gym', primary: austin, comparisons: [nash, char], retrievedAt: '2026-10-11', confidence: missing });
  const income = section.paragraphs.find(p => p.heading === 'Household purchasing power').text;
  assert.match(income, /not reliably comparable with Nashville, TN/);
  const growth = section.paragraphs.find(p => p.heading === 'Market size and growth').text;
  assert.match(growth, /margins of error not checked/);
});

function evidenceDetail(location, income, incomeMoe) {
  const latest = { B01003_001E: '500000', B01003_001M: '900', B19013_001E: String(income), B19013_001M: String(incomeMoe), B25077_001E: '400000', B25077_001M: '5000', B19001_001E: '200000', B19001_001M: '1500', B01001_001E: '500000', B01001_001M: '900' };
  for (let i = 2; i <= 17; i++) { latest[`B19001_${String(i).padStart(3, '0')}E`] = '12500'; latest[`B19001_${String(i).padStart(3, '0')}M`] = '400'; }
  for (const c of ['011', '012', '013', '014', '035', '036', '037', '038']) { latest[`B01001_${c}E`] = '20000'; latest[`B01001_${c}M`] = '600'; }
  return { location, censusName: `${location} city`, stateFips: '48', placeFips: '05000', latest, prior: { B01003_001E: '480000', B01003_001M: '900' } };
}

test('loading evidence rewrites the paid narrative and takeaways to follow the tests', () => {
  const evidence = buildReportEvidence(evidenceDetail('Austin, TX', 90000, 1500), [evidenceDetail('Nashville, TN', 89000, 1500), evidenceDetail('Charlotte, NC', 70000, 1500)], 'specialty coffee shop', '2026-10-11T00:00:00Z');
  const brief = buildLiveBrief(austin, [nash, char], 'Specialty coffee shop');
  const paid = withEvidence(brief, evidence, 'Specialty coffee shop');
  assert.equal(paid.decisionReport.evidence, evidence);
  const income = paid.decisionReport.marketAnalysis.paragraphs.find(p => p.heading === 'Household purchasing power').text;
  assert.match(income, /higher than Charlotte, NC; statistically similar to Nashville, TN/);
  assert.match(paid.decisionReport.marketAnalysis.plainText, /statistically similar to Nashville, TN/);
  const nashFindings = paid.decisionReport.comparisonFindings.find(f => f.location === 'Nashville, TN').findings.join(' ');
  assert.match(nashFindings, /within the margin of error, so it is not a real difference/);
  const charFindings = paid.decisionReport.comparisonFindings.find(f => f.location === 'Charlotte, NC').findings.join(' ');
  assert.match(charFindings, /real difference at 90% confidence/);
});

test('when evidence is unavailable, the narrative keeps its estimate-only wording', () => {
  const brief = buildLiveBrief(austin, [nash, char], 'Specialty coffee shop');
  const paid = withEvidence(brief, { schemaVersion: 1, status: 'unavailable', message: 'x' }, 'Specialty coffee shop');
  assert.match(marketAnalysisText(paid.decisionReport.marketAnalysis), /margins of error not checked/);
  assert.doesNotMatch(marketAnalysisText(paid.decisionReport.marketAnalysis), /clearly the highest/);
});
