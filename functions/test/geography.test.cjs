const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { cbsaForCounty, countyPartsQuery, parseCountyParts, resolvePlaceGeography } = require('../lib/intelligence/geography/geography');
const data = require('../lib/intelligence/geography/cbsa-2023');

test('the bundled 2023 delineation is complete and unchanged', () => {
  assert.equal(Object.keys(data.CBSA_2023).length, 935);
  assert.equal(Object.keys(data.COUNTY_TO_CBSA_2023).length, 1915);
  // Canonical form: keys sorted as strings (JS orders numeric-looking keys itself, so the raw file order can't be compared).
  const sorted = (o) => '{' + Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${JSON.stringify(o[k])}`).join(',') + '}';
  const canonical = `{"cbsa":${sorted(data.CBSA_2023)},"county":${sorted(data.COUNTY_TO_CBSA_2023)}}`;
  // Expected hash computed from the source extract whose raw SHA-256 is 0d570d2f…f99430.
  assert.equal(createHash('sha256').update(canonical).digest('hex'), '9bc97e5258a5ad94485224788a40d7acc4382a2dfe5b88fef02712ce11bc2fde');
});

test('counties map to their metro areas (values checked against the source file)', () => {
  for (const county of ['48453', '48491', '48209', '48021']) {
    assert.deepEqual(cbsaForCounty(county), { code: '12420', title: 'Austin-Round Rock-San Marcos, TX', type: 'Metro', vintage: 'July 2023' });
  }
  assert.equal(cbsaForCounty('47037').title, 'Nashville-Davidson--Murfreesboro--Franklin, TN');
  assert.equal(cbsaForCounty('37119').code, '16740');
  assert.equal(cbsaForCounty('99999'), null);
});

test('the Census request asks for county parts within one place, with validated codes', () => {
  assert.deepEqual(countyPartsQuery('48', '05000'), { path: '/data/2024/acs/acs5', params: { get: 'NAME,B01003_001E', for: 'county (or part):*', in: 'state:48 place:05000' } });
  assert.throws(() => countyPartsQuery('48', '5000'));
  assert.throws(() => countyPartsQuery('4', '05000'));
});

// Response shape of the ACS API for summary level 155. Values are illustrative.
const austinRows = [
  ['NAME', 'B01003_001E', 'state', 'place', 'county (or part)'],
  ['Hays County (part); Austin city; Texas', '1200', '48', '05000', '209'],
  ['Travis County (part); Austin city; Texas', '900000', '48', '05000', '453'],
  ['Williamson County (part); Austin city; Texas', '78000', '48', '05000', '491'],
  ['Bastrop County (part); Austin city; Texas', '300', '48', '05000', '021'],
];

test('county parts are parsed, sorted by residents, with shares for display only', () => {
  const parts = parseCountyParts(austinRows);
  assert.deepEqual(parts.map(p => p.fips), ['48453', '48491', '48209', '48021']);
  assert.equal(parts[0].name, 'Travis County (part)');
  assert.ok(Math.abs(parts.reduce((s, p) => s + p.share, 0) - 1) < 1e-12);
  const missing = parseCountyParts([austinRows[0], ['X County (part); Y; Z', '-666666666', '48', '05000', '001'], austinRows[2]]);
  assert.equal(missing.find(p => p.fips === '48001').population, null);
  assert.ok(missing.every(p => p.share === null), 'no shares when any part is unpublished');
  assert.throws(() => parseCountyParts({}));
  assert.throws(() => parseCountyParts([['NAME']]));
});

test('a multi-county city resolves to one metro and says county figures are never apportioned', () => {
  const geo = resolvePlaceGeography({ stateFips: '48', placeFips: '05000', name: 'Austin city, Texas' }, parseCountyParts(austinRows));
  assert.equal(geo.place.fips, '4805000');
  assert.equal(geo.counties.length, 4);
  assert.equal(geo.cbsa.code, '12420');
  assert.match(geo.notes.join(' '), /lies in 4 counties.*never apportioned/);
  assert.equal(JSON.stringify(geo).includes('weight'), false);
});

test('counties outside any metro, or in several metros, never produce a single metro', () => {
  const rural = resolvePlaceGeography({ stateFips: '99', placeFips: '00001', name: 'Test' }, [{ fips: '99999', name: 'Nowhere County', population: 10, share: 1 }]);
  assert.equal(rural.cbsa, null);
  assert.match(rural.notes.join(' '), /not part of any metro/);
  const split = resolvePlaceGeography({ stateFips: '00', placeFips: '00001', name: 'Test' }, [
    { fips: '48453', name: 'Travis County (part)', population: 10, share: 0.5 },
    { fips: '47037', name: 'Davidson County (part)', population: 10, share: 0.5 },
  ]);
  assert.equal(split.cbsa, null);
  assert.equal(split.cbsas.length, 2);
  assert.match(split.notes.join(' '), /more than one metro/);
  assert.match(resolvePlaceGeography({ stateFips: '00', placeFips: '00001', name: 'T' }, []).notes[0], /no counties/);
});
