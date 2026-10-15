import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url));
const pngSize = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

test('every icon the pages link to exists as a real, small image', () => {
  const index = read('src/index.html').toString();
  assert.match(index, /<link rel="icon" type="image\/png" href="favicon.png" \/>/);
  assert.match(index, /<link rel="apple-touch-icon" href="apple-touch-icon.png" \/>/);
  const angular = JSON.parse(read('angular.json'));
  const assets = Object.values(angular.projects)[0].architect.build.options.assets;
  assert.ok(assets.includes('src/favicon.png'), 'favicon.png is copied into the build');

  const icons = [['src/favicon.png', 64], ['public/apple-touch-icon.png', 180]];
  for (const [file, size] of icons) {
    const buf = read(file);
    assert.equal(buf.subarray(1, 4).toString(), 'PNG', `${file} is a PNG, not the HTML fallback`);
    assert.deepEqual(pngSize(buf), [size, size], file);
    assert.ok(buf.length < 40_000, `${file} stays small (${buf.length} bytes)`);
  }
  const ico = read('public/favicon.ico');
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0], 'favicon.ico is an icon file');
});
