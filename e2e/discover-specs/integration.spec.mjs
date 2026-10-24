import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const origin='http://127.0.0.1:4316';
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());});
test('actual Hosting serves prefixed assets, privacy headers, canonical and honest 404s',async({page,request})=>{
 const redirect=await request.get('/discover',{maxRedirects:0});expect(redirect.status()).toBe(301);expect(redirect.headers().location).toBe('/discover/');
 const response=await page.goto('/discover/');expect(response.status()).toBe(200);expect(response.headers()['content-security-policy']).toContain("connect-src 'none'");expect(response.headers()['x-robots-tag']).toContain('noindex');expect(response.headers()['cache-control']).toContain('no-store');expect(response.headers()['referrer-policy']).toBe('no-referrer');
 await expect(page.getByRole('heading',{name:'Property tax discovery',exact:true})).toBeVisible();await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://ifyoumind.com/discover/');await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex,nofollow');
 for(const src of await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')))){expect(src).toMatch(/^\/discover\//);const r=await request.get(src);expect(r.status()).toBe(200);expect(r.headers()['content-type']).toContain('javascript');}
 for(const path of ['/discover/not-real','/discover/private.csv','/not-a-real-page'])expect((await request.get(path)).status()).toBe(404);
 expect((await (await request.get('/sitemap.xml')).text())).not.toContain('/discover');await expect(page.locator('body')).not.toContainText('Local founder review');
});
test('homepage navigation opens discovery without signup; home return clears the journey',async({page},info)=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Big decisions');const link=page.getByRole('link',{name:'Try discovery',exact:true});await expect(link).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);await page.screenshot({path:info.outputPath('home-navigation.png'),fullPage:true,scale:'css'});await link.click();await expect(page).toHaveURL(origin+'/discover/');await page.getByRole('button',{name:'Try property tax example',exact:true}).click();await expect(page.locator('.finding')).toHaveCount(3);await page.getByRole('link',{name:'ifYouMind home',exact:true}).click();await expect(page).toHaveURL(origin+'/');await page.goBack();await expect(page.locator('.finding')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Electricity bill discovery',exact:true})).toBeVisible();
});
test('public discovery works offline after load and retains keyboard evidence access',async({page,context},info)=>{
 await page.goto('/discover/');await expect(page.getByRole('button',{name:'Try electricity example',exact:true})).toBeVisible();await context.setOffline(true);await page.getByRole('button',{name:'Try electricity example',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('.finding')).toHaveCount(5);await page.locator('.finding summary').first().focus();await page.keyboard.press('Enter');await expect(page.getByRole('table')).toBeVisible();await page.screenshot({path:info.outputPath('electricity-offline-evidence.png'),fullPage:true,scale:'css'});await page.getByRole('button',{name:'Clear & choose another',exact:true}).click();await page.getByRole('button',{name:'Try property tax example',exact:true}).click();await expect(page.locator('.finding')).toHaveCount(3);await context.setOffline(false);
});
test('public navigation and Business registration presentation remain reachable',async({page,request})=>{
 await page.goto('/discover/');expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);await expect(page.getByRole('link',{name:'Business sample report',exact:true})).toHaveAttribute('href','/sample-report');await expect(page.getByRole('link',{name:'Privacy policy',exact:true})).toHaveAttribute('href','/privacy-policy');
 for(const path of ['/register','/login','/sample-report','/guides/'])expect((await request.get(path)).status()).toBe(200);
 await page.goto('/register');await expect(page.getByRole('heading',{name:'Build your market analysis.'})).toBeVisible();await expect(page.getByRole('textbox',{name:'Email',exact:true})).toBeVisible();
 await page.goto('/privacy-policy');await expect(page.getByRole('heading',{name:'Browser-local bill discovery'})).toBeVisible();await expect(page.locator('body')).toContainText('separately from registered Business');
 await page.goto('/');await expect(page.locator('body')).toContainText('$79');await expect(page.locator('body')).toContainText('$39');
});
