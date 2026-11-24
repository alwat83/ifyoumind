import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = fs.readFileSync('src/app/services/analytics.service.ts', 'utf8');
const tree = ts.createSourceFile('analytics.service.ts', source, ts.ScriptTarget.Latest, true);
const declaration = tree.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'browserPort');
assert.ok(declaration, 'Test the actual browser adapter, not a rewritten implementation');
const js = ts.transpileModule(declaration.getText(tree), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const safe = { send_to: 'G-NRT31062LW', page_location: 'https://ifyoumind.com/privacy-policy', page_title: 'Privacy policy', page_referrer: '' };
function fixture({ conflict = false, fail = false } = {}) {
  const scripts = [], removed = [];
  const window = {}, document = {
    querySelector: () => conflict ? {} : null,
    createElement: () => ({}), head: { appendChild: script => { scripts.push(script); fail ? script.onerror() : script.onload(); } },
    get cookie() { return 'ifym_ga=synthetic; _ga=synthetic; unrelated=preserve'; },
    set cookie(v) { removed.push(v); },
  };
  const context = vm.createContext({ window, document, location: { hostname: 'ifyoumind.com' }, sessionStorage: { removeItem() {} }, GA4_ID: 'G-NRT31062LW', Date });
  vm.runInContext(js, context);
  return { window, document, scripts, removed, port: vm.runInContext('browserPort()', context), commands: () => Array.from(window.dataLayer || [], a => Array.from(a)) };
}
test('privacy defaults precede Google initialization, suppress auto views and match scoped configuration', async () => {
  const f = fixture(); assert.equal(await f.port.start(safe), true);
  const commands = f.commands(), init = commands.findIndex(a => a[0] === 'js');
  const defaults = commands.findIndex(a => a[0] === 'set' && typeof a[1] === 'object');
  const config = commands.findIndex(a => a[0] === 'config');
  assert.ok(defaults >= 0 && defaults < init && init < config);
  assert.equal(commands[defaults][1].send_page_view, false);
  for (const key of ['page_location', 'page_title', 'page_referrer']) assert.equal(commands[defaults][1][key], safe[key]);
  assert.deepEqual(commands[defaults][1], commands[config][2]);
  assert.equal(commands[defaults][1].allow_google_signals, false);
  assert.equal(commands[defaults][1].allow_ad_personalization_signals, false);
  assert.equal(commands[defaults][1].cookie_expires, 2592000);
  assert.equal(commands[defaults][1].cookie_update, false);
  assert.equal(f.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-NRT31062LW');
  assert.equal(f.scripts[0].referrerPolicy, 'no-referrer');
  assert.equal(commands.filter(a => a[0] === 'event').length, 0);
});
test('one owned tag; withdrawal blocks sends, clears only analytics cookies, and regrant reuses the tag', async () => {
  const f = fixture(); await f.port.start(safe); await f.port.start(safe);
  assert.equal(f.scripts.length, 1);
  f.port.send('page_view', safe);
  const sent = f.commands().filter(a => a[0] === 'event').length;
  f.port.stop(); f.port.send('page_view', safe);
  assert.equal(f.window['ga-disable-G-NRT31062LW'], true);
  assert.equal(f.commands().filter(a => a[0] === 'event').length, sent);
  assert.ok(f.removed.length > 0); assert.ok(f.removed.every(c => /^(ifym_ga|_ga)=/.test(c)));
  assert.equal(await f.port.start(safe), true); assert.equal(f.scripts.length, 1);
  assert.equal(f.window['ga-disable-G-NRT31062LW'], false);
});
test('existing tag conflict and failed loader fail closed', async () => {
  const conflict = fixture({ conflict: true }); assert.equal(await conflict.port.start(safe), false); assert.equal(conflict.scripts.length, 0);
  const failed = fixture({ fail: true }); assert.equal(await failed.port.start(safe), false); assert.equal(failed.commands().filter(a => a[0] === 'event').length, 0);
});
