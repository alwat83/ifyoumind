import {test as base,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const CSV='tax_year,county_usd,school_usd,municipal_usd,total_usd\n2024,900.00,2400.00,900.00,4200.00\n2025,990.00,2640.00,990.00,4620.00\n';
const test=base.extend({
 page:async({page,context},use)=>{
  const external=[],writes=[],errors=[];
  await context.route('**/*',route=>{const r=route.request();if(new URL(r.url()).origin!=='http://127.0.0.1:4313'){external.push(r.url());return route.abort();}if(!['GET','HEAD'].includes(r.method())){writes.push(r.method());return route.abort();}return route.continue();});
  page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await use(page);
  expect(errors).toEqual([]);expect(external).toEqual([]);expect(writes).toEqual([]);
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length,cookies:document.cookie}))).toEqual({local:0,session:0,cookies:''});
  expect(await page.evaluate(async()=>(await indexedDB.databases()).length)).toBe(0);
 },
});
const upload=(page,csv=CSV,name='redacted.csv')=>page.getByLabel('Choose a redacted CSV',{exact:true}).setInputFiles({name,mimeType:'text/csv',buffer:Buffer.from(csv)});
async function accessible(page){const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(a.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(0);}
async function example(page){await page.getByRole('button',{name:'Try example data'}).click();await expect(page.locator('.finding')).toHaveCount(3);}

test('first meaningful keyboard click creates discoveries without account or prompt',async({page},info)=>{
 await accessible(page);
 await expect(page.getByRole('textbox')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('welcome.png'),fullPage:true,scale:'css'});
 const button=page.getByRole('button',{name:'Try example data'});await button.focus();const start=Date.now();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Your total rose by $420.00.'})).toBeVisible();expect(Date.now()-start).toBeLessThan(2000);
 const firstFinding=await page.locator('.finding h3').first().boundingBox();expect(firstFinding.y+firstFinding.height).toBeLessThanOrEqual(page.viewportSize().height);await expect(page.locator('h1')).toBeFocused();await expect(page.getByRole('status')).toContainText('3 findings ready');await expect(page.locator('main')).toContainText('57.1%');await expect(page.locator('.limits')).toContainText('not a trend');await accessible(page);await page.screenshot({path:info.outputPath('discovered.png'),fullPage:true,scale:'css'});
});
test('each finding exposes exact source cells and calculations by keyboard',async({page},info)=>{
 await example(page);
 for(const article of await page.locator('.finding').all()){
  const summary=article.locator('summary');await summary.focus();await page.keyboard.press('Enter');await expect(article.locator('table')).toBeVisible();expect(await article.locator('tbody tr').count()).toBeGreaterThanOrEqual(4);await expect(article.locator('ol')).not.toBeEmpty();
 }
 await expect(page.locator('.finding').first().getByRole('row',{name:/E2/})).toContainText('4200.00');await expect(page.locator('.finding').first().getByRole('row',{name:/E3/})).toContainText('4620.00');await accessible(page);await page.screenshot({path:info.outputPath('evidence.png'),fullPage:true,scale:'css'});
});
test('recognized CSV automatically analyzes and does not retain filename or persist data',async({page})=>{
 await upload(page,CSV,'PRIVATE-ADDRESS-DO-NOT-RETAIN.csv');await expect(page.locator('.finding')).toHaveCount(3);await expect(page.locator('body')).not.toContainText('PRIVATE-ADDRESS');await expect(page.locator('input[type=file]')).toHaveValue('');await page.reload();await expect(page.locator('.finding')).toHaveCount(0);await expect(page.getByRole('button',{name:'Try example data'})).toBeVisible();
});
test('missing data never becomes zero; corrections invalidate and rerun findings',async({page},info)=>{
 await upload(page,CSV.replace('900.00',''));await expect(page.getByRole('alert')).toContainText('amount is missing');await expect(page.locator('.finding')).toHaveCount(0);await accessible(page);
 const county=page.getByRole('textbox',{name:'CSV row 2 County',exact:true});await expect(county).toHaveAttribute('aria-invalid','true');await county.fill('900.00');await page.getByRole('button',{name:'Rerun discovery'}).click();await expect(page.locator('.finding')).toHaveCount(3);
 await page.getByRole('button',{name:'Review or correct data'}).click(); // closes editor, then reopen
 await page.getByRole('button',{name:'Review or correct data'}).click();
 await county.fill('1000.00');await expect(page.locator('.finding')).toHaveCount(0);await expect(page.getByRole('status')).toContainText('Rerun discovery');await page.getByRole('button',{name:'Rerun discovery'}).click();await expect(page.getByRole('alert')).toContainText('do not add up');await page.screenshot({path:info.outputPath('inconsistent.png'),fullPage:true,scale:'css'});
});
test('one statement is honestly insufficient and can be completed on the page',async({page},info)=>{
 await upload(page,CSV.split('\n').slice(0,2).join('\n'));await expect(page.getByRole('alert')).toContainText('One statement is not enough');await expect(page.locator('.finding')).toHaveCount(0);await accessible(page);await page.screenshot({path:info.outputPath('insufficient.png'),fullPage:true,scale:'css'});
 for(const [field,value] of [['Tax year','2025'],['County','990.00'],['School','2640.00'],['Municipal','990.00'],['Total billed','4620.00']])await page.getByRole('textbox',{name:'CSV row 3 '+field,exact:true}).fill(value);
 await page.getByRole('button',{name:'Rerun discovery'}).click();await expect(page.locator('.finding')).toHaveCount(3);
});
test('zero baseline and offsetting changes avoid undefined or misleading percentages',async({page})=>{
 await upload(page,CSV.replace('900.00,2400.00,900.00,4200.00','0,0,0,0'));await expect(page.locator('.finding').first()).toContainText('percentage change is not available');await expect(page.locator('.finding')).toHaveCount(2);await accessible(page);
 await upload(page,CSV.replace('990.00,2640.00,990.00,4620.00','1000,2300,900,4200'));await expect(page.locator('.finding').nth(1)).toContainText('offset');await expect(page.locator('.finding').nth(1)).not.toContainText('57.1%');
});
test('duplicate, negative and malformed values are rejected without findings',async({page})=>{
 for(const csv of [CSV.replace('2025','2024'),CSV.replace('900.00','-1'),CSV.replace('900.00','1e3')]){await upload(page,csv);await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.finding')).toHaveCount(0);}
 await upload(page,'not,the,format\n1,2,3');await expect(page.getByRole('alert')).toContainText('supported tax CSV');await expect(page.locator('.finding')).toHaveCount(0);
 await upload(page,CSV,'bill.pdf');await expect(page.getByRole('alert')).toContainText('not supported');
});
test('follow-ups are evidence requests, not invented answers or network calls',async({page})=>{
 await example(page);await page.getByRole('button',{name:'Did my assessment or exemptions change?'}).click();await expect(page.getByRole('region',{name:'Suggested next check'})).toContainText('cannot tell us');await page.getByRole('button',{name:'How would I compare nearby places?'}).click();await expect(page.locator('#followup-answer')).toContainText('does not fetch');await accessible(page);
});
test('clear removes source values and findings; replacing input cannot show stale results',async({page})=>{
 await example(page);await page.getByRole('button',{name:'Clear my data'}).click();await expect(page.locator('.finding')).toHaveCount(0);for(const input of await page.locator('.editor input').all())await expect(input).toHaveValue('');await expect(page.locator('h1')).toBeFocused();await upload(page,CSV);await upload(page,'wrong,columns\n1,2');await expect(page.locator('.finding')).toHaveCount(0);await expect(page.locator('.editor input').first()).toHaveValue('');
});
test('example download contains only the public synthetic template',async({page})=>{
 await page.getByText('See the exact CSV format',{exact:true}).click();const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download example CSV'}).click()]);expect(download.suggestedFilename()).toBe('ifyoumind-example-tax-v1.csv');const stream=await download.createReadStream();let text='';for await(const b of stream)text+=b.toString();expect(text).toBe(CSV);
});
test('clearing during a pending file read prevents late private data from returning',async({page})=>{
 await page.evaluate(()=>{const read=File.prototype.text;File.prototype.text=function(){return new Promise(resolve=>setTimeout(()=>resolve(read.call(this)),500));};});
 await upload(page);await page.getByRole('button',{name:'Clear my data'}).click();await page.waitForTimeout(700);await expect(page.locator('.finding')).toHaveCount(0);await expect(page.locator('.editor input').first()).toHaveValue('');await expect(page.getByRole('button',{name:'Try example data'})).toBeVisible();
});
test('corrected valid values produce a new story with current source evidence',async({page},info)=>{
 await example(page);await page.getByRole('button',{name:'Review or correct data'}).click();await page.getByRole('textbox',{name:'CSV row 2 County',exact:true}).fill('1000.00');await page.getByRole('textbox',{name:'CSV row 2 Total billed',exact:true}).fill('4300.00');await expect(page.locator('.finding')).toHaveCount(0);await page.getByRole('button',{name:'Rerun discovery'}).click();await expect(page.locator('.finding').first()).toContainText('rose by $320.00');
 const card=page.locator('.finding').first();await card.locator('summary').click();await expect(card.locator('.source-note')).toContainText('Edited values are the source');await expect(card.getByRole('row',{name:/E2/})).toContainText('4300.00');await accessible(page);await page.screenshot({path:info.outputPath('corrected.png'),fullPage:true,scale:'css'});
});

test('welcome and plain-language findings are usable in the first screen',async({page})=>{
 const cta=await page.getByRole('button',{name:'Try example data'}).boundingBox();expect(cta.y+cta.height).toBeLessThanOrEqual(page.viewportSize().height);
 await example(page);await expect(page.getByRole('heading',{name:'School changed the most.',exact:true})).toBeVisible();await expect(page.locator('.finding').nth(1)).toContainText('School went up by $240.00. That makes up 57.1% of the $420.00 increase.');await expect(page.getByRole('heading',{name:'All three charges went up by 10%.',exact:true})).toBeVisible();await accessible(page);
});
test('repeated file-read failures show helpful copy and recover without private diagnostics',async({page},info)=>{
 const warnings=[];page.on('console',message=>{if(message.type()==='warning')warnings.push(message.text());});
 await example(page);
 await page.evaluate(()=>{const read=File.prototype.text;let failures=2;File.prototype.text=function(){if(failures-->0)return Promise.reject(new DOMException('INTERNAL PRIVATE-ADDRESS.csv','NotReadableError'));return read.call(this);};});
 for(let i=0;i<2;i++){
  await upload(page);await expect(page.getByRole('alert')).toContainText('Your browser couldn’t open this file');await expect(page.locator('.finding')).toHaveCount(0);await expect(page.locator('body')).not.toContainText('INTERNAL');await expect(page.locator('body')).not.toContainText('PRIVATE-ADDRESS');await accessible(page);
 }
 expect(warnings).toEqual(['Discovery file read failed NotReadableError','Discovery file read failed NotReadableError']);await page.screenshot({path:info.outputPath('read-failure.png'),fullPage:true,scale:'css'});
 await upload(page);await expect(page.locator('.finding')).toHaveCount(3);await expect(page.getByRole('alert')).toHaveCount(0);
});
test('incomplete inputs never announce a discovery and clear removes expanded evidence',async({page})=>{
 await upload(page,CSV.split('\n').slice(0,2).join('\n'));await expect(page.locator('h1')).toHaveText('Let’s get the data ready.');await expect(page.getByRole('status')).toContainText('No findings');await expect(page.locator('.finding')).toHaveCount(0);
 await page.getByRole('button',{name:'Reset to example data'}).click();await expect(page.locator('h1')).toHaveText('Here’s what changed.');await page.locator('.finding').first().locator('summary').click();await page.getByRole('button',{name:'Did my assessment or exemptions change?'}).click();await page.getByRole('button',{name:'Clear my data'}).click();await expect(page.getByRole('table')).toHaveCount(0);await expect(page.getByRole('region',{name:'Suggested next check'})).toHaveCount(0);await expect(page.locator('body')).not.toContainText('57.1%');await accessible(page);
});
test('example safely replaces a pending private read; oversize and empty files recover',async({page})=>{
 await page.evaluate(()=>{const read=File.prototype.text;File.prototype.text=function(){return new Promise(resolve=>setTimeout(()=>resolve(read.call(this)),400));};});
 await upload(page,CSV.replace('4620.00','9999'));await expect(page.getByRole('status')).toContainText('Reading the CSV');await page.getByRole('button',{name:'Try example data'}).click();await page.waitForTimeout(600);await expect(page.locator('.finding')).toHaveCount(3);await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('body')).not.toContainText('9999');
 await upload(page,'x'.repeat(2_000_001));await expect(page.getByRole('alert')).toContainText('2 MB or smaller');await expect(page.locator('.finding')).toHaveCount(0);
 await upload(page,'');await expect(page.getByRole('alert')).toContainText('CSV is empty.');await page.getByRole('button',{name:'Try example data'}).click();await expect(page.locator('.finding')).toHaveCount(3);await accessible(page);
});
