import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read=file=>fs.readFileSync(new URL(file,import.meta.url),'utf8');
const compiled=ts.transpileModule(read('../src/app/intelligence/evidence-summary.ts'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {summarizeEvidence,compareValues}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

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

test('the live sample: no favorable/caution verdict, growth reported as mixed, not ranked within the band', () => {
  const s=summarizeEvidence(austin,[nashville,charlotte]);
  assert.equal(s.kind,'differences');
  assert.equal(s.headline,'Austin, TX has higher median household income, population and median home value than both Nashville, TN and Charlotte, NC. It is mixed on 5-year population change.');
  const growth=s.findings.find(f=>f.key==='growth');
  assert.equal(growth.position,'mixed');
  assert.match(growth.detail,/about the same as Nashville, TN \(4%\)/);
  assert.match(growth.detail,/lower than Charlotte, NC \(5\.4%\)/);
  for(const word of ['favorable','caution','recommend this','best','leads']) assert.ok(!s.headline.toLowerCase().includes(word),word);
  assert.match(s.limits,/cannot recommend a location/);
  assert.match(s.method,/not a statistical test/);
  assert.match(s.method,/without a significance test/);
});

test('no clear difference is a first-class result', () => {
  const a=place('Springfield, IL',61000,114000,152000,-2.1);
  const b=place('Peoria, IL',62000,113000,150000,-1.0);
  const s=summarizeEvidence(a,[b]);
  assert.equal(s.kind,'no_clear_difference');
  assert.equal(s.headline,'On these Census measures, Springfield, IL shows no clear difference from Peoria, IL.');
  assert.ok(s.findings.every(f=>f.position==='similar'));
});

test('higher and lower are both stated, against the right places', () => {
  const s=summarizeEvidence(place('Springfield, IL',61000,114000,152000,-2.1),[place('Madison, WI',77000,270000,345000,7.1)]);
  assert.equal(s.headline,'Springfield, IL has lower median household income, population, 5-year population change and median home value than Madison, WI.');
  const s2=summarizeEvidence(place('A, TX',90000,100000,200000,0),[place('B, TX',70000,100000,300000,0)]);
  assert.equal(s2.headline,'A, TX has higher median household income than B, TX, and lower median home value than it.');
});

test('a single place is described, never ranked', () => {
  const s=summarizeEvidence(austin,[]);
  assert.equal(s.kind,'single_place');
  assert.deepEqual(s.findings,[]);
});

test('the closeness band: under 5% (levels) or 2 points (rates) is about the same', () => {
  assert.equal(compareValues(104,100,'USD'),0);
  assert.equal(compareValues(106,100,'USD'),1);
  assert.equal(compareValues(94,100,'people'),-1);
  assert.equal(compareValues(3,4,'%'),0);
  assert.equal(compareValues(3,5.4,'%'),-1);
  assert.equal(compareValues(-1,-3.5,'%'),1);
  assert.equal(compareValues(0,0,'USD'),0);
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
