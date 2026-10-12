import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const load = async (p) => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(read(p), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`);
const { EngagementTracker, ACTIVATION_DWELL_MS } = await load('../src/app/intelligence/engagement.ts');

test('finding_viewed needs 30 seconds and one meaningful action, and fires once', () => {
  assert.equal(ACTIVATION_DWELL_MS, 30000);
  const early = new EngagementTracker(0);
  assert.equal(early.interact('copy', 5000), null, 'an action before 30 s waits');
  assert.equal(early.tick(20000), null, 'not yet 30 s');
  assert.equal(early.tick(30000), 'copy', 'sent once the dwell time passes');
  assert.equal(early.tick(40000), null);
  assert.equal(early.interact('source', 50000), null, 'only once per page view');

  const late = new EngagementTracker(0);
  assert.equal(late.tick(31000), null, 'time alone is not activation');
  assert.equal(late.interact('source', 31000), 'source');
  assert.equal(late.interact('export', 32000), null);
  assert.equal(new EngagementTracker(1000).msUntilDwell(11000), 20000);
});

test('the report records the new events only for signed-in reports, with enumerated context', () => {
  const tsSrc = read('../src/app/intelligence/market-report.component.ts');
  assert.match(tsSrc, /if\(this\.sampleMode\|\|!this\.organizationId\|\|!this\.project\?\.id\)return;/, 'the public sample records nothing');
  assert.match(tsSrc, /if\(!this\.reportPurchased\)this\.record\('offer_viewed',\{surface:'upgrade_panel',offer:'report'\}\);/);
  assert.match(tsSrc, /if\(this\.showPurchasePrompt\)this\.record\('intent_prompt_shown'\);/);
  assert.match(tsSrc, /this\.record\('report_exported',\{format:'print'\}\);\s*this\.engaged\('export'\);\s*window\.print\(\);/);
  assert.match(tsSrc, /this\.record\('report_copied',\{section:'market_analysis'\}\);/);
  assert.match(tsSrc, /ngOnDestroy\(\):void\{\s*if\(this\.dwellTimer\)clearTimeout\(this\.dwellTimer\);/, 'no timer outlives the page');
  for (const [, ctx] of tsSrc.matchAll(/this\.record\('[a-z_]+',(\{[^}]*\})\)/g)) {
    assert.doesNotMatch(ctx, /email|name|city|place|displayName|concept|decision:/i, `context ${ctx} carries only enumerations`);
  }
  const html = read('../src/app/intelligence/market-report.component.html');
  assert.match(html, /<a \(click\)="onIntentPromptClick\(\)" \[routerLink\]="\['\/app\/pricing'\]"/);
  assert.match(html, /rel="noopener noreferrer" \(click\)="onSourceOpened\(\)">Open source<\/a>/);
  assert.match(html, /\(copiedText\)="onMarketAnalysisCopied\(\)"/);
  const analysis = read('../src/app/intelligence/market-analysis.component.ts');
  assert.match(analysis, /this\.copied=true;\s*this\.copiedText\.emit\(\);/, 'only a successful copy counts');
});

test('the client event list matches the server allowlist', () => {
  const client = [...read('../src/app/intelligence/product-analytics.service.ts').matchAll(/\|'([a-z_]+)'/g)].map(m => m[1]).sort();
  const server = [...read('../functions/src/intelligence/product-event-logic.ts').matchAll(/^\s+([a-z_]+):(?:null|\{)/gm)].map(m => m[1]).sort();
  assert.deepEqual(client, server);
});
