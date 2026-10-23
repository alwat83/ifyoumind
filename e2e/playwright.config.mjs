// Authenticated browser QA against the Firebase emulators (demo-ifyoumind). Run: npm run test:e2e
// The app under test is the local build (`npm run build:local`), served from dist/ifyoumind-local.
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.QA_PORT || 4300);
process.env.QA_BASE_URL ||= `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './specs',
  globalSetup: './support/global-setup.mjs',
  globalTeardown: './support/global-teardown.mjs',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: '../playwright-report' }], ['junit', { outputFile: '../test-results/e2e-junit.xml' }]]
    : [['list']],
  outputDir: '../test-results/e2e',
  use: {
    baseURL: process.env.QA_BASE_URL,
    // Local machines may use installed Chrome; CI keeps its pinned Playwright Chromium.
    ...(process.env.QA_BROWSER_CHANNEL ? { channel: process.env.QA_BROWSER_CHANNEL } : {}),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `node e2e/support/static-server.mjs ${port}`,
    cwd: '..',
    url: process.env.QA_BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
