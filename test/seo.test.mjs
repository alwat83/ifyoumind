import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require=createRequire(import.meta.url);
const root=new URL('..',import.meta.url);
const read=(file)=>fs.readFileSync(new URL(file,root),'utf8');
const pages=JSON.parse(read('src/public-pages.json'));
const compiled=ts.transpileModule(read('src/app/seo/page-meta.ts'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {pageMetaFor,normalizePath,SITE_URL}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const {buildSitemap}=require('../scripts/generate-sitemap.js');

test('every public page is canonical to itself and indexable',()=>{
  for(const page of pages){
    const meta=pageMetaFor(page.path,pages);
    assert.equal(meta.canonical,`${SITE_URL}${page.path}`);
    assert.equal(meta.robots,'index,follow');
    assert.equal(meta.title,page.title);
  }
});

test('query strings, fragments and trailing slashes do not change the canonical',()=>{
  assert.equal(normalizePath('/sample-report/?utm_source=x#top'),'/sample-report');
  assert.equal(pageMetaFor('/sample-report?ref=post',pages).canonical,'https://ifyoumind.com/sample-report');
  assert.equal(pageMetaFor('/?utm_campaign=launch',pages).canonical,'https://ifyoumind.com/');
});

test('sign-in, app and private report pages are noindex with no canonical',()=>{
  for(const url of ['/login','/register','/verify-email','/app','/app/decide','/app/pricing','/app/result/abc123','/app/growth']){
    const meta=pageMetaFor(url,pages);
    assert.equal(meta.robots,'noindex,nofollow',url);
    assert.equal(meta.canonical,null,url);
  }
});

test('public pages have unique titles and search-length descriptions',()=>{
  assert.equal(new Set(pages.map(page=>page.title)).size,pages.length);
  assert.equal(new Set(pages.map(page=>page.description)).size,pages.length);
  for(const page of pages){
    assert.ok(page.title.length<=60,`${page.path} title is ${page.title.length} chars`);
    assert.ok(page.description.length>=40&&page.description.length<=170,`${page.path} description is ${page.description.length} chars`);
  }
});

test('every public page is a real route and the sitemap lists exactly the public pages',()=>{
  const routes=read('src/app/app.routes.ts');
  for(const page of pages.filter(page=>page.path!=='/')){
    assert.match(routes,new RegExp(`path:'${page.path.slice(1)}'`),page.path);
  }
  const sitemap=buildSitemap('2026-01-01');
  const locs=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
  assert.deepEqual(locs,pages.map(page=>`${SITE_URL}${page.path}`));
});

test('the static index.html carries no canonical or og:url that would mislabel other routes',()=>{
  const html=read('src/index.html');
  assert.doesNotMatch(html,/rel="canonical"/);
  assert.doesNotMatch(html,/og:url/);
});
