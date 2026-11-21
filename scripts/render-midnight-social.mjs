// Local editorial artwork, never part of the production assets or an outreach action.
// Derive amounts from the same reviewed synthetic fixtures as the product.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const bills = JSON.parse(await readFile(new URL('../src/app/intelligence/home-bill-examples.json', import.meta.url)));
import { fileURLToPath } from 'node:url';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const formats = { portrait:[1080,1350], square:[1080,1080], story:[1080,1920] };
export function editorialHtml(category, format) {
  if (!(category in bills) || !(format in formats)) throw new Error('Unsupported editorial template');
  const source=bills[category];
  const tax=category==='tax';
  const [width,height]=formats[format];
  const value=tax?source.highlights[0].value.replace(/^\+|\.00$/g,''):source.highlights[0].value;
  const detail=tax?`School tax accounts for ${source.highlights[1].value.replace(/^\+|\.00$/g,'')} of this illustrative increase.`:`Electricity use rose ${source.highlights[1].value.replace(/^\+/,'')}. The bill rose faster than usage.`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ifYouMind — ${esc(category)} editorial ${esc(format)}</title><style>
  @font-face{font-family:Instrument;src:url('../../../../public/fonts/instrument-serif/regular.woff2')}
  *{box-sizing:border-box}body{margin:0;background:#090D17;color:#F1F7FA;font-family:Arial,sans-serif}main{width:${width}px;height:${height}px;display:flex;flex-direction:column;padding:80px;border-top:8px solid #58D5E8}.brand{font-size:44px;font-weight:700;letter-spacing:-4px}.edition{font-size:30px;letter-spacing:3px;text-transform:uppercase;color:#7C9CFF;margin:70px 0 30px}h1{font-size:86px;line-height:1.03;letter-spacing:-4px;font-weight:500;margin:0;max-width:850px}.number{font:400 260px/.95 Instrument,Georgia,serif;color:#58D5E8;margin:40px 0 10px;letter-spacing:-9px}.label{font-size:28px;color:#A8BAC9;margin:0}.detail{font-size:34px;line-height:1.4;max-width:800px;margin:40px 0}.note{font-size:30px;line-height:1.6;color:#A8BAC9;margin-top:auto;padding-top:28px;border-top:1px solid #33485A}.foot{display:flex;justify-content:space-between;gap:24px;font-size:22px;margin-top:24px}main[data-format=story]{padding-block:200px}main[data-format=story] .edition{margin-top:120px}main[data-format=story] .number{font-size:300px;margin-block:70px 20px}main[data-format=square]{padding:64px}main[data-format=square] .edition{margin-top:36px}main[data-format=square] h1{font-size:68px}main[data-format=square] .number{font-size:180px;margin-top:24px}main[data-format=square] .detail{font-size:26px;margin-block:24px}.label,.detail,.note{overflow-wrap:anywhere}
  </style></head><body><main data-format="${esc(format)}"><div class="brand">ifyoumind</div><p class="edition">Illustrative example / ${tax?'Property tax':'Electricity'}</p><h1>${tax?'A bigger bill.<br>Where did it change?':'More power used.<br>An even bigger bill.'}</h1><p class="number">${esc(value)}</p><p class="label">${tax?'more in annual billed taxes':'increase in total billed'}</p><p class="detail">${esc(detail)}</p><p class="note">Synthetic data. Not a customer result.<br>${tax?'Two bills cannot establish an error or grounds for appeal.':'Whole-bill changes do not establish a tariff, cause or savings.'}</p><div class="foot"><span>Find the story in your numbers.</span><span>ifyoumind.com ↗</span></div></main></body></html>`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 const dir=new URL('../docs/design/midnight-slate/social/',import.meta.url);await mkdir(dir,{recursive:true});
 for(const category of ['tax','electricity'])for(const format of Object.keys(formats))await writeFile(new URL(`${category}-${format}.html`,dir),editorialHtml(category,format));
 if(process.argv.includes('--png')) {
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({...(process.env.QA_BROWSER_CHANNEL?{channel:process.env.QA_BROWSER_CHANNEL}:{}),headless:true});
  try {
   for(const category of ['tax','electricity'])for(const [format,[width,height]] of Object.entries(formats)) {
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
    const page=await context.newPage();
    await page.route('**/*',route=>/^https?:/.test(route.request().url())?route.abort():route.continue());
    await page.goto(new URL(`${category}-${format}.html`,dir).href);
    await page.evaluate(()=>document.fonts.ready);
    const overflow=await page.evaluate(()=>({x:document.documentElement.scrollWidth-innerWidth,y:document.documentElement.scrollHeight-innerHeight}));
    if(overflow.x>0||overflow.y>0)throw new Error(`Editorial overflow: ${category}/${format} ${JSON.stringify(overflow)}`);
    await page.screenshot({path:fileURLToPath(new URL(`${category}-${format}.png`,dir))});
    await context.close();
   }
  } finally {await browser.close();}
 }
 console.log('Rendered six local synthetic editorial templates; nothing published.');
}
