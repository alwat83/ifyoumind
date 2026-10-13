import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const {loadGuides}=require('../scripts/guides.js');
const {guidePage,indexPage}=require('../scripts/build-guides.js');
const {sitemapEntries}=require('../scripts/generate-sitemap.js');
const guides=loadGuides();

test('there is at least one guide and every guide has complete, search-length metadata',()=>{
  assert.ok(guides.length>=1);
  for(const guide of guides){
    assert.ok(guide.seoTitle.length<=65,`${guide.slug} seoTitle is ${guide.seoTitle.length} chars`);
    assert.ok(guide.description.length>=70&&guide.description.length<=170,`${guide.slug} description is ${guide.description.length} chars`);
    assert.match(guide.published,/^\d{4}-\d{2}-\d{2}$/);
    assert.match(guide.updated,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(guide.updated>=guide.published);
  }
});

test('each guide page is self-canonical, indexable and links to the sample report',()=>{
  for(const guide of guides){
    const html=guidePage(guide);
    const canonical=`https://ifyoumind.com/guides/${guide.slug}/`;
    assert.match(html,new RegExp(`<link rel="canonical" href="${canonical}">`));
    assert.match(html,new RegExp(`<meta property="og:url" content="${canonical}">`));
    assert.match(html,/<meta name="robots" content="index,follow">/);
    assert.match(html,/<html lang="en">/);
    assert.equal((html.match(/<h1>/g)||[]).length,1,'exactly one h1');
    assert.match(html,/href="\/sample-report"/);
    assert.match(html,/href="#content"/,'skip link');
    assert.match(html,/"@type":"Article"/);
  }
});

test('guide tables are labelled, scrollable regions with column headers',()=>{
  for(const guide of guides){
    const html=guidePage(guide);
    const tables=(html.match(/<table>/g)||[]).length;
    assert.equal((html.match(/class="table-wrap" role="region" tabindex="0" aria-label=/g)||[]).length,tables);
    assert.doesNotMatch(html,/<th>/,'every th has a scope');
    assert.doesNotMatch(html,/type="checkbox"/,'no unlabelled checkboxes');
  }
});

test('external links are marked noopener and nothing links to an unknown internal path',()=>{
  const known=new Set(['/','/register','/sample-report','/privacy-policy','/terms-of-conduct','/guides/',...guides.map(g=>g.path)]);
  for(const guide of guides){
    const html=guidePage(guide);
    for(const [,href] of html.matchAll(/href="(\/[^"#]*)"/g)){
      if(href.startsWith('/guides/guide.css')||href==='/favicon.png'||href==='/apple-touch-icon.png')continue;
      assert.ok(known.has(href),`${guide.slug} links to unknown ${href}`);
    }
    for(const [tag] of html.matchAll(/<a href="https?:\/\/[^"]+"[^>]*>/g)){
      assert.match(tag,/rel="noopener"/,tag);
    }
  }
});

test('the guides index lists every guide and the sitemap includes the index and each guide',()=>{
  const html=indexPage(guides);
  for(const guide of guides)assert.match(html,new RegExp(`href="${guide.path}"`));
  const paths=sitemapEntries('2026-01-01').map(entry=>entry.path);
  assert.ok(paths.includes('/guides/'));
  for(const guide of guides)assert.ok(paths.includes(guide.path),guide.path);
});
