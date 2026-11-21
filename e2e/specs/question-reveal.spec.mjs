import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';

test('the question reveals an immediate supported answer in place, then evidence and private input', async ({ page }, info) => {
  for (const width of info.project.name === 'mobile' ? [320,390] : [820,1440]) {
    await page.setViewportSize({width,height:width===320?568:width===390?844:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/');await page.evaluate(()=>document.fonts.ready);
    const action=page.getByRole('button',{name:'Reveal what changed',exact:true});
    await expect(action).toBeInViewport({ratio:1});await expect(action).toHaveAttribute('aria-expanded','false');
    await expect(page.locator('.hero-label')).toContainText('Made-up figures');
    await expect(page.locator('.hero-entry')).toContainText('Compare U.S. cities');
    await expect(page.locator('.revealed-content')).toBeHidden();
    await expect(page.locator('.own-data')).toBeHidden();
    await expectNoHorizontalScroll(page);await expectAccessible(page);
    const url=page.url(),requests=[];page.on('request',r=>requests.push(r.url()));
    await action.focus();await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url);await expect(action).toHaveAttribute('aria-expanded','true');
    await expect(page.locator('#business')).toBeFocused();
    await expect(page.locator('.conclusion strong')).toHaveText('$420');
    await expect(page.locator('.conclusion strong')).toBeInViewport({ratio:1});
    await expect(page.locator('.finding-note')).toContainText('School taxes rose by $240');
    await expect(page.locator('.finding-note')).toContainText('can’t tell you whether you paid too much');
    await expect(page.locator('.revealed-content')).toHaveCSS('animation-name','none');
    await action.click();await expect(page.locator('#business')).toBeFocused();await expect(page.locator('.conclusion strong')).toHaveCount(1);
    const proof=page.locator('.home-evidence');await proof.locator('summary').focus();await page.keyboard.press('Enter');
    await expect(proof).toHaveAttribute('open','');await expect(proof).toContainText('57.1%');
    await expect(proof).toContainText('4200.00');await expect(proof).toContainText('4620.00');
    expect(await page.locator('.home-evidence').evaluate(node=>!!(node.compareDocumentPosition(document.querySelector('.own-information'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    expect(requests.filter(url=>/cloudfunctions|openai|stripe/i.test(url))).toEqual([]);
    await page.getByRole('link',{name:'Compare my tax CSV',exact:true}).click();
    await expect(page).toHaveURL(/\/discover\/\?example=tax&input=csv$/);
    await expect(page.getByLabel('Choose a redacted CSV',{exact:true})).toBeFocused();
    await expect(page.locator('.finding')).toHaveCount(0);await expectAccessible(page);
  }
});

test('public example deep links preserve category and safe recovery without another reveal',async({page})=>{
 for(const [query,expected]of[['?example=tax#business','$420'],['?example=electricity#business','+21%'],['?example=private-test-marker#business','$420']]){
  await page.goto('/'+query);await expect(page.locator('.revealed-content')).toBeVisible();
  await expect(page.locator('.conclusion strong')).toHaveText(expected);
  await expect(page.locator('body')).not.toContainText('private-test-marker');
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');await page.getByRole('button',{name:'Reveal what changed',exact:true}).click();
 await expect(page.locator('.revealed-content')).toHaveCSS('animation-duration','0.24s');
 await page.goto('/?example=cities#business');await expect(page.locator('.finding h2')).toHaveText('How do Austin and Charlotte compare?');
 await expect(page.locator('.home-evidence')).not.toHaveAttribute('open');
 await page.getByRole('button',{name:'Property taxes',exact:true}).click();await expect(page.locator('.conclusion strong')).toHaveText('$420');
});
