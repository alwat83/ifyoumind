import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const code = fs.readFileSync(new URL('../src/app/intelligence/city-decision-case.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { buildCityDecisionCase } = await import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));

const mkPlace = (location, state, place, amounts) => {
  const sourceUrl = `https://api.census.gov/data/2024/acs/acs5?get=NAME,B01003_001E,B19013_001E,B25077_001E&for=place:${place}&in=state:${state}`;
  return { location, metrics: ['homeValue', 'income', 'population', 'growth'].map((key, index) => ({
    key, unit: ['USD', 'USD', 'people', '%'][index], value: amounts[index], sourceUrl,
  })) };
};
const la = () => mkPlace('Los Angeles, CA', '06', '44000', [810000, 81000, 3800000, -2.6]);
const birmingham = () => mkPlace('Birmingham, AL', '01', '07000', [145000, 43000, 195000, -6.3]);

test('city case connects exact whole-unit differences to two official observations', () => {
  const result = buildCityDecisionCase(la(), [birmingham()], 'city-comparison');
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.coverage, 'complete');
  assert.equal(result.calculations.length, 3);
  const [home, income, population] = result.calculations;
  assert.deepEqual([home.value, income.value, population.value], [665000, 38000, 3605000]);
  assert.equal(home.formula, 'difference/v1');
  assert.equal(home.primary.variable, 'B25077_001E');
  assert.equal(home.other.variable, 'B25077_001E');
  assert.notEqual(home.primary.id, home.other.id);
  assert.equal(home.primary.sourceUrl, 'https://data.census.gov/table/ACSDT5Y2024.B25077?g=160XX00US0644000');
  assert.deepEqual(result.places.map(x => [x.stateFips, x.placeFips]), [['06', '44000'], ['01', '07000']]);
  assert.ok(result.places.every(place => !place.metrics.some(metric => metric.key === 'growth')));
  assert.equal(buildCityDecisionCase(la(), [birmingham()], 'personal-living-cost').coverage, 'partial');
});

test('wrong provider, vintage, variable, value, or state cannot support the numerical finding', () => {
  for (const mutate of [
    row => row.sourceUrl = row.sourceUrl.replace('api.census.gov', 'census.example'),
    row => row.sourceUrl = row.sourceUrl.replace('2024', '2019'),
    row => row.sourceUrl = row.sourceUrl.replace(',B25077_001E', ''),
    row => row.sourceUrl += '&key=untrusted',
    row => row.sourceUrl += '&in=state:06',
    row => row.sourceUrl = row.sourceUrl.replace('state:06', 'state:01'),
    row => row.value = '810000',
    row => row.value = -1,
    row => row.unit = 'people',
  ]) {
    const primary = la();
    mutate(primary.metrics[0]);
    const result = buildCityDecisionCase(primary, [birmingham()], 'city-comparison');
    assert.equal(result.coverage, 'partial');
    assert.equal(result.places[0].metrics.some(row => row.key === 'homeValue'), false);
    assert.equal(result.calculations.some(row => row.primary.key === 'homeValue'), false);
    assert.equal(result.calculations.length, 2);
  }
});

test('mixed place FIPS and duplicate place cannot masquerade as a comparison; legacy gaps fail closed', () => {
  const primary = la();
  primary.metrics[0].sourceUrl = primary.metrics[0].sourceUrl.replace('44000', '44001');
  const mixed = buildCityDecisionCase(primary, [birmingham()], 'city-comparison');
  assert.deepEqual(mixed.places.map(place => place.location), ['Birmingham, AL']);
  assert.equal(mixed.calculations.length, 0);
  assert.equal(buildCityDecisionCase(la(), [la()], 'city-comparison').calculations.length, 0);
  assert.equal(buildCityDecisionCase({}, [{ location:'Birmingham, AL', metrics:[] }], 'city-comparison').coverage, 'unavailable');
});
