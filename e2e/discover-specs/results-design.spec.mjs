import {test,expect} from '@playwright/test';
const origin='http://127.0.0.1:4316';
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).origin===origin&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());});

test('a finding leads directly to its source without an extra navigation step',async({page})=>{
 for(const [category,count,before,after] of [['tax',3,'4200.00','4620.00'],['electricity',5,'120.00','145.20']]){
  await page.goto('/discover/?example='+category);
  await expect(page.locator('.finding')).toHaveCount(count);
  await expect(page.locator('.provenance strong')).toHaveText('Made-up example');
  await expect(page.locator('.provenance')).toContainText('See the change. Check it.');
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

test('comparison spotlights open the exact finding and offer a keyboard return',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [category,total,label,value,title,cell,before,after] of [
  ['electricity','+21%','Energy used','+10%','You used 60 kWh more.','E','600','660'],
  ['tax','+$420.00','School','+$240.00','School changed the most.','C','2400.00','2640.00']
 ]){
  await page.goto('/discover/?example='+category);
  const pair=page.getByRole('group',{name:'Two views of these bills',exact:true});
  await expect(pair.locator('.spotlight-total')).toContainText(total);
  for(const value of await pair.locator('.spotlight-value').all()){
   const bounds=await value.boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
  }
  expect(await pair.evaluate(n=>getComputedStyle(n).animationName)).toBe('none');
  const explore=page.getByRole('button',{name:'See the numbers for '+label+': '+value,exact:true});
  await explore.focus();await page.keyboard.press('Enter');
  const heading=page.getByRole('heading',{name:title,exact:true});await expect(heading).toBeFocused();
  const card=page.locator('.finding').filter({has:heading});
  await expect(card.getByRole('table')).toBeVisible();
  await expect(card.getByRole('row',{name:new RegExp(cell+'2')})).toContainText(before);
  await expect(card.getByRole('row',{name:new RegExp(cell+'3')})).toContainText(after);
  await page.getByRole('button',{name:'Back to the big picture',exact:true}).click();
  await expect(page.locator('.finding h3').first()).toBeFocused();
  await page.getByRole('button',{name:'Clear & choose another',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Explore another finding'})).toHaveCount(0);
 }
});

test('a tied charge change keeps the original comparison instead of inventing a spotlight',async({page})=>{
 await page.goto('/discover/?example=tax');
 await page.getByRole('button',{name:'Review or correct data',exact:true}).click();
 for(const [name,value]of [['County','1000.00'],['School','2500.00'],['Municipal','900.00'],['Total billed','4400.00']])await page.getByRole('textbox',{name:'CSV row 3 '+name,exact:true}).fill(value);
 await expect(page.locator('.finding')).toHaveCount(0);
 await page.getByRole('button',{name:'Rerun discovery',exact:true}).click();
 await expect(page.getByRole('heading',{name:'There’s a tie for the biggest change.',exact:true})).toBeVisible();
 await expect(page.locator('.spotlight-pair')).toHaveCount(0);
 await expect(page.getByRole('figure',{name:'Total billed in USD',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Charge changes',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'There’s a tie for the biggest change.',exact:true})).toBeFocused();
});
