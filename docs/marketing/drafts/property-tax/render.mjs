// Offline founder-review exports. Reuses the existing Midnight Slate editorial template.
// Never copies into public/, calls a provider or publishes to a social account.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { editorialHtml } from '../../../../scripts/render-midnight-social.mjs';

const dir = new URL('./', import.meta.url);
const fixture = JSON.parse(await readFile(new URL('../../../../src/app/intelligence/home-bill-examples.json', import.meta.url))).tax;
const amount = text => Number(text.replace(/[^\d.-]/g, ''));
const [before, after] = fixture.rows[0].values.map(amount);
const [schoolBefore, schoolAfter] = fixture.rows[1].values.map(amount);
const increase = after - before, school = schoolAfter - schoolBefore;
if (increase !== 420 || school !== 240 || fixture.share !== '57.1%') throw Error('Reviewed example changed; review copy before rendering.');
const usd = value => '$' + value.toLocaleString('en-US');
const slides = [
  { id: '01-question', title: 'Your tax bill went up.', body: `<h1>Your tax bill went up.<br>Where did it go?</h1><p class="number">${usd(increase)}</p><p class="label">more in annual tax in this example</p><p class="detail">Start with what changed.<br>Then check the evidence.</p>`, alt: 'Illustrative, made-up property-tax example: an annual bill increased by $420. Start with what changed, then check the evidence.' },
  { id: '02-school', title: 'Follow the increase.', body: `<h1>School tax accounts for</h1><p class="number">${usd(school)}</p><p class="label">of the ${usd(increase)} example increase.</p><div class="receipt"><span>${fixture.columns[0]} school tax</span><strong>${usd(schoolBefore)}</strong><span>${fixture.columns[1]} school tax</span><strong>${usd(schoolAfter)}</strong></div>`, alt: 'Made-up example: school tax rises from $2,400 in 2024 to $2,640 in 2025, accounting for $240 of the $420 total increase.' },
  { id: '03-evidence', title: 'Check the arithmetic.', body: `<h1>Every finding<br>has a calculation.</h1><p class="detail">Annual total · ${fixture.columns.join(' → ')}</p><p class="equation">${usd(after)} − ${usd(before)}<br><strong>= +${usd(increase)}</strong></p><p class="detail">School-tax contribution</p><p class="equation">${usd(school)} ÷ ${usd(increase)} × 100<br><strong>= ${fixture.share}</strong></p>`, alt: 'Made-up example arithmetic: $4,620 minus $4,200 equals a $420 increase. The $240 school-tax contribution divided by $420 is 57.1 percent of that increase.' },
  { id: '04-limitation', title: 'Know the limit.', body: '<h1>A change is<br>not proof<br>of an error.</h1><p class="detail">These figures show what changed.<br>They do not establish whether an assessment is correct or appealable.</p>', alt: 'A bill increase is not proof of a tax error. Two statements show what changed, not whether an assessment is correct or appealable.' },
  { id: '05-action', title: 'Try it for yourself.', body: '<h1>Reveal<br>what changed.</h1><p class="detail">Start with the free example.<br>No account needed.</p><p class="label">See the numbers behind the finding.</p>', alt: 'Reveal what changed. Try the free illustrative example at ifyoumind.com, with no account needed for the example.' },
];
const extra = '<style>.edition{font-size:24px;letter-spacing:2px;margin-top:52px}.number{font-size:220px;margin-top:30px}.detail{font-size:32px;margin-block:30px}.note{font-size:26px;line-height:1.45}.receipt{display:grid;grid-template-columns:1fr auto;gap:20px;font-size:32px;margin-top:36px;padding-top:25px;border-top:1px solid #33485a}.receipt span{color:#a8bac9}.equation{font:400 64px/1.12 Instrument,Georgia,serif;margin:0 0 20px}.equation strong{color:#58d5e8;font-weight:400}h1{font-size:80px}.foot{font-size:22px}</style>';
const browser = await chromium.launch({ channel: process.env.QA_BROWSER_CHANNEL || 'chrome', headless: true });
const requests = [], errors = [], manifest = [];
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  await page.route(url => !['file:', 'data:'].includes(url.protocol), route => { requests.push(route.request().url()); return route.abort(); });
  page.on('pageerror', error => errors.push(error.message));
  for (const [index, slide] of slides.entries()) {
    const body = `<main data-format="portrait"><div class="brand">ifyoumind</div><p class="edition">Property-tax example · Made-up figures</p>${slide.body}<p class="note">Synthetic data. Not a customer result.<br>Two bills cannot establish an error or grounds for appeal.</p><div class="foot"><span>${index + 1} / ${slides.length}</span><span>ifyoumind.com ↗</span></div></main>`;
    const html = editorialHtml('tax', 'portrait').replace('</head>', extra + '</head>').replace(/<main[\s\S]*<\/main>/, body).replace(/<title>.*?<\/title>/, `<title>ifYouMind draft — ${slide.title}</title>`);
    const file = new URL(slide.id + '.html', dir);
    await writeFile(file, html);
    await page.goto(file.href); await page.evaluate(async () => { await document.fonts.load('220px Instrument'); await document.fonts.ready; });
    const bounds = await page.evaluate(() => {
      const main = document.querySelector('main'), note = document.querySelector('.note'), foot = document.querySelector('.foot');
      const children = [...main.children].filter(el => !el.matches('.note,.foot'));
      return { overflow: document.documentElement.scrollWidth > 1080 || document.documentElement.scrollHeight > 1350,
        overlap: children.some(el => el.getBoundingClientRect().bottom > note.getBoundingClientRect().top - 8),
        footerBottom: foot.getBoundingClientRect().bottom, fontLoaded: document.fonts.check('220px Instrument') };
    });
    if (bounds.overflow || bounds.overlap || bounds.footerBottom > 1280 || !bounds.fontLoaded) throw Error(`Slide ${slide.id} fails bounds/font checks: ${JSON.stringify(bounds)}`);
    const image = await page.screenshot({ type: 'jpeg', quality: 94, fullPage: true });
    await writeFile(new URL(slide.id + '.jpg', dir), image);
    manifest.push({ filename: slide.id + '.jpg', title: slide.title, altText: slide.alt, width: 1080, height: 1350, mimeType: 'image/jpeg', bytes: image.length,
      sha256: createHash('sha256').update(image).digest('hex'), approval: 'pending-founder-visual-review', publicUrl: null, publication: 'not-published', bounds });
  }
  if (requests.length || errors.length) throw Error('Render attempted external networking or encountered a page error.');
  await writeFile(new URL('manifest.json', dir), JSON.stringify({ status: 'draft-not-for-publication', updatedAt: new Date().toISOString(),
    source: 'src/app/intelligence/home-bill-examples.json', template: 'scripts/render-midnight-social.mjs', externalRequests: 0, pageErrors: 0, assets: manifest }, null, 2) + '\n');
  await writeFile(new URL('index.html', dir), `<!doctype html><html lang="en"><meta charset="utf-8"><title>ifYouMind — property-tax carousel draft</title><style>body{background:#090d17;color:#f1f7fa;font:18px Arial;padding:24px}h1{font-size:28px}section{display:grid;grid-template-columns:repeat(5,minmax(160px,1fr));gap:16px}img{width:100%;height:auto}a{color:#58d5e8}@media(max-width:900px){section{grid-template-columns:repeat(2,1fr)}}</style><h1>Property-tax carousel A · Founder review draft</h1><p>Not published or included in production assets. All figures are made up; calculations reuse the live example fixture.</p><section>${manifest.map(a=>`<a href="${a.filename}"><img src="${a.filename}" alt="${a.altText}">${a.title}</a>`).join('')}</section></html>`);
  console.log(JSON.stringify({ exports: manifest.length, format: '1080x1350 JPEG', externalRequests: requests.length, pageErrors: errors.length, published: false, directory: fileURLToPath(dir) }));
} finally { await browser.close(); }
