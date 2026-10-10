const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findPlace, sampleNeedsRefresh } = require('../lib/intelligence/market-intelligence');

const rows=[
  ['NAME','B01003_001E','state','place'],
  ['Nashville-Davidson metropolitan government (balance), Tennessee','1','47','52006'],
  ['Indianapolis city (balance), Indiana','2','18','36003'],
  ['Louisville/Jefferson County metro government (balance), Kentucky','3','21','48006'],
  ['Lexington-Fayette urban county, Kentucky','4','21','46027'],
  ['Urban Honolulu CDP, Hawaii','5','15','71550'],
  ['Boise City city, Idaho','6','16','08830'],
  ['Charlotte city, North Carolina','7','37','12000'],
  ['Winston-Salem city, North Carolina','8','37','75000'],
  ['Austin city, Texas','9','48','05000'],
];

test('matches ordinary Census place names', () => {
  assert.equal(findPlace(rows,'Charlotte')?.[1],'7');
  assert.equal(findPlace(rows,'Austin')?.[1],'9');
  assert.equal(findPlace(rows,'Winston-Salem')?.[1],'8');
});

test('matches consolidated city-county governments by their common name', () => {
  assert.equal(findPlace(rows,'Nashville')?.[1],'1');
  assert.equal(findPlace(rows,'Indianapolis')?.[1],'2');
  assert.equal(findPlace(rows,'Louisville')?.[1],'3');
  assert.equal(findPlace(rows,'Lexington')?.[1],'4');
  assert.equal(findPlace(rows,'Honolulu')?.[1],'5');
  assert.equal(findPlace(rows,'Boise City')?.[1],'6');
  assert.equal(findPlace(rows,'Boise')?.[1],'6');
});

test('does not split ordinary hyphenated cities into partial matches', () => {
  assert.equal(findPlace(rows,'Winston'),null);
  assert.equal(findPlace(rows,'Fayette'),null);
});

test('public sample refreshes on schema change or after 30 days', () => {
  const now=Date.UTC(2026,9,10);
  assert.equal(sampleNeedsRefresh(now-1000,1,1,now),false);
  assert.equal(sampleNeedsRefresh(now-31*24*3600*1000,1,1,now),true);
  assert.equal(sampleNeedsRefresh(now,0,1,now),true);
  assert.equal(sampleNeedsRefresh(undefined,1,1,now),true);
});
