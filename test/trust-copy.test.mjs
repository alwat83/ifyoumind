import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(file,import.meta.url),'utf8');

test('the result page no longer chooses a verdict by counting bullets', () => {
  const ts=read('../src/app/intelligence/market-report.component.ts');
  const html=read('../src/app/intelligence/market-report.component.html');
  assert.doesNotMatch(ts,/leans favorable|suggests caution|opportunities\.length|risks\.length/);
  assert.doesNotMatch(html,/Executive recommendation|What supports it|What gives us pause/);
  assert.match(html,/What the figures show/);
});

test('the $79 prompt comes after the comparison in the template', () => {
  const html=read('../src/app/intelligence/market-report.component.html');
  assert.ok(html.indexOf('id="comparison"')<html.indexOf('intent-prompt'));
  assert.ok(html.indexOf('id="recommendation"')<html.indexOf('intent-prompt'));
});

test('sign-up links its Terms and Privacy Policy; sign-in offers password recovery', () => {
  const register=read('../src/app/auth/register/register.component.html');
  assert.match(register,/routerLink="\/terms-of-conduct"[^>]*>Terms</);
  assert.match(register,/routerLink="\/privacy-policy"[^>]*>Privacy Policy</);
  const login=read('../src/app/auth/login/login.component.html');
  assert.match(login,/Forgot password\?/);
  const loginTs=read('../src/app/auth/login/login.component.ts');
  assert.match(loginTs,/sendPasswordResetEmail/);
});

test('marketing copy makes no uploaded-data claim the reports do not support', () => {
  const landing=read('../src/app/intelligence/public-landing.component.html');
  assert.doesNotMatch(landing,/your own data/i);
  assert.match(landing,/From the real sample report/);
  assert.doesNotMatch(landing,/about the same/i, 'small gaps are flagged as uncertain, never declared equal');
  assert.doesNotMatch(landing,/neighborhood|household signals/i, 'city-level data only; no household trend');
  const home=read('../src/app/intelligence/consumer-home.component.html');
  assert.match(home,/isn’t used in Decision Reports yet/);
});
