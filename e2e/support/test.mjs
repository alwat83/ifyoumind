// Shared Playwright test with fixture lifecycle, console-error capture and helpers.
import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cleanupFixture, cleanupFixtureByEmail, createFixture, isFixtureEmail } from './fixtures.mjs';

export { expect };

/**
 * Hosts the production app also contacts, stubbed so runs don't depend on the network:
 * Google Fonts, and the Google API loader Firebase Auth fetches for its sign-in iframe on mobile.
 */
const STUBBED_HOSTS = { 'fonts.googleapis.com': 'text/css', 'fonts.gstatic.com': 'font/woff2' };
/** Blocked but expected: Firebase Auth preloads this on mobile and carries on without it. */
const EXPECTED_BLOCKED_HOSTS = new Set(['apis.google.com']);

/**
 * Keeps a browser context on the local machine: fonts get an empty response, and any other
 * external request (analytics, Stripe, Google) is blocked and recorded so the test can fail on it.
 */
export async function isolate(context) {
  const external = [];
  await context.route(url => !['127.0.0.1', 'localhost'].includes(url.hostname), route => {
    const host = new URL(route.request().url()).hostname;
    if (STUBBED_HOSTS[host]) return route.fulfill({ status: 200, contentType: STUBBED_HOSTS[host], body: '' });
    if (!EXPECTED_BLOCKED_HOSTS.has(host)) external.push(route.request().url());
    return route.abort('blockedbyclient');
  });
  context.externalRequests = external;
  return context;
}

export async function newIsolatedContext(browser) {
  return isolate(await browser.newContext());
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await isolate(context);
    await use(context);
    expect(context.externalRequests, 'requests outside the local emulator stack').toEqual([]);
  },

  /** Console errors and uncaught exceptions; a test fails if any appear that it didn't expect. */
  consoleErrors: [async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const source = message.location()?.url || '';
      if ([...EXPECTED_BLOCKED_HOSTS].some(host => source.includes(host)) ||
          (/ERR_BLOCKED_BY_CLIENT/.test(message.text()) && !source.startsWith('http://127.0.0.1'))) return;
      errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    errors.allow = [];
    await use(errors);
    const unexpected = errors.filter(text => typeof text === 'string' && !errors.allow.some(pattern => pattern.test(text)));
    if (unexpected.length) testInfo.annotations.push({ type: 'console-errors', description: unexpected.join('\n') });
    expect(unexpected, 'unexpected console errors').toEqual([]);
  }, { auto: true }],

  /** Creates fixtures for this test only and always removes them, even when the test fails. */
  fixtures: async ({}, use) => {
    const created = [];
    const make = async (id, options) => {
      const fixture = await createFixture(id, options);
      created.push(fixture);
      return fixture;
    };
    make.track = account => { created.push(account); return account; };
    /** For accounts the browser creates: cleaned up by address even if the test fails midway. */
    make.trackEmail = email => { created.push({ email, byEmail: true }); };
    await use(make);
    for (const fixture of created.reverse()) {
      if (fixture.byEmail) await cleanupFixtureByEmail(fixture.email);
      else if (fixture.uid && isFixtureEmail(fixture.email)) await cleanupFixture(fixture);
    }
  },
});

export async function signInThroughUi(page, fixture, path = '/login') {
  await page.goto(path);
  await page.getByLabel('Email').fill(fixture.email);
  await page.getByLabel('Password').fill(fixture.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

/** Serious and critical axe violations only; the list goes into the failure message. */
export async function expectAccessible(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  expect(serious.map(v => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`)).toEqual([]);
}

export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

export function pathOf(page) {
  const url = new URL(page.url());
  return url.pathname + url.search;
}
