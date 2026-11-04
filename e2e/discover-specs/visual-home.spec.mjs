import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {homepageHeadingContrasts} from '../support/homepage-contrast.mjs';
const origin='http://127.0.0.1:4316';
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());});
async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);}
async function accessible(page){expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);}
test('visual homepage puts a real free example in the first screen',async({page},info)=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText(/Oh, that’s\s*what changed\./);
 const action=page.getByRole('link',{name:'Try a free example',exact:true});
 const bounds=await action.boundingBox();expect(bounds.y+bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
 await expect(page.locator('.hero-art img')).toBeVisible();expect(await page.locator('.hero-art img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await noOverflow(page);await accessible(page);const contrasts=await homepageHeadingContrasts(page);expect(contrasts).toHaveLength(8);for(const h of contrasts)expect(h.minimumRatio,h.text).toBeGreaterThanOrEqual(3);
 const targets=await page.locator('a,button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&n.getBoundingClientRect().y>=0).map(n=>({name:n.textContent.trim(),height:n.getBoundingClientRect().height})));expect(targets.filter(t=>t.height<44)).toEqual([]);
 await page.screenshot({path:info.outputPath('home-fold.png'),scale:'css'});await page.screenshot({path:info.outputPath('home-full.png'),fullPage:true,scale:'css'});
 await action.click();await expect(page.locator('.finding')).toHaveCount(5);await expect(page.getByRole('heading',{name:'Your total rose by $25.20.',exact:true})).toBeVisible();await noOverflow(page);
});
test('keyboard preview selection opens the matching real tax findings',async({page},info)=>{
 await page.goto('/');const button=page.getByRole('button',{name:'Property tax',exact:true});await button.focus();await page.keyboard.press('Space');await expect(button).toBeFocused();await expect(button).toHaveAttribute('aria-pressed','true');await expect(page.locator('.peek-card')).toContainText('$420');await expect(page.locator('.peek-card')).toContainText('$240');await expect(page.locator('.peek-card')).toContainText('Made-up example');await expect(page.getByRole('link',{name:'Explore this example'})).toHaveAttribute('href','/discover/?example=tax');await noOverflow(page);await accessible(page);await page.screenshot({path:info.outputPath('home-tax.png'),fullPage:true,scale:'css'});
 await page.getByRole('link',{name:'Explore this example'}).click();await expect(page.locator('.finding')).toHaveCount(3);await page.locator('.finding summary').first().click();await expect(page.getByRole('table')).toContainText('4200.00');await expect(page.getByRole('table')).toContainText('4620.00');await noOverflow(page);await accessible(page);await page.screenshot({path:info.outputPath('tax-evidence.png'),fullPage:true,scale:'css'});
 await page.getByRole('button',{name:'Clear & choose another',exact:true}).click();await expect(page.locator('.finding')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Electricity bill discovery',exact:true})).toBeVisible();
});
test('only allowlisted synthetic examples auto-open; discovery stays private and works offline',async({page,context},info)=>{
 await page.goto('/discover/?example=unknown&file=private.csv');await expect(page.locator('.finding')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Property tax discovery',exact:true})).toBeVisible();await noOverflow(page);await accessible(page);await page.screenshot({path:info.outputPath('discovery-entry.png'),fullPage:true,scale:'css'});
 await page.goto('/discover/?example=electricity');await expect(page.locator('.finding')).toHaveCount(5);await context.setOffline(true);await page.locator('.finding summary').first().click();await expect(page.getByRole('table')).toContainText('145.20');await noOverflow(page);await accessible(page);
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);expect(await page.evaluate(()=>Object.keys(sessionStorage))).toEqual([]);await page.getByRole('button',{name:'Clear & choose another',exact:true}).click();await page.getByRole('button',{name:'Try property tax example',exact:true}).click();await expect(page.locator('.finding')).toHaveCount(3);await context.setOffline(false);
});
test('Business remains a separate optional paid path with preserved prices and intent',async({page})=>{
 await page.goto('/');await expect(page.locator('#pricing')).toContainText('Bill discovery is free. Business reports are optional.');await expect(page.locator('#pricing')).toContainText('$79');await expect(page.locator('#pricing')).toContainText('$39');await expect(page.locator('#pricing')).toContainText('Five full reports each month');await expect(page.getByRole('link',{name:'See a Business sample',exact:true})).toHaveAttribute('href','/sample-report');await expect(page.locator('#pricing').getByRole('link',{name:/Business brief/})).toHaveAttribute('href','/register');await expect(page.locator('#pricing').getByRole('link',{name:/Business Pro/})).toHaveAttribute('href','/register');await page.locator('#pricing').getByRole('link',{name:/Decision Report/}).click();await expect(page).toHaveURL(/\/register\?intent=report$/);await expect(page.getByLabel('Email',{exact:true})).toBeVisible();
});
test('reduced motion is honored and preview state resets on reload',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'Property tax',exact:true}).click();expect(await page.locator('.hero .primary').evaluate(n=>getComputedStyle(n).transitionDuration)).toBe('0s');await page.reload();await expect(page.getByRole('button',{name:'Electricity',exact:true})).toHaveAttribute('aria-pressed','true');await noOverflow(page);
});
