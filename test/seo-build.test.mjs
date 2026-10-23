import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { metadataHtml, buildSeo } = require('../scripts/build-seo.js');
const { buildSitemap } = require('../scripts/generate-sitemap.js');
const pages = require('../src/public-pages.json');
const shell = fs.readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');

test('built initial metadata is unique per public route, canonical and query-independent', () => {
  for (const page of pages) {
    const html = metadataHtml(shell, page);
    assert.ok(html.includes(`<title>${page.title}</title>`));
    assert.ok(html.includes(`href="https://ifyoumind.com${page.path}"`));
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.equal((html.match(/name="robots"/g) || []).length, 1);
    assert.match(html, /name="robots" content="index,follow"/);
    assert.equal((html.match(/application\/ld\+json/g) || []).length, page.path === '/' ? 1 : 0);
  }
});

test('private shell is noindex before JavaScript, with no public canonical, offers or inherited metadata', () => {
  const html = metadataHtml(metadataHtml(shell, pages[0]), null);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(html, /rel="canonical"|og:url|application\/ld\+json|Market analysis for your business plan/);
  assert.equal((html.match(/<title>/g) || []).length, 1);
});

test('build emits every public clean URL plus app shell and a non-SPA 404', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ifyoumind-seo-'));
  try {
    fs.writeFileSync(path.join(dir, 'index.html'), shell);
    buildSeo(dir);
    for (const page of pages) assert.ok(fs.existsSync(path.join(dir, page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`)));
    assert.match(fs.readFileSync(path.join(dir, 'app-shell.html'), 'utf8'), /noindex,nofollow/);
    const error = fs.readFileSync(path.join(dir, '404.html'), 'utf8');
    assert.match(error, /<h1>Page not found<\/h1>/);
    assert.doesNotMatch(error, /app-root|<script/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('sitemap dates reflect explicit content revisions, not the wall-clock build date', () => {
  assert.equal(buildSitemap('2026-01-01'), buildSitemap('2099-12-31'));
  for (const page of pages) {
    assert.match(page.updated, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(buildSitemap().includes(`<lastmod>${page.updated}</lastmod>`));
  }
});
