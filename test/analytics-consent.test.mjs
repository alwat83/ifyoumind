import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/app/analytics/analytics-consent.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {analyticsAllowed,ANALYTICS_GTAG_CONFIG,ANALYTICS_CONSENT_GRANTED,analyticsPagePath}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

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

test('Google signals and ad personalization are off in code',()=>{
  assert.equal(ANALYTICS_GTAG_CONFIG.allow_google_signals,false);
  assert.equal(ANALYTICS_GTAG_CONFIG.allow_ad_personalization_signals,false);
});

test('consent never grants advertising storage or signals',()=>{
  for(const key of ['ad_storage','ad_user_data','ad_personalization','personalization_storage'])assert.equal(ANALYTICS_CONSENT_GRANTED[key],'denied',key);
  assert.equal(ANALYTICS_CONSENT_GRANTED.analytics_storage,'granted');
  const cookieService=fs.readFileSync(new URL('../src/app/services/cookie.service.ts',import.meta.url),'utf8');
  assert.doesNotMatch(cookieService,/'ad_storage':\s*consent/);
  assert.match(cookieService,/'ad_user_data':\s*'denied'/);
  assert.match(cookieService,/'ad_personalization':\s*'denied'/);
});

test('analytics is configured without user-ID tracking and with the in-code settings',()=>{
  const config=fs.readFileSync(new URL('../src/app/app.config.ts',import.meta.url),'utf8');
  assert.doesNotMatch(config,/UserTrackingService/);
  assert.doesNotMatch(config,/ScreenTrackingService/);
  assert.equal(ANALYTICS_GTAG_CONFIG.send_page_view,false);
  assert.match(config,/initializeAnalytics\(getApp\(\), \{ config: \{ \.\.\.ANALYTICS_GTAG_CONFIG \} \}\)/);
});

test('only the five allowlisted funnel events are sent, without personal data parameters',async()=>{
  const {FUNNEL_EVENTS}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  assert.deepEqual([...FUNNEL_EVENTS],['cta_click','sample_report_view','sign_up','decision_created','checkout_started']);
  const sources=['src/app/intelligence/public-landing.component.ts','src/app/intelligence/market-report.component.ts','src/app/auth/register/register.component.ts','src/app/intelligence/decision-flow.component.ts','src/app/intelligence/pricing.component.ts']
    .map(file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8')).join('\n');
  const used=[...sources.matchAll(/funnel\.track\('([a-z_]+)'(.*)\);/g)];
  assert.ok(used.length>=6);
  for(const [,name,params] of used){
    assert.ok(FUNNEL_EVENTS.includes(name),name);
    assert.doesNotMatch(params,/\b(email|displayName|name|location|concept|decision|question)\s*:/i,`${name} params: ${params}`);
  }
});

test('page paths sent to GA4 drop query strings and private report ids',()=>{
  assert.equal(analyticsPagePath('/app/pricing?checkout=success&offer=report&projectId=abc123'),'/app/pricing');
  assert.equal(analyticsPagePath('/app/result/AbC123xyz'),'/app/result/:id');
  assert.equal(analyticsPagePath('/app/result/AbC123xyz?x=1#top'),'/app/result/:id');
  assert.equal(analyticsPagePath('/sample-report?utm_source=li'),'/sample-report');
  assert.equal(analyticsPagePath('/'),'/');
});
