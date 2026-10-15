import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read=file=>fs.readFileSync(new URL(file,import.meta.url),'utf8');
const compiled=ts.transpileModule(read('../src/app/intelligence/evidence-summary.ts'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {summarizeEvidence,compareValues,isSmallGap,describeGap}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const place=(location,income,population,homeValue,growth)=>({location,metrics:[
  {key:'population',label:'Population',value:population,unit:'people'},
  {key:'income',label:'Median household income',value:income,unit:'USD'},
  {key:'homeValue',label:'Median home value',value:homeValue,unit:'USD'},
  ...(growth===null?[]:[{key:'growth',label:'5-year population change',value:growth,unit:'%'}]),
]});
// The live sample report's own figures (ACS 2020-2024, retrieved 2026-10-11).
const austin=place('Austin, TX',93658,979539,555300,3);
const nashville=place('Nashville, TN',77371,690130,413600,4);
const charlotte=place('Charlotte, NC',82068,903844,385700,5.4);

test('the live sample: every gap is reported with its size; the small one is flagged, not declared equal', () => {
  const s=summarizeEvidence(austin,[nashville,charlotte]);
  assert.equal(s.kind,'differences');
  assert.equal(s.headline,'Austin, TX has higher median household income, population and median home value than both Nashville, TN and Charlotte, NC, and lower 5-year population change than both. One gap is small and may not be real: 5-year population change against Nashville, TN (1 point).');
  const growth=s.findings.find(f=>f.key==='growth');
  assert.equal(growth.position,'lower');
  assert.equal(growth.smallGap,true);
  assert.equal(growth.detail,'3%: 1 point lower than Nashville, TN (4%), a small gap that may not be real; 2.4 points lower than Charlotte, NC (5.4%).');
  const income=s.findings.find(f=>f.key==='income');
  assert.equal(income.detail,'$93,658: $16,287 (21%) higher than Nashville, TN ($77,371); $11,590 (14%) higher than Charlotte, NC ($82,068).');
  for(const word of ['favorable','caution','recommend this','best','leads','about the same','no clear difference','equivalent','significant']) assert.ok(!s.headline.toLowerCase().includes(word),word);
  assert.match(s.limits,/cannot recommend a location/);
  assert.match(s.method,/None of these differences has been tested for statistical significance/);
  assert.match(s.method,/reading aid, not a test/);
  assert.match(s.method,/larger gap can also fall within the error/);
});

test('conflicting indicators: both directions stated with their sizes, against the right place', () => {
  const s=summarizeEvidence(place('City A',90000,100000,600000,0.5),[place('City B',70000,140000,380000,6)]);
  assert.equal(s.headline,'City A has higher median household income and median home value than City B, and lower population and 5-year population change than it.');
  assert.equal(s.findings.find(f=>f.key==='growth').detail,'0.5%: 5.5 points lower than City B (6%).');
});

test('higher than one place and lower than another is named as such in the headline', () => {
  const s=summarizeEvidence(place('City A',80000,500000,300000,null),[place('City B',70000,400000,250000,null),place('City C',90000,450000,280000,null)]);
  assert.equal(s.headline,'City A has higher population and median home value than both City B and City C. It is higher than some places and lower than others on median household income.');
  assert.equal(s.findings.find(f=>f.key==='income').position,'mixed');
});

test('when every gap is small, the places are not declared equal: the figures cannot tell them apart', () => {
  const a=place('Springfield, IL',61000,114000,152000,-2.1);
  const b=place('Peoria, IL',62000,113000,150000,-1.0);
  const s=summarizeEvidence(a,[b]);
  assert.equal(s.kind,'small_differences');
  assert.equal(s.headline,'Springfield, IL and Peoria, IL differ only slightly on every measure here: each gap is under 5% (or 2 points for population change). Gaps this small can come from survey error alone, so these figures do not tell the places apart.');
  assert.ok(s.findings.every(f=>f.smallGap&&f.position!=='equal'));
  assert.match(s.findings.find(f=>f.key==='income').detail,/\$1,000 \(1\.6%\) lower than Peoria, IL \(\$62,000\), a small gap/);
});

test('higher and lower are both stated, against the right places', () => {
  const s=summarizeEvidence(place('Springfield, IL',61000,114000,152000,-2.1),[place('Madison, WI',77000,270000,345000,7.1)]);
  assert.equal(s.headline,'Springfield, IL has lower median household income, population, 5-year population change and median home value than Madison, WI.');
  const s2=summarizeEvidence(place('A, TX',90000,100000,200000,0),[place('B, TX',70000,100000,300000,0)]);
  assert.equal(s2.headline,'A, TX has higher median household income than B, TX, and lower median home value than it.');
  assert.equal(s2.findings.find(f=>f.key==='population').detail,'100,000: the same figure as B, TX (100,000).');
});

test('a single place is described, never ranked', () => {
  const s=summarizeEvidence(austin,[]);
  assert.equal(s.kind,'single_place');
  assert.deepEqual(s.findings,[]);
});

test('direction is exact; the small-gap flag is separate and stated in sizes', () => {
  assert.equal(compareValues(104,100),1);
  assert.equal(compareValues(94,100),-1);
  assert.equal(compareValues(100,100),0);
  assert.equal(isSmallGap(104,100,'USD'),true);
  assert.equal(isSmallGap(106,100,'USD'),false);
  assert.equal(isSmallGap(3,4,'%'),true);
  assert.equal(isSmallGap(3,5.4,'%'),false);
  assert.equal(describeGap(93658,77371,'USD'),'$16,287 (21%)');
  assert.equal(describeGap(979539,903844,'people'),'75,695 (8.4%)');
  assert.equal(describeGap(3,5.4,'%'),'2.4 points');
  assert.equal(describeGap(3,4,'%'),'1 point');
});

test('missing measures are skipped, not invented', () => {
  const s=summarizeEvidence(place('A, TX',90000,100000,200000,null),[place('B, TX',70000,100000,200000,1)]);
  assert.ok(!s.findings.some(f=>f.key==='growth'));
});

test('older saved briefs: no comparisons field, or non-numeric values, never break the page', () => {
  assert.equal(summarizeEvidence(austin, undefined).kind, 'single_place');
  const odd={location:'Old, TX',metrics:[{key:'income',label:'Median household income',value:'n/a',unit:'USD'},{key:'population',label:'Population',value:1000,unit:'people'}]};
  const s=summarizeEvidence(odd,[place('B, TX',70000,1200,200000,1)]);
  assert.deepEqual(s.findings.map(f=>f.key),['population']);
  assert.equal(summarizeEvidence({location:'X',metrics:undefined},[]).kind,'single_place');
});
