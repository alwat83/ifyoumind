import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, expectNoHorizontalScroll, test } from '../support/test.mjs';
import { registerVisualJourneys } from '../support/visual-journeys.mjs';

const captureStyle = fileURLToPath(new URL('../support/visual-identity.css', import.meta.url));

test.skip(process.platform !== 'linux', 'Reviewed pixel baselines use the Linux Playwright renderer.');

async function compare(page, name, ready, options = {}) {
  await expect(ready).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const info = test.info();
  const filename = `${name}.png`;
  const settings = { animations: 'disabled', caret: 'hide', scale: 'css', stylePath: captureStyle, ...options };
  if (!existsSync(info.snapshotPath(filename, { kind: 'screenshot' }))) {
    // A missing image fails the check. Attach the candidate for human review without
    // treating the screenshot taken by this run as a baseline.
    const path = info.outputPath('baseline-candidates', `${name}-${info.project.name}-${process.platform}.png`);
    await page.screenshot({ ...settings, path, style: readFileSync(captureStyle, 'utf8') });
    await info.attach(`${name}-candidate`, { path, contentType: 'image/png' });
  }
  await expect.soft(page).toHaveScreenshot(filename, { ...settings, maxDiffPixelRatio: 0.002 });
}

registerVisualJourneys(compare);
