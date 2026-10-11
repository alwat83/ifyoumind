import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/app/analytics/analytics-consent.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {analyticsAllowed}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('no stored choice means no analytics',()=>{
  assert.equal(analyticsAllowed(null,'ifyoumind.com'),false);
  assert.equal(analyticsAllowed(undefined,'ifyoumind.com'),false);
});

test('a rejected or partial choice means no analytics',()=>{
  assert.equal(analyticsAllowed({analytics:false},'ifyoumind.com'),false);
  assert.equal(analyticsAllowed({},'ifyoumind.com'),false);
  assert.equal(analyticsAllowed({analytics:'true'},'ifyoumind.com'),false);
});

test('an explicit analytics choice allows analytics on the live site',()=>{
  assert.equal(analyticsAllowed({analytics:true},'ifyoumind.com'),true);
  assert.equal(analyticsAllowed({analytics:true},'www.ifyoumind.com'),true);
});

test('never on local development hosts, even with consent',()=>{
  assert.equal(analyticsAllowed({analytics:true},'localhost'),false);
  assert.equal(analyticsAllowed({analytics:true},'127.0.0.1'),false);
});
