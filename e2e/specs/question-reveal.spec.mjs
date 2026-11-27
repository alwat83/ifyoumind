import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';

// B+ homepage: the visitor picks one of three preset statements about the example; the card shows the source
// cells and calculations, then a verdict computed from the example's own values. Nothing is typed or uploaded.
test('a preset statement opens its evidence and verdict in place, then evidence and private input', async ({ page }, info) => {
  for (const width of info.project.name === 'mobile' ? [320,390] : [820,1280,1440]) {
    await page.setViewportSize({width,height:width===320?568:width===390?844:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/');await page.evaluate(()=>document.fonts.ready);
    await expect(page.getByRole('heading',{level:1})).toHaveText('See what changed in your bills, and the numbers behind it.');
    await expect(page.locator('#business .example-label')).toHaveText('Made-up example');
    await expect(page.locator('#try')).toContainText('Compare U.S. cities');
    const statements=page.locator('.statement');
    await expect(statements).toHaveCount(3);
    for (const statement of await statements.all()) { await expect(statement).toBeInViewport({ratio:1}); await expect(statement).toHaveAttribute('aria-expanded','false'); }
    await expect(page.locator('#business')).toContainText('These statements are preset for this example.');
    await expect(page.locator('#business').locator('input, textarea, [contenteditable]')).toHaveCount(0);
    await expect(page.locator('#discovery-answer')).toBeHidden();
    await expect(page.locator('.own-data')).toBeHidden();
    await expectNoHorizontalScroll(page);await expectAccessible(page);
    const url=page.url(),requests=[];page.on('request',r=>requests.push(r.url()));
    const first=page.getByRole('button',{name:/mostly school charges/});
    await first.focus();await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url);await expect(first).toHaveAttribute('aria-expanded','true');await expect(first).toBeFocused();
    const check=page.locator('#'+await first.getAttribute('aria-controls'));
    await expect(check).toBeVisible();
    await expect(check.locator('.verdict')).toHaveText('Supported by these numbers');
    await expect(check.locator('.check-finding')).toHaveText('School charges added $240 of the $420 increase.');
    await expect(check.locator('.check-finding')).toBeInViewport({ratio:1});
    await expect(check.getByRole('table',{name:'Source cells used'})).toContainText('C3');
    await expect(check.getByRole('table',{name:'Source cells used'})).toContainText('2640.00');
    await expect(check).toContainText('($240.00 ÷ $420.00) × 100 = 57.1%');
    await expect(check.locator('.check-finding')).toHaveCSS('animation-name','none');
    await expect(page.getByRole('status')).toHaveText('Supported by these numbers. School charges added $240 of the $420 increase.');
    // Not supported and can't-tell verdicts come from the same values; only one check is open at a time.
    const county=page.getByRole('button',{name:/County charges rose the most/});await county.click();
    await expect(first).toHaveAttribute('aria-expanded','false');await expect(first).toContainText('Supported by these numbers');
    await expect(page.locator('.statement-check:not([hidden]) .verdict')).toHaveText('Not supported by these numbers');
    await page.getByRole('button',{name:/calculated wrong/}).click();
    await expect(page.locator('.statement-check:not([hidden]) .verdict')).toHaveText('Can’t tell from these numbers');
    await expect(page.locator('.statement-check:not([hidden])')).toContainText('look up your assessed value and local tax rates');
    await expect(page.locator('.statement-check:not([hidden])')).toHaveCount(1);
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

test('public example deep links preserve category, open the first check and recover safely',async({page})=>{
 for(const [query,expected,finding]of[['?example=tax#business','+$420','School charges added $240'],['?example=electricity#business','+21%','Energy use rose +10%.'],['?example=private-test-marker#business','+$420','School charges added $240']]){
  await page.goto('/'+query);await expect(page.locator('#discovery-answer')).toBeVisible();
  await expect(page.locator('.example-figure strong')).toHaveText(expected);
  await expect(page.locator('.statement-check:not([hidden]) .check-finding')).toContainText(finding);
  await expect(page.locator('body')).not.toContainText('private-test-marker');
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');await page.getByRole('button',{name:/mostly school charges/}).click();
 await expect(page.locator('.statement-check:not([hidden]) .check-finding')).toHaveCSS('animation-name',/check-in/);
 await page.goto('/?example=cities#business');await expect(page.locator('.finding h2')).toHaveText('How do Austin and Charlotte compare?');
 await expect(page.locator('.home-evidence')).not.toHaveAttribute('open');
 await page.getByRole('button',{name:'Property taxes',exact:true}).click();await expect(page.locator('.example-figure strong')).toHaveText('+$420');
 await expect(page.locator('.statement[aria-expanded="true"]')).toHaveCount(0);
});
