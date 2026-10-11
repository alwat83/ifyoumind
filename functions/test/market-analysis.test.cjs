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
  assert.match(growth.text,/2nd highest five-year growth rate/);
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
