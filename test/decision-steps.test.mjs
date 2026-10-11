import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read=file=>fs.readFileSync(new URL(file,import.meta.url),'utf8');
const compiled=ts.transpileModule(read('../src/app/intelligence/decision-steps.ts'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {parseComparisons,requiresComparison,stepProgress}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('comparison places are split on semicolons, trimmed and capped at three',()=>{
  assert.deepEqual(parseComparisons(' Austin, TX ; ;Raleigh, NC'),['Austin, TX','Raleigh, NC']);
  assert.deepEqual(parseComparisons('a;b;c;d'),['a','b','c']);
  assert.deepEqual(parseComparisons(''),[]);
});

test('business and comparison decisions need at least one comparison; growth and custom do not',()=>{
  assert.equal(requiresComparison('business'),true);
  assert.equal(requiresComparison('compare'),true);
  assert.equal(requiresComparison('growth'),false);
  assert.equal(requiresComparison('custom'),false);
});

test('a visitor arriving from the homepage sees two steps, not four',()=>{
  assert.deepEqual(stepProgress(2,2),{current:1,total:2});
  assert.deepEqual(stepProgress(3,2),{current:2,total:2});
  assert.deepEqual(stepProgress(1,1),{current:1,total:3});
  assert.deepEqual(stepProgress(3,1),{current:3,total:3});
});

test('the separate confirmation step is gone and the build button sits on the context step',()=>{
  const html=read('../src/app/intelligence/decision-flow.component.html');
  assert.doesNotMatch(html,/step===4/);
  assert.match(html,/step===3[\s\S]*analyze\(\)/);
});

test('new accounts start the market-analysis flow; verification keeps its gate',()=>{
  const register=read('../src/app/auth/register/register.component.ts');
  assert.match(register,/FIRST_DECISION_ROUTE=\['\/app\/decide'\]/);
  assert.match(register,/navigate\(\['\/verify-email'\]\)/);
  const guard=read('../src/app/auth.guard.ts');
  assert.match(guard,/user\.emailVerified/);
});
