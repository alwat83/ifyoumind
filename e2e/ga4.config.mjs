import base from './playwright.config.mjs';
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({ ...base, timeout: 30000, testMatch: ['ga4.spec.mjs'], workers: 2, outputDir: '../test-results/ga4/browser', projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }, { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } }, { name: 'narrow', use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 568 } } }] });
