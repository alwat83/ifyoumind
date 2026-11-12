import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { projectHomeBillExamples } from './helpers/home-bill-examples.mjs';

test('the homepage bill previews match the existing public fixtures and their calculation evidence', async () => {
  const snapshot = JSON.parse(readFileSync(new URL('../src/app/intelligence/home-bill-examples.json', import.meta.url), 'utf8'));
  assert.deepEqual(snapshot, await projectHomeBillExamples());
});
