import { fileURLToPath } from 'node:url';
import { expect, expectNoHorizontalScroll, test } from '../support/test.mjs';
import { registerVisualJourneys } from '../support/visual-journeys.mjs';

// Functional readiness only. Never reads, writes, approves or substitutes pixel baselines.
const stylePath = fileURLToPath(new URL('../support/visual-identity.css', import.meta.url));
registerVisualJourneys(async (page, name, ready, options = {}) => {
  await expect(ready).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const info = test.info();
  const path = info.outputPath('readiness-only', `${name}-${process.platform}.png`);
  await page.screenshot({ path, animations: 'disabled', caret: 'hide', scale: 'css', stylePath, ...options });
  await info.attach(`${name}-readiness-only`, { path, contentType: 'image/png' });
}, 'readiness only, not pixel approval: ');
