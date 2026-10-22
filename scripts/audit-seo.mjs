// Read-only raw/rendered SEO inventory. No account, form submission or consent interaction.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const base = process.argv[2] || 'https://ifyoumind.com';
const output = process.argv[3] || '/private/tmp/ifyoumind-seo-audit.json';
const paths = ['/', '/sample-report?utm_source=seo-audit', '/privacy-policy', '/terms-of-conduct', '/login', '/register?intent=report', '/app/result/seo-audit', '/guides/', '/guides/market-analysis-business-plan/', '/guides/compare-job-offers-relocation/', '/guides/choose-business-location-evidence/', '/guides/compare-options-with-your-own-data/', '/seo-audit-missing-page', '/life/quick-compare'];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const observations = [];
try {
  for (const javascript of [false, true]) {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ javaScriptEnabled: javascript, viewport: { width, height: 844 } });
      // Inspect a production build locally without invoking production Firebase or analytics.
      if (process.env.SEO_OFFLINE === '1') await context.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.origin === new URL(base).origin ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      for (const path of paths) {
        const response = await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
        const observed = await page.evaluate(() => ({
          url: location.href, title: document.title,
          description: document.querySelector('meta[name="description"]')?.content,
          robots: [...document.querySelectorAll('meta[name="robots"]')].map(el => el.content),
          canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map(el => el.href),
          ogUrl: document.querySelector('meta[property="og:url"]')?.content,
          twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content,
          schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => { try { return JSON.parse(el.textContent); } catch { return 'INVALID_JSON'; } }),
          h1: [...document.querySelectorAll('h1')].map(el => el.textContent),
          bodyCharacters: document.body.innerText.length,
          overflow: document.documentElement.scrollWidth - innerWidth,
        }));
        observations.push({ path, javascript, width, status: response.status(), ...observed });
      }
      await context.close();
    }
  }
  const request = await browser.newContext();
  const resources = [];
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    const response = await request.request.get(new URL(path, base).href);
    resources.push({ path, status: response.status(), body: await response.text() });
  }
  const www = base === 'https://ifyoumind.com' ? await request.request.get('https://www.ifyoumind.com/', { maxRedirects: 0 }) : null;
  const redirects = [];
  for (const path of ['/sample-report/', '/sample-report.html', '/guides', '/guides/market-analysis-business-plan']) {
    const response = await request.request.get(new URL(path, base).href, { maxRedirects: 0 });
    redirects.push({ path, status: response.status(), location: response.headers().location || null });
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ observedAt: new Date().toISOString(), base, externalRequestsBlocked: process.env.SEO_OFFLINE === '1', observations, resources, redirects, www: www ? { status: www.status(), location: www.headers().location || null } : null }, null, 2) + '\n');
  if (observations.some(row => row.path === '/' && row.status !== 200)) throw new Error('Homepage did not return 200; audit is invalid. Check the server/config path.');
  console.log(`Recorded ${observations.length} raw/rendered observations and ${resources.length} resources in ${output}`);
} finally { await browser.close(); }
