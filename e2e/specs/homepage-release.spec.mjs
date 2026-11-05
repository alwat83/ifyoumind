import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';
import { homepageHeadingContrasts } from '../support/homepage-contrast.mjs';

test('homepage: visual previews lead directly to working examples without signup', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Two bills\.\s*One clear story\./);
  const heroAction=page.getByRole('link',{name:'Try a free example',exact:true});
  expect((await heroAction.boundingBox()).y).toBeLessThan(page.viewportSize().height-50);
  for(const [name,path,number] of [['Electricity','electricity','+21'],['Property tax','tax','$420']]) {
    const button=page.getByRole('button',{name,exact:true});
    await button.focus();await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-pressed','true');
    await expect(button).toBeFocused();
    await expect(page.locator('.example-switch [aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('.peek-card')).toContainText('Made-up example');
    await expect(page.locator('.peek-card')).toContainText(number);
    await expect(page.getByRole('link',{name:'Explore this example'})).toHaveAttribute('href',`/discover/?example=${path}`);
    await expectNoHorizontalScroll(page);await expectAccessible(page);
  }
  const headings=await homepageHeadingContrasts(page);expect(headings).toHaveLength(8);
  for(const heading of headings)expect(heading.minimumRatio,heading.text).toBeGreaterThanOrEqual(3);
  await page.screenshot({path:info.outputPath('visual-home-full.png'),fullPage:true,scale:'css'});
  await page.getByRole('link',{name:'Explore this example'}).click();
  await expect(page.locator('.finding')).toHaveCount(3);
  await expect(page.getByRole('heading',{name:'Your total rose by $420.00.',exact:true})).toBeVisible();
});

test('homepage: sample, Business prices, paid intent and registration remain usable', async ({ page }) => {
  await page.goto('/');await page.getByRole('link',{name:'See a Business sample',exact:true}).click();
  await expect(page).toHaveURL(/\/sample-report$/);
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
  await page.goto('/');await expect(page.locator('#pricing')).toContainText('$79');
  await expect(page.locator('#pricing')).toContainText('$39');
  await expect(page.locator('#pricing')).toContainText('Five full reports each month');
  await expect(page.locator('#pricing').getByRole('link',{name:/Business Pro/})).toHaveAttribute('href','/register');
  await page.locator('#pricing').getByRole('link',{name:/Decision Report/}).click();
  await expect(page).toHaveURL(/\/register\?intent=report$/);
  await expect(page.getByLabel('Email',{exact:true})).toBeVisible();
  await page.goto('/');await page.locator('#pricing').getByRole('link',{name:/Business brief/}).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel('Email',{exact:true})).toBeVisible();
});

test('homepage respects reduced motion and keeps preview selection in page memory', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await page.getByRole('button',{name:'Property tax',exact:true}).click();
  expect(await page.locator('.hero .primary').evaluate(node=>getComputedStyle(node).transitionDuration)).toBe('0s');
  await page.reload();await expect(page.getByRole('button',{name:'Electricity',exact:true})).toHaveAttribute('aria-pressed','true');
  await expectAccessible(page);
});
