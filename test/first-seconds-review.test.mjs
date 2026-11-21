import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { conceptHtml, facts, concepts } from '../scripts/review-first-seconds.mjs';

test('first-screen studies share the validated illustrative tax arithmetic',()=>{
 assert.equal(facts.delta,420);assert.equal(facts.school,240);assert.equal(facts.county+facts.school+facts.municipal,facts.delta);assert.equal(facts.share,'57.1');
 assert.equal(Object.keys(concepts).length,3);assert.throws(()=>conceptHtml('unsupported'));
});

test('generated review pages stay current, label their limits and link the existing supported intake',async()=>{
 for(const id of Object.keys(concepts)){
  const html=conceptHtml(id);assert.equal(await readFile(`docs/design/midnight-slate/first-five-seconds/${id}.html`,'utf8'),html);
  assert.match(html,/Made-up figures/);assert.match(html,/Not a county record or your property/);assert.match(html,/not why it happened or whether you paid too much/);
  assert.match(html,/http:\/\/127\.0\.0\.1:4392\/discover\/\?example=tax&input=csv/);assert.match(html,/PDFs and scans aren’t supported/);assert.match(html,/Bill comparisons stay free and local/);
  assert.doesNotMatch(html,/<input|<textarea|api\.openai|checkout\.stripe|AI-generated|we found savings/i);
 }
});

test('review artifacts do not enter the production route or build graph',async()=>{
 for(const path of ['angular.json','firebase.json','src/app/app.routes.ts','src/app/intelligence/public-landing.component.html'])assert.doesNotMatch(await readFile(path,'utf8'),/first-five-seconds|review-first-seconds/);
 const behavior=await readFile('docs/design/midnight-slate/first-five-seconds/concepts.js','utf8');assert.doesNotMatch(behavior,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|gtag\s*\(/);
});
