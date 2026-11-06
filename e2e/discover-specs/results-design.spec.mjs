import {test,expect} from '@playwright/test';
const origin='http://127.0.0.1:4316';
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).origin===origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());});

test('a finding leads directly to its source without an extra navigation step',async({page})=>{
 for(const [category,count,before,after] of [['tax',3,'4200.00','4620.00'],['electricity',5,'120.00','145.20']]){
  await page.goto('/discover/?example='+category);
  await expect(page.locator('.finding')).toHaveCount(count);
  await expect(page.locator('.provenance')).toHaveText('Made-up example');
  const finding=page.locator('.finding').first();
  const title=await finding.getByRole('heading').boundingBox();
  expect(title.y+title.height).toBeLessThanOrEqual(page.viewportSize().height);
  const source=finding.locator('summary');
  if(page.viewportSize().width>=390){
   const bounds=await source.boundingBox();
   expect(bounds.y+bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
  }
  await source.focus();await page.keyboard.press('Enter');
  await expect(finding.getByRole('table')).toBeVisible();
  await expect(finding.getByRole('table')).toContainText(before);
  await expect(finding.getByRole('table')).toContainText(after);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);
 }
});

test('correction opens at the editor and returns to still-valid findings',async({page})=>{
 await page.goto('/discover/?example=tax');await expect(page.locator('.finding')).toHaveCount(3);
 const review=page.getByRole('button',{name:'Review or correct data',exact:true});
 await review.click();
 const heading=page.getByRole('heading',{name:'Review or correct the two rows.',exact:true});
 await expect(heading).toBeFocused();
 const position=await heading.boundingBox();expect(position.y).toBeGreaterThanOrEqual(0);expect(position.y+position.height).toBeLessThanOrEqual(page.viewportSize().height);
 await page.getByRole('button',{name:'Back to findings',exact:true}).click();
 await expect(review).toBeFocused();await expect(review).toHaveAttribute('aria-expanded','false');
 await expect(page.locator('.finding')).toHaveCount(3);
 await review.click();await page.getByRole('textbox',{name:'CSV row 2 County',exact:true}).fill('1000.00');
 await expect(page.locator('.finding')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Back to findings',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Rerun discovery',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('do not add up');
});
