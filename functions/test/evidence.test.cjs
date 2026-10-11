const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  acsValue, aggregate, proportion, ratio, percentChange, compareValues, reliabilityFor,
  placeEvidence, compareEvidence, buildReportEvidence, acsVariables, ACS_DETAIL_GROUPS, Z90,
} = require('../lib/intelligence/evidence');

const v = (value, moe) => acsValue(String(value), String(moe));
const close = (actual, expected, tol = 1e-6) => assert.ok(Math.abs(actual - expected) <= tol, `${actual} vs ${expected}`);

// Expected values below were computed by hand from the Census Bureau formulas (see evidence.ts).

test('the difference test uses SE = MOE / 1.645 and |Z| > 1.645 at 90% confidence', () => {
  assert.equal(Z90, 1.645);
  const clear = compareValues(v(93658, 1670), v(82068, 1500));
  close(clear.gap, 11590);
  close(clear.z, 8.493397860710745, 1e-9);
  assert.equal(clear.verdict, 'higher');
  const within = compareValues(v(3.0, 1.2), v(4.0, 1.0));
  close(within.z, -1.0531033374480694, 1e-9);
  assert.equal(within.verdict, 'similar');
  assert.equal(compareValues(v(70000, 900), v(80000, 900)).verdict, 'lower');
});

test('a difference is never claimed when a value, an MOE or an exact median is missing', () => {
  assert.equal(compareValues(acsValue('-666666666', '-222222222'), v(5, 1)).verdict, 'not-testable');
  assert.equal(compareValues(acsValue('50000', '-222222222'), v(40000, 100)).verdict, 'not-testable');
  const openEnded = acsValue('250001', '-333333333', 'B19013_001');
  assert.equal(openEnded.status, 'open-ended');
  assert.equal(compareValues(openEnded, v(100000, 500)).verdict, 'not-testable');
});

test('ACS annotation codes become explicit statuses, never numbers', () => {
  for (const code of ['-666666666', '-999999999', '-888888888', '-222222222', '', null, 'N']) {
    const value = acsValue(code, '10');
    assert.equal(value.status, 'unavailable', String(code));
    assert.equal(value.value, null);
  }
  const controlled = acsValue('5000', '-555555555');
  assert.equal(controlled.status, 'controlled');
  assert.equal(controlled.moe, 0);
  const noMoe = acsValue('5000', '-222222222');
  assert.equal(noMoe.value, 5000);
  assert.equal(noMoe.moe, null);
  assert.equal(noMoe.reliability, 'unknown');
  assert.equal(acsValue('9999', '500', 'B25077_001').status, 'open-ended');
  assert.equal(acsValue('3501', '-333333333', 'B25064_001').status, 'open-ended');
});

test('reliability bands follow the coefficient of variation (15% and 30% cut-offs)', () => {
  const good = reliabilityFor(5000, 800);
  close(good.cv, 0.0972644376899696, 1e-12);
  assert.equal(good.reliability, 'good');
  assert.equal(reliabilityFor(1000, 400).reliability, 'fair');
  const low = reliabilityFor(100, 60);
  close(low.cv, 0.36474164133738607, 1e-12);
  assert.equal(low.reliability, 'low');
  assert.equal(reliabilityFor(0, 10).reliability, 'unknown');
});

test('sums use root-sum-of-squares, counting only the largest MOE among zero estimates', () => {
  const total = aggregate([v(100, 10), v(50, 20), v(0, 15), v(0, 25)]);
  assert.equal(total.value, 150);
  close(total.moe, 33.54101966249684, 1e-9);
  assert.equal(aggregate([v(100, 10), acsValue('-666666666', '0')]).status, 'unavailable');
});

test('shares use the proportion formula, falling back to the ratio formula when it would be negative', () => {
  const share = proportion(v(40, 5), v(100, 8));
  close(share.value, 0.4);
  close(share.moe, 0.03841874542459709, 1e-12);
  const fallback = proportion(v(90, 2), v(100, 10));
  close(fallback.moe, 0.09219544457292887, 1e-12);
  assert.equal(proportion(v(10, 1), v(0, 1)).status, 'unavailable');
});

test('percent change between non-overlapping periods takes its MOE from the ratio formula', () => {
  close(ratio(v(1100, 50), v(1000, 40)).moe, 0.06660330322138686, 1e-12);
  const change = percentChange(v(1100, 50), v(1000, 40));
  close(change.value, 10, 1e-9);
  close(change.moe, 6.660330322138686, 1e-9);
  assert.equal(percentChange(v(1100, 50), acsValue('-666666666', '0')).status, 'unavailable');
});

test('the requested variables stay under the Census 50-variable limit per call', () => {
  for (const group of ACS_DETAIL_GROUPS) assert.ok(acsVariables(group).length + 1 <= 50, String(group.length));
});

// A synthetic place: 1,000 households spread over the 16 B19001 brackets, with known MOEs.
function detail(location, overrides = {}, prior = { B01003_001E: '9000', B01003_001M: '300' }) {
  const latest = {
    B01003_001E: '10000', B01003_001M: '250',
    B19013_001E: '80000', B19013_001M: '2000',
    B25077_001E: '400000', B25077_001M: '9000',
    B19001_001E: '1000', B19001_001M: '30',
    B01001_001E: '10000', B01001_001M: '250',
  };
  for (let i = 2; i <= 17; i++) { latest[`B19001_${String(i).padStart(3, '0')}E`] = String(i === 17 ? 115 : 59); latest[`B19001_${String(i).padStart(3, '0')}M`] = '10'; }
  for (const cell of ['011', '012', '013', '014', '035', '036', '037', '038']) { latest[`B01001_${cell}E`] = '400'; latest[`B01001_${cell}M`] = '40'; }
  return { location, censusName: `${location.split(',')[0]} city`, stateFips: '99', placeFips: '12345', latest: { ...latest, ...overrides }, prior };
}

test('place evidence sums the right income brackets and age cells', () => {
  const place = placeEvidence(detail('Testville, ZZ'));
  const at75 = place.affordable.find(a => a.threshold === 75000);
  // B19001_013 to _017: four brackets of 59 plus 115.
  assert.equal(at75.count.value, 59 * 4 + 115);
  close(at75.count.moe, Math.sqrt(5 * 100));
  close(at75.share.value, 351 / 1000);
  assert.equal(place.affordable.find(a => a.threshold === 150000).count.value, 59 + 115);
  assert.equal(place.age25to44.count.value, 3200);
  close(place.age25to44.share.value, 0.32);
  close(place.growth.value, (10000 / 9000 - 1) * 100, 1e-9);
  assert.equal(place.geography.level, 'place');
  assert.equal(place.geography.fips, '9912345');
});

test('a missing prior period or bracket is reported as unavailable, not as zero', () => {
  const noPrior = placeEvidence(detail('Newtown, ZZ', {}, null));
  assert.equal(noPrior.growth.status, 'unavailable');
  const missingBracket = placeEvidence(detail('Gapton, ZZ', { B19001_014E: '-666666666' }));
  assert.equal(missingBracket.affordable.find(a => a.threshold === 75000).count.status, 'unavailable');
  assert.equal(missingBracket.affordable.find(a => a.threshold === 150000).count.status, 'ok');
});

test('comparison wording only ranks places when the test says the difference is real', () => {
  const a = placeEvidence(detail('Alpha, ZZ', { B19013_001E: '90000', B19013_001M: '1500' }));
  const b = placeEvidence(detail('Beta, ZZ', { B19013_001E: '89000', B19013_001M: '1500' }));
  const c = placeEvidence(detail('Gamma, ZZ', { B19013_001E: '70000', B19013_001M: '1500' }));
  const checks = compareEvidence(a, [b, c]).filter(x => x.metric === 'medianIncome');
  assert.equal(checks[0].test.verdict, 'similar');
  assert.match(checks[0].wording, /statistically similar/);
  assert.doesNotMatch(checks[0].wording, /higher|lower/);
  assert.equal(checks[1].test.verdict, 'higher');
  assert.match(checks[1].wording, /Alpha, ZZ is higher than Gamma, ZZ/);
});

test('report evidence cites its source, period and geography, and marks gaps as partial', () => {
  const report = buildReportEvidence(detail('Alpha, ZZ'), [detail('Beta, ZZ', {}, null)], 'specialty coffee shop', '2026-10-11T12:00:00Z');
  assert.equal(report.status, 'partial');
  assert.deepEqual(report.thresholds, [50000, 75000, 100000, 150000]);
  assert.equal(report.places.length, 2);
  assert.match(report.plainText, /Target market for a specialty coffee shop/);
  assert.match(report.plainText, /2020–2024/);
  assert.match(report.plainText, /B19001/);
  assert.match(report.plainText, /city \(Census place\) level/);
  assert.match(report.plainText, /Retrieved 2026-10-11/);
  assert.match(report.plainText, /can't be compared reliably/);
  assert.doesNotMatch(report.plainText, /NaN|undefined|null/);
  const full = buildReportEvidence(detail('Alpha, ZZ'), [detail('Beta, ZZ')], null, '2026-10-11T12:00:00Z');
  assert.equal(full.status, 'ready');
});

test('controlled estimates are compared directly and the wording says no margin-of-error test applies', () => {
  const a = placeEvidence(detail('Alpha, ZZ', { B01003_001M: '-555555555' }, { B01003_001E: '9000', B01003_001M: '-555555555' }));
  const b = placeEvidence(detail('Beta, ZZ', { B01003_001E: '10100', B01003_001M: '-555555555' }, { B01003_001E: '9000', B01003_001M: '-555555555' }));
  assert.equal(a.growth.status, 'controlled');
  const growth = compareEvidence(a, [b]).find(c => c.metric === 'growth');
  assert.equal(growth.test.verdict, 'lower');
  assert.match(growth.wording, /controlled estimates with no sampling error/);
});
