import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';
import { homepageHeadingContrasts } from '../support/homepage-contrast.mjs';

test('homepage: consumer discovery opens real free experiences and keeps upcoming tools gated', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Big decisions deserve better answers.');
  const explore = page.getByRole('link', { name: 'Explore my decision' });
  await explore.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#decide$/);
  const detail = page.locator('#decision-detail');
  for (const [choice, available, limitation, path] of [
    ['Move somewhere new', 'Free relocation checklist', 'Personal relocation calculations are in development', '/guides/compare-job-offers-relocation/'],
    ['Choose between job offers', 'Free job-offer checklist', 'Automated job-offer comparisons are in development', '/guides/compare-job-offers-relocation/'],
    ['Explore a business opportunity', 'Free Business Decision Brief', 'Free account required; no credit card', '/register'],
    ['Make sense of other options', 'Free comparison framework', 'Data uploads and flexible automated analysis are in development', '/guides/compare-options-with-your-own-data/'],
  ]) {
    const button = page.getByRole('button', { name: new RegExp(choice) });
    await button.focus();
    await page.keyboard.press('Space');
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.decision-choices [aria-pressed="true"]')).toHaveCount(1);
    await expect(detail).toHaveAttribute('aria-live', 'polite');
    await expect(detail).toContainText(available);
    await expect(detail).toContainText(limitation);
    await expect(detail.getByRole('link')).toHaveAttribute('href', path);
    await expectNoHorizontalScroll(page);
    const violations = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(violations.violations.map(item => item.id)).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`discovery-${choice.split(' ')[0].toLowerCase()}.png`), fullPage: true, scale: 'css' });
  }
  await expect(page.locator('a[href*="/life/quick-compare"], input, textarea')).toHaveCount(0);
  await expect(page.locator('.discovery-note')).toContainText('not submitted or saved');
  await detail.getByRole('link').click();
  await expect(page).toHaveURL(/\/guides\/compare-options-with-your-own-data\/$/);
  await expect(page.locator('.prose')).toContainText('in development');
  await page.goto('/');
  const headings = await homepageHeadingContrasts(page);
  expect(headings).toHaveLength(8);
  for (const heading of headings) {
    expect(heading.fontSize, heading.text).toBeGreaterThanOrEqual(24);
    expect(heading.minimumRatio, `${heading.text}: ${heading.color} on ${heading.background}`).toBeGreaterThanOrEqual(3);
  }
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: testInfo.outputPath('homepage-fold.png'), scale: 'css' });
  await page.screenshot({ path: testInfo.outputPath('homepage-full.png'), fullPage: true, scale: 'css' });
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 568 });
    for (const choice of ['Move somewhere new', 'Choose between job offers', 'Explore a business opportunity', 'Make sense of other options']) {
      await page.getByRole('button', { name: new RegExp(choice) }).click();
      await expectNoHorizontalScroll(page);
    }
    const targets = await page.locator('a,button').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => ({ name: node.textContent.trim(), height: node.getBoundingClientRect().height })));
    expect(targets.filter(target => target.height < 44), 'mobile interactive target heights').toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('homepage-320.png'), fullPage: true, scale: 'css' });
  }
});

test('homepage: sample, Business prices, paid intent and registration remain usable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'View a sample report' }).click();
  await expect(page).toHaveURL(/\/sample-report$/);
  // Review the actual answer before leaving; a hard page.goto during the callable aborts it.
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
  await page.goto('/');
  await page.getByRole('button', { name: /Explore a business opportunity/ }).click();
  await page.getByRole('link', { name: 'Start a free Business brief' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page.locator('#pricing')).toContainText('$79');
  await expect(page.locator('#pricing')).toContainText('$39');
  await expect(page.locator('#pricing')).toContainText('Five full Decision Reports a month');
  await expect(page.getByRole('link', { name: 'Build a report', exact: true })).toHaveAttribute('href', '/register?intent=report');
  await expect(page.getByRole('link', { name: 'Create an account for Pro' })).toHaveAttribute('href', '/register');
  await page.getByRole('link', { name: 'Build a report', exact: true }).click();
  await expect(page).toHaveURL(/\/register\?intent=report$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('homepage respects reduced motion and keeps discovery in page memory only', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /Choose between job offers/ }).click();
  await expect(page.locator('#decision-detail')).toContainText('Free job-offer checklist');
  expect(await page.locator('.hero .primary').evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await page.reload();
  await expect(page.getByRole('button', { name: /Move somewhere new/ })).toHaveAttribute('aria-pressed', 'true');
  await expectAccessible(page);
});
