// Offline replay of an explicitly supplied public Google tag; no real collection.
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './analytics-activation-specs', testMatch: 'google-transport.spec.mjs',
  timeout: 45000, expect: { timeout: 15000 }, retries: 0, workers: 1,
  updateSnapshots: 'none', reporter: [['list']],
  outputDir: '../test-results/ga4-privacy-repair/browser',
  use: { ...(process.env.QA_BROWSER_CHANNEL ? { channel: process.env.QA_BROWSER_CHANNEL } : {}), serviceWorkers: 'block' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'narrow', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 568 } } },
  ],
});
