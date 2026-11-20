import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const origin='http://127.0.0.1:4316';
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());});
test('actual Hosting serves prefixed assets, privacy headers, canonical and honest 404s',async({page,request})=>{
 const redirect=await request.get('/discover',{maxRedirects:0});expect(redirect.status()).toBe(301);expect(redirect.headers().location).toBe('/discover/');
 const response=await page.goto('/discover/');expect(response.status()).toBe(200);expect(response.headers()['content-security-policy']).toContain("connect-src 'none'");expect(response.headers()['x-robots-tag']).toContain('noindex');expect(response.headers()['cache-control']).toContain('no-store');expect(response.headers()['referrer-policy']).toBe('no-referrer');
 await expect(page.getByRole('heading',{name:'What changed in the example?',exact:true})).toBeVisible();await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href','https://ifyoumind.com/discover/');await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex,nofollow');
 for(const src of await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')))){expect(src).toMatch(/^\/discover\//);const r=await request.get(src);expect(r.status()).toBe(200);expect(r.headers()['content-type']).toContain('javascript');}
 for(const path of ['/discover/not-real','/discover/private.csv','/not-a-real-page'])expect((await request.get(path)).status()).toBe(404);
 expect((await (await request.get('/sitemap.xml')).text())).not.toContain('/discover');await expect(page.locator('body')).not.toContainText('Local founder review');
});

test('Hosting serves canonical and bookmarked consumer routes through the existing private entry', async ({ page, request }) => {
 for (const path of ['/decisions', '/decisions/saved_example', '/decide', '/account', '/data', '/ask', '/advanced', '/growth',
   '/app', '/app/result/saved_example', '/app/pricing?offer=report&projectId=saved_example', '/app/account']) {
   const response = await request.get(path);
   expect(response.status(), path).toBe(200);
   const html = await response.text();
   expect(html, path).toContain('name="robots" content="noindex,nofollow"');
   expect(html, path).not.toContain('rel="canonical"');
 }
 for (const path of ['/app/unknown', '/decisions/wrong/path', '/pricing/extra']) {
   expect((await request.get(path)).status(), path).toBe(404);
 }
 await page.goto('/app/decide?type=compare&intent=report');
 await expect(page).toHaveURL(/\/login\?returnUrl=/);
 expect(new URL(page.url()).searchParams.get('returnUrl')).toBe('/decide?type=compare&intent=report');
});

test('visitors can read prices and choose a free example without requesting private billing', async ({ page }, info) => {
 const backendRequests = [];
 page.on('request', request => {
   if (request.method() !== 'GET' && request.method() !== 'HEAD') backendRequests.push(request.url());
 });
 await page.goto('/pricing?checkout=success&offer=report&projectId=private-test-marker');
 await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ifyoumind.com/pricing');
 await expect(page.getByRole('heading', { name: 'One-time Decision Report' })).toBeVisible();
 await expect(page.locator('.plans')).toContainText('$79');
 await expect(page.locator('.plans')).toContainText('$0');
 await expect(page.getByRole('button', { name: /Buy Decision Report|Choose Starter|Choose Plus/ })).toHaveCount(0);
 await expect(page.locator('body')).not.toContainText('private-test-marker');
 await expect(page.locator('body')).not.toContainText('Your payment is complete');
 await expect(page.getByRole('link', { name: 'Account', exact: true })).toHaveCount(0);
 const monthly = page.locator('.monthly-preview');
 await monthly.locator('summary').focus();
 await page.keyboard.press('Enter');
 await expect(monthly).toContainText('Starter · $4.99/month');
 await expect(monthly).toContainText('Plus · $9.99/month');
 await expect(monthly).toContainText('New enrollment is closed');
 await expect(monthly).toContainText('Unused credits expire');
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);
 expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
 await page.screenshot({ path: info.outputPath('public-pricing.png'), fullPage: true, scale: 'css' });
 expect(backendRequests).toEqual([]);
 await page.getByRole('link', { name: 'Try a free example' }).click();
 await expect(page.locator('.finding')).toHaveCount(3);
});
test('homepage navigation opens discovery without signup; home return clears the journey',async({page},info)=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText('Find the story.Make your move.');const link=page.getByRole('link',{name:/Understand Your Bills/});await expect(link).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);await page.screenshot({path:info.outputPath('home-navigation.png'),fullPage:true,scale:'css'});await link.click();await expect(page).toHaveURL(origin+'/discover/');await page.getByRole('button',{name:'Try property tax example',exact:true}).click();await expect(page.locator('.finding')).toHaveCount(3);await page.getByRole('link',{name:'ifYouMind home',exact:true}).click();await expect(page).toHaveURL(origin+'/');await page.goBack();await expect(page.locator('.finding')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Why did the electricity bill go up?',exact:true})).toBeVisible();
});
test('public discovery works offline after load and retains keyboard evidence access',async({page,context},info)=>{
 await page.goto('/discover/');await expect(page.getByRole('button',{name:'Try electricity example',exact:true})).toBeVisible();await context.setOffline(true);await page.getByRole('button',{name:'Try electricity example',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('.finding')).toHaveCount(5);await page.locator('.finding summary').first().focus();await page.keyboard.press('Enter');await expect(page.getByRole('table')).toBeVisible();await page.screenshot({path:info.outputPath('electricity-offline-evidence.png'),fullPage:true,scale:'css'});await page.getByRole('button',{name:'Clear & choose another',exact:true}).click();await page.getByRole('button',{name:'Try property tax example',exact:true}).click();await expect(page.locator('.finding')).toHaveCount(3);await context.setOffline(false);
});
test('public navigation and Business registration presentation remain reachable',async({page,request})=>{
 await page.goto('/discover/');expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()).violations).toEqual([]);await expect(page.getByRole('link',{name:'Business sample report',exact:true})).toHaveAttribute('href','/sample-report');await expect(page.getByRole('link',{name:'Privacy policy',exact:true})).toHaveAttribute('href','/privacy-policy');
 for(const path of ['/register','/login','/sample-report','/guides/'])expect((await request.get(path)).status()).toBe(200);
 await page.goto('/register');await expect(page.getByRole('heading',{name:'Build your market analysis.'})).toBeVisible();await expect(page.getByRole('textbox',{name:'Email',exact:true})).toBeVisible();
 await page.goto('/privacy-policy');await expect(page.getByRole('heading',{name:'Browser-local bill discovery'})).toBeVisible();await expect(page.locator('body')).toContainText('separately from registered Business');
 await page.goto('/');await expect(page.locator('.site-footer').getByRole('link',{name:'Pricing',exact:true})).toHaveAttribute('href','/pricing');
});

test('a first-time visitor sees a qualified property-tax answer before any input', async ({ page, context }) => {
 await page.goto('/discover/');
 await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose a bill.');
 const tax = page.getByRole('article', { name: 'What changed in the example?' });
 await expect(tax).toContainText('Made-up example');
 await expect(tax).toContainText('The bill went up by $420.00');
 await expect(tax).toContainText('School tax accounted for $240.00 of the increase.');
 await expect(tax).toContainText('Two bills alone can’t tell you whether you paid too much.');
 await expect(tax).toContainText('assessment notice and exemptions');
 await expect(tax).toContainText('No account needed');
 await expect(page.getByRole('textbox')).toHaveCount(0);
 await expect(page.getByRole('main').getByRole('link', { name: /sign up|sign in|checkout/i })).toHaveCount(0);
 const primary = tax.getByRole('button', { name: 'Try property tax example' });
 await expect(primary).toBeInViewport({ ratio: 1 });

 const requests = [];
 page.on('request', request => requests.push(request.url()));
 await context.setOffline(true);
 await primary.focus();
 await page.keyboard.press('Enter');
 await expect(page.getByText('Example data—not your taxes.')).toBeVisible();
 await expect(page.getByRole('table')).toHaveCount(0);
 const finding = page.locator('.finding').first();
 await finding.locator('summary').focus();
 await page.keyboard.press('Enter');
 await expect(finding.getByRole('table')).toBeVisible();
 await expect(finding).toContainText('$4,620.00 − $4,200.00 = +$420.00');
 await expect(finding.getByRole('row', { name: /E2/ })).toContainText('4200.00');
 await page.getByRole('button', { name: 'Clear & choose another' }).click();
 await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
 await expect(page.getByRole('status')).toContainText('Data cleared');
 await expect(page.getByRole('table')).toHaveCount(0);
 await expect(page.getByRole('button', { name: 'Try electricity example' })).toBeVisible();
 await context.setOffline(false);
 expect(requests).toEqual([]);
 expect(await page.evaluate(async () => [localStorage.length, sessionStorage.length, document.cookie, (await indexedDB.databases()).length])).toEqual([0, 0, '', 0]);
});

test('a returning visitor can go back to the same public example after inspecting a bill', async ({ page }) => {
 await page.goto('/');
 const examples = page.getByRole('group', { name: 'Choose an example' });
 await examples.getByRole('button', { name: 'Electricity bills' }).click();
 await page.getByRole('link', { name: 'Explore the electricity example' }).click();
 await expect(page.locator('.finding')).toHaveCount(5);
 const back = page.getByRole('link', { name: 'Back to examples' });
 await expect(back).toHaveAttribute('href', '/?example=electricity#business');
 await back.focus();
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\?example=electricity#business$/);
 await expect(examples.getByRole('button', { name: 'Electricity bills', pressed: true })).toBeVisible();
 await expect(page.locator('#business .finding')).toContainText('+21%');
 await page.reload();
 await expect(examples.getByRole('button', { name: 'Electricity bills', pressed: true })).toBeVisible();

 await page.goto('/discover/');
 await page.getByRole('button', { name: 'Use a property tax CSV' }).click();
 await page.getByLabel('Choose a redacted CSV').setInputFiles({
   name: 'private-test-marker.csv',
   mimeType: 'text/csv',
   buffer: Buffer.from('tax_year,county_usd,school_usd,municipal_usd,total_usd\n2024,900.37,2400,900,4200.37\n2025,990,2640,990,4620\n'),
 });
 await expect(page.getByRole('heading', { name: 'Your total rose by $419.63.' })).toBeVisible();
 await page.getByRole('link', { name: 'Back to examples' }).click();
 await expect(page).toHaveURL(origin + '/?example=tax#business');
 await expect(examples.getByRole('button', { name: 'Property taxes', pressed: true })).toBeVisible();
 await page.goBack();
 await expect(page.locator('.finding')).toHaveCount(0);
 await expect(page.getByRole('heading', { name: 'What changed in the example?' })).toBeVisible();

 await page.goto('/?example=private-input-not-an-example#business');
 await expect(examples.getByRole('button', { name: 'Property taxes', pressed: true })).toBeVisible();
});

test('discovery uses the shared local display font and preserves keyboard focus in reduced motion', async ({ page }) => {
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await page.goto('/discover/');
 await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /Inter|Arial/);
 expect(await page.evaluate(async () => {
   const faces = await document.fonts.load('44px "Instrument Serif"');
   return faces.some(face => face.status === 'loaded');
 })).toBe(true);
 await page.keyboard.press('Tab');
 await expect(page.getByRole('link', { name: 'Skip to discovery' })).toBeFocused();
 const example = page.getByRole('button', { name: 'Try property tax example' });
 await example.focus();
 await expect(example).toHaveCSS('outline-style', 'solid');
 await page.keyboard.press('Enter');
 const evidence = page.locator('.finding summary').first();
 await expect(evidence).toBeVisible();
 await evidence.focus();
 await page.keyboard.press('Enter');
 await expect(page.getByRole('table').first()).toBeVisible();
});

test('the static 404 keeps its status and offers accessible recovery on Hosting', async ({ page }) => {
 const response = await page.goto('/missing-visual-fixture');
 expect(response.status()).toBe(404);
 await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCSS('font-family', /Inter|Arial/);
 await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,nofollow');
 await expect(page.locator('script')).toHaveCount(0);
 expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
 const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
 expect(scan.violations).toEqual([]);
 await page.keyboard.press('Tab');
 await expect(page.getByRole('link', { name: 'ifYouMind home' })).toBeFocused();
 await page.keyboard.press('Tab');
 const home = page.getByRole('link', { name: 'Home', exact: true });
 await expect(home).toBeFocused();
 await expect(home).toHaveCSS('outline-style', 'solid');
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(origin + '/');
});
