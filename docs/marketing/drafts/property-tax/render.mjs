// Offline drafts using the existing editorial template, fixture and authentic product capture.
// No production edits, uploads, provider requests or social publishing.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { editorialHtml } from '../../../../scripts/render-midnight-social.mjs';
import { renderVersion, exportName } from '../../../../scripts/marketing-assets/core.mjs';

const dir = new URL('./', import.meta.url), hash = bytes => createHash('sha256').update(bytes).digest('hex');
const root = fileURLToPath(new URL('../../../../', dir));
const version = renderVersion(root, 'property-tax');
if (process.env.MARKETING_ASSET_VERSION && Number(process.env.MARKETING_ASSET_VERSION) !== version) throw Error('Requested version would overwrite reviewed history.');
const caption = await readFile(new URL('caption.txt', dir));
await writeFile(new URL(`caption-v${version}.txt`, dir), caption);
const source = await readFile(new URL('../../../../src/app/intelligence/home-bill-examples.json', dir));
const fixture = JSON.parse(source).tax, amount = text => Number(text.replace(/[^\d.-]/g, ''));
const [before, after] = fixture.rows[0].values.map(amount);
const [schoolBefore, schoolAfter] = fixture.rows[1].values.map(amount);
const increase = after - before, school = schoolAfter - schoolBefore, other = increase - school;
const share = school / increase, percent = (share * 100).toFixed(1) + '%';
const cells=Object.fromEntries(fixture.proof[1].cells.map(cell=>[cell.cell,Number(cell.raw)]));
const county=cells.B3-cells.B2, municipal=cells.D3-cells.D2;
if (increase !== 420 || school !== 240 || other !== 180 || county!==90 || municipal!==90 || county+municipal!==other || percent !== fixture.share || fixture.columns.join(',') !== '2024,2025') throw Error('Reviewed fixture changed; review copy before rendering.');
const preview = await readFile(new URL('sources/live-tax-finding.png', dir));
const capture = JSON.parse(await readFile(new URL('sources/live-tax-finding.json', dir)));
if (hash(preview) !== capture.sha256 || capture.retouching !== false) throw Error('Authentic capture changed.');
const usd = value => '$' + value.toLocaleString('en-US');
const rows = (a,b) => `<div class="bar-comparison" role="img" aria-label="School tax: 2024 ${usd(a)}, 2025 ${usd(b)}. Bars start at zero.">${[a,b].map((v,i)=>`<div class="bar-row"><div class="bar-label"><span>${fixture.columns[i]}</span><strong>${usd(v)}</strong></div><div class="bar-track"><div class="bar-fill ${i?'current':'previous'}" style="width:${v/b*100}%" data-value="${v}" data-maximum="${b}"></div></div></div>`).join('')}</div>`;
const slides = [
  { id:'01-question', title:'Your property-tax bill increased by $420. What changed?',
    body:`<h1>Your property-tax bill<br>increased by</h1><p class="number focal">+${usd(increase)}</p><p class="question">What changed?</p><div class="total-comparison"><div><span>${fixture.columns[0]} total</span><strong>${usd(before)}</strong></div><span class="direction" aria-hidden="true">→</span><div><span>${fixture.columns[1]} total</span><strong>${usd(after)}</strong></div></div>`,
    alt:'Synthetic property-tax example: the annual total rises from $4,200 in 2024 to $4,620 in 2025, an increase of $420. What changed? No assessment error or appeal eligibility is established.' },
  { id:'02-school', title:'$240 of that increase came from school tax.',
    body:`<h1>Of that increase,</h1><p class="number">${usd(school)}</p><p class="subhead">came from school tax.</p>${rows(schoolBefore,schoolAfter)}<p class="calculation">${usd(schoolAfter)} − ${usd(schoolBefore)} = <strong>+${usd(school)}</strong></p>`,
    alt:'Synthetic example: $240 of the $420 increase came from school tax. Zero-based bars compare $2,400 in 2024 with $2,640 in 2025. $2,640 minus $2,400 equals $240. No assessment error or appeal eligibility is established.' },
  { id:'03-evidence', title:'School tax accounts for 57.1% of the increase.',
    body:`<h1>School tax accounts for</h1><p class="number share">${percent}</p><p class="subhead">of the increase.</p><div class="stack" role="img" aria-label="Of the $420 total increase, school tax contributes $240, or 57.1 percent; other charges contribute $180, or 42.9 percent."><div class="school-segment" style="width:${share*100}%" data-numerator="${school}" data-denominator="${increase}"><span>${usd(school)}</span></div><div class="other-segment" style="width:${(1-share)*100}%"><span>${usd(other)}</span></div></div><div class="legend"><span>School tax</span><span>Other charges</span></div><p class="calculation">${usd(school)} ÷ ${usd(increase)} × 100 = ${percent}</p><p class="context-line">A share of the increase.<br>Not your tax rate.</p>`,
    alt:'Synthetic example: school tax accounts for 57.1 percent of the $420 increase. A proportional bar shows $240 school tax and $180 other charges. $240 divided by $420 times 100 equals 57.1 percent, rounded. This is not a tax rate or evidence of an assessment error or appeal eligibility.' },
  { id:'04-limitation', title:"Understanding an increase doesn't mean your bill is wrong.",
    body:'<h1 class="context-heading">Understanding an increase<br>doesn’t mean<br>your bill is wrong.</h1><div class="context-facts"><div><h2>The figures show</h2><p>Which charges changed.<br>How much they contributed.</p></div><div><h2>They don’t establish</h2><p>An assessment error.<br>Eligibility for an appeal.</p></div></div><p class="context-line">See the change.<br>Then investigate the assessment.</p>',
    alt:'Understanding an increase does not mean your bill is wrong. Synthetic figures show which charges changed and how much they contributed. They do not establish an assessment error or eligibility for an appeal.' },
  { id:'05-action', title:'Your numbers have a story. Reveal what changed.',
    body:'<h1>Your numbers<br>have a story.</h1><p class="subhead action-line">Reveal what changed.</p><figure class="product-preview"><img src="sources/live-tax-finding.png" alt="Unaltered capture of the live free example: Why did my property taxes go up? $420 more than the year before; school taxes rose by $240; two bills alone cannot tell whether you paid too much."><figcaption>Inside the live free example</figcaption></figure><div class="invitation">Try the free example <span aria-hidden="true">↗</span></div><p class="no-account">No account needed for the example.</p><p class="destination">ifyoumind.com</p>',
    alt:'Your numbers have a story. Reveal what changed. An authentic preview of the live free illustrative tax example shows the $420 increase and school-tax contribution. Try the free example at ifyoumind.com; no account needed for the example. Synthetic figures do not establish an assessment error or appeal eligibility.' },
];

// Same local type pairing and Midnight Slate palette; composition changes are draft-only.
const extra = `<style>
main{padding:56px 72px 44px}.brand{font-size:50px}.edition{font-size:30px;line-height:1.25;letter-spacing:1px;margin:28px 0 24px}.content{display:flex;flex-direction:column;gap:22px}h1{font-size:72px;line-height:1.02;letter-spacing:-3px;max-width:none}p{margin:0}.number{font-size:218px;line-height:.94;letter-spacing:-8px;margin:0;color:#58D5E8}.number.focal{font-size:252px}.number.share{font-size:216px}.question{font-size:68px;line-height:1.05;letter-spacing:-2px}.subhead{font-size:52px;line-height:1.12}.total-comparison{display:flex;align-items:center;gap:46px;margin-top:14px}.total-comparison div{display:flex;flex-direction:column;gap:10px}.total-comparison span{font-size:40px;color:#A8BAC9}.total-comparison strong{font-size:56px;font-weight:500;letter-spacing:-2px}.total-comparison .direction{font-size:54px;color:#58D5E8}.bar-comparison{display:grid;gap:25px;margin-top:10px}.bar-label{display:flex;justify-content:space-between;font-size:42px;line-height:1.15;margin-bottom:12px}.bar-label span{color:#A8BAC9}.bar-label strong{font-weight:500}.bar-track{height:32px}.bar-fill{height:100%;border-radius:3px}.previous{background:#7C9CFF}.current{background:#58D5E8}.calculation{font-size:40px;line-height:1.25;letter-spacing:-1px;margin-top:10px}.calculation strong{font-weight:500;color:#58D5E8}.stack{display:flex;width:100%;height:94px;border-radius:6px;overflow:hidden;margin-top:10px}.stack>div{display:flex;align-items:center;justify-content:center;color:#090D17;font-size:44px;font-weight:600}.school-segment{background:#58D5E8;border-right:6px solid #090D17}.other-segment{background:#7C9CFF;border-left:6px solid #090D17}.legend{display:flex;justify-content:space-between;font-size:40px;line-height:1.15}.context-line{font-size:40px;line-height:1.22;color:#A8BAC9;margin-top:6px}.context-heading{font-size:68px;line-height:1.07}.context-facts{display:grid;gap:28px;margin-top:18px}.context-facts h2{font-size:40px;font-weight:500;letter-spacing:0;margin:0 0 10px;color:#58D5E8}.context-facts p{font-size:42px;line-height:1.2}.context-facts div+div h2{color:#A8BAC9}.action-line{font-size:50px}.product-preview{margin:10px 0 0}.product-preview img{display:block;width:100%;height:auto;max-height:260px;object-fit:contain;border:1px solid #33485A;border-radius:8px}.product-preview figcaption{font-size:30px;color:#A8BAC9;margin-top:12px}.invitation{background:#58D5E8;color:#090D17;font-size:44px;font-weight:600;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;border-radius:8px;margin-top:8px}.no-account{font-size:40px;line-height:1.2}.destination{font-size:46px;line-height:1.1;letter-spacing:-1px}.note{font-size:32px;line-height:1.28;padding-top:22px}.foot{font-size:30px;margin-top:16px;line-height:1.2}.content,.note{overflow-wrap:normal}main[data-slide="05-action"] .foot span:last-child{visibility:hidden}
main[data-slide="01-question"] .content{gap:28px}main[data-slide="01-question"] h1{font-size:76px}main[data-slide="01-question"] .number.focal{font-size:280px}main[data-slide="01-question"] .question{font-size:76px}main[data-slide="01-question"] .total-comparison strong{font-size:72px}
</style>`;

const browser = await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL||'chrome',headless:true});
const requests=[], errors=[], assets=[];
try {
  const page=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
  await page.route(url=>!['file:','data:'].includes(url.protocol),route=>{requests.push(route.request().url());return route.abort();});
  page.on('pageerror',error=>errors.push(error.message));
  for(const [index,slide] of slides.entries()){
    const body=`<main data-format="portrait" data-slide="${slide.id}"><div class="brand">ifyoumind</div><p class="edition">Property-tax example · Synthetic figures</p><section class="content" aria-label="${slide.title.replace(/"/g,'&quot;')}">${slide.body}</section><p class="note">Synthetic figures. Not a customer result.<br>No assessment error or appeal eligibility established.</p><div class="foot"><span>${index+1} / 5</span><span>ifyoumind.com ↗</span></div></main>`;
    const html=editorialHtml('tax','portrait').replace('</head>',extra+'</head>').replace(/<main[\s\S]*<\/main>/,body).replace(/<title>.*?<\/title>/,`<title>ifYouMind draft v2 — ${slide.title}</title>`);
    const filename=exportName('property-tax',index+1,version);
    const file=new URL(filename.replace('.jpg','.html'),dir);await writeFile(file,html);await page.goto(file.href);
    await page.evaluate(async()=>{await document.fonts.load('218px Instrument');await document.fonts.ready;});
    const checks=await page.evaluate(()=>{
      const main=document.querySelector('main'),content=document.querySelector('.content'),note=document.querySelector('.note'),foot=document.querySelector('.foot'),box=el=>el.getBoundingClientRect();
      const parse=s=>s.match(/[\d.]+/g)?.map(Number)||[];
      const lum=rgb=>rgb.slice(0,3).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
      const contrast=(a,b)=>{const[x,y]=[lum(a),lum(b)].sort((a,b)=>b-a);return(x+.05)/(y+.05);};
      const text=[...main.querySelectorAll('*')].filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&getComputedStyle(el).visibility!=='hidden');
      let minContrast=Infinity;const clipped=[];
      for(const el of text){const style=getComputedStyle(el),range=document.createRange();range.selectNodeContents(el);const r=range.getBoundingClientRect();if(r.left<71||r.right>1009||r.top<55||r.bottom>1307)clipped.push(el.textContent.slice(0,70));let parent=el;while(parent&&parse(getComputedStyle(parent).backgroundColor)[3]===0)parent=parent.parentElement;let bg=parent?parse(getComputedStyle(parent).backgroundColor):[9,13,23];if(bg.length<3)bg=[9,13,23];minContrast=Math.min(minContrast,contrast(parse(style.color),bg));}
      const narrative=[...content.querySelectorAll('h1,.number,.question,.subhead,.calculation,.context-line,.context-facts p,.legend span,.bar-label span,.bar-label strong,.invitation,.destination,.no-account,.total-comparison span,.total-comparison strong,.context-facts h2')];
      const barWidths=[...document.querySelectorAll('.bar-fill')].map(el=>({ratio:box(el).width/box(el.parentElement).width,expected:Number(el.dataset.value)/Number(el.dataset.maximum)}));
      const segment=document.querySelector('.school-segment');
      return{overflow:document.documentElement.scrollWidth>1080||document.documentElement.scrollHeight>1350,contentBottom:box(content).bottom,noteTop:box(note).top,footerBottom:box(foot).bottom,fontLoaded:document.fonts.check('218px Instrument'),imageLoaded:[...document.images].every(i=>i.complete&&i.naturalWidth>0),clipped,minContrast:Number(minContrast.toFixed(2)),minMobileNarrativePx:Number(Math.min(...narrative.map(el=>parseFloat(getComputedStyle(el).fontSize)/3)).toFixed(2)),disclosurePxAt360:parseFloat(getComputedStyle(note).fontSize)/3,barWidths,schoolRatio:segment?box(segment).width/box(segment.parentElement).width:null};
    });
    if(checks.overflow||checks.contentBottom>checks.noteTop-18||checks.footerBottom>1307||!checks.fontLoaded||!checks.imageLoaded||checks.clipped.length||checks.minContrast<4.5||checks.minMobileNarrativePx<13||checks.disclosurePxAt360<10||checks.barWidths.some(x=>Math.abs(x.ratio-x.expected)>.001)||checks.schoolRatio!==null&&Math.abs(checks.schoolRatio-share)>.001)throw Error(`Slide ${slide.id} fails checks: ${JSON.stringify(checks)}`);
    const image=await page.screenshot({type:'jpeg',quality:94,fullPage:true});await writeFile(new URL(filename,dir),image);
    assets.push({filename,title:slide.title,altText:slide.alt,width:1080,height:1350,mimeType:'image/jpeg',bytes:image.length,sha256:hash(image),sourceSha256:hash(html),checks});
  }
  if(requests.length||errors.length)throw Error('External request or page error during offline export.');
  const receipt=JSON.stringify({version,status:'render-receipt-only-lifecycle-in-assets.json',updatedAt:new Date().toISOString(),source:'src/app/intelligence/home-bill-examples.json',sourceSha256:hash(source),template:'scripts/render-midnight-social.mjs',productPreview:capture,externalRequests:requests.length,pageErrors:errors.length,numericalValidation:{before,after,increase,schoolBefore,schoolAfter,school,county,municipal,other,share,displayedShare:percent},assets},null,2)+'\n';
  await writeFile(new URL(`render-receipt-v${version}.json`,dir),receipt);
  await writeFile(new URL('manifest.json',dir),receipt);
  const css='body{margin:0;background:#090d17;color:#f1f7fa;font:20px Arial;padding:32px}h1{font-size:32px}h2{font-size:24px}p{color:#a8bac9}a{color:#58d5e8}section{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}img{display:block;width:100%;height:auto}figure{margin:0}figcaption{font-size:16px;margin-block:10px}@media(max-width:900px){section{grid-template-columns:repeat(2,1fr)}}';
  await writeFile(new URL('index.html',dir),`<!doctype html><html lang="en"><meta charset="utf-8"><title>ifYouMind — refined tax carousel</title><style>${css}</style><h1>Property-tax carousel · Refined draft</h1><p>Unpublished / pending founder approval. Synthetic figures, not customer results. <a href="comparison.html">Before / after</a></p><section>${assets.map(a=>`<figure><a href="${a.filename}"><img src="${a.filename}" alt="${a.altText}"></a><figcaption>${a.title}</figcaption></figure>`).join('')}</section></html>`);
  await writeFile(new URL('comparison.html',dir),`<!doctype html><html lang="en"><meta charset="utf-8"><title>ifYouMind — carousel before and after</title><style>${css}section{margin-bottom:32px}</style><h1>Before / after · Property-tax carousel</h1><p>Same example and Midnight Slate identity. Refined hook, charts, context and authentic product invitation. Both rows are drafts.</p><h2>Before</h2><section>${assets.map((a,i)=>`<figure><img src="before-v1/${slides[i].id}.jpg" alt="Previous draft: ${slides[i].id}"></figure>`).join('')}</section><h2>After</h2><section>${assets.map(a=>`<figure><img src="${a.filename}" alt="${a.altText}"></figure>`).join('')}</section></html>`);
  await page.setViewportSize({width:1800,height:1150});await page.goto(new URL('comparison.html',dir).href);await page.screenshot({path:fileURLToPath(new URL('comparison.jpg',dir)),type:'jpeg',quality:92,fullPage:true});
  await mkdir(new URL('mobile-review/',dir),{recursive:true});
  for(const a of assets){await page.setViewportSize({width:390,height:500});await page.setContent(`<body style="margin:0;background:#090d17"><img src="${new URL(a.filename,dir).href}" style="display:block;width:390px;height:auto" alt="${a.altText}"></body>`);await page.locator('img').evaluate(i=>i.decode());await page.screenshot({path:fileURLToPath(new URL('mobile-review/'+a.filename,dir)),type:'jpeg',quality:94,fullPage:true});}
  if(requests.length||errors.length)throw Error('External request or page error during comparison/mobile review.');
  console.log(JSON.stringify({exports:assets.length,format:'1080x1350 JPEG',externalRequests:requests.length,pageErrors:errors.length,numericalValidation:true,allBoundsContrastMobileChecks:true,published:false,directory:fileURLToPath(dir)}));
}finally{await browser.close();}
