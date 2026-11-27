// Reel text overlays (transparent 1080x1920) and end card, in ifYouMind brand style. Text sits in the Reels safe zone.
const fs=require('fs'),path=require('path'); const [root,out,pwDir]=process.argv.slice(2);
const { chromium } = require(path.join(pwDir,'node_modules','playwright'));
const font=path.join(root,'public/fonts/instrument-serif/regular.woff2');
const base=`@font-face{font-family:Instrument;src:url('file://${font}')}*{box-sizing:border-box;margin:0}html,body{width:1080px;height:1920px;background:transparent;font-family:Inter,Arial,sans-serif;color:#F1F7FA}
.band{position:absolute;left:56px;right:56px;top:1150px;padding:40px 48px 34px;background:rgba(9,13,23,.92);border:2px solid #33485A;border-left:10px solid #58D5E8;border-radius:12px}
.k{font-size:30px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#58D5E8}.t{margin-top:12px;font-size:66px;font-weight:700;line-height:1.08;letter-spacing:-.03em}.s{font-family:Instrument,Georgia,serif;font-weight:400}
.d{margin-top:22px;font-size:26px;color:#A8BAC9}`;
const disc='Made-up example · not tax advice';
const overlays=[
 ['o1-hook',`<div class="band"><p class="k">Property tax</p><p class="t">$420 more this year.<br><span class="s">Where did it go?</span></p><p class="d">${disc}</p></div>`],
 ['o2-finding',`<div class="band"><p class="k">One tap</p><p class="t">School taxes:<br><span class="s">$240 of the $420.</span></p><p class="d">${disc}</p></div>`],
 ['o3-evidence',`<div class="band"><p class="k">The evidence</p><p class="t">Every number,<br><span class="s">with its source.</span></p><p class="d">${disc}</p></div>`],
 ['o4-math',`<div class="band"><p class="k">No black box</p><p class="t">Check the math<br><span class="s">yourself.</span></p><p class="d">${disc}</p></div>`],
];
const endcard=`<div style="position:absolute;inset:0;background:radial-gradient(120% 60% at 80% 100%,#122B36 0%,#090D17 60%);border-top:12px solid #58D5E8;padding:300px 80px 0">
<p style="font-size:52px;font-weight:700;letter-spacing:-.04em">ifyoumind</p>
<p class="k" style="margin-top:110px">Try it yourself</p>
<p style="margin-top:24px;font-size:112px;font-weight:700;line-height:1.0;letter-spacing:-.035em">Find the line<br><span class="s" style="font-size:132px">that moved.</span></p>
<p style="margin-top:48px;font-size:44px;line-height:1.35;color:#B2C3D1;max-width:22ch">Explore the free property-tax example. No account needed.</p>
<p style="margin-top:72px;display:inline-block;background:#7C9CFF;color:#090D17;font-size:60px;font-weight:700;padding:32px 52px;border-radius:10px">ifyoumind.com</p>
<p style="position:absolute;left:80px;right:80px;top:1440px;font-size:28px;line-height:1.45;color:#A8BAC9"><b style="color:#F1F7FA;letter-spacing:.08em">ILLUSTRATIVE EXAMPLE · MADE-UP FIGURES</b><br>Not a customer result. Not tax advice.</p></div>`;
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:process.env.PW_CHROMIUM});
const c=await b.newContext({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await c.route('**/*',r=>/^(file:|data:|https:\/\/fonts\.(googleapis|gstatic)\.com)/.test(r.request().url())?r.continue():r.abort());
const render=async(name,body,transparent)=>{const f=path.join(out,name+'.html');fs.writeFileSync(f,`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>${base}</style></head><body>${body}</body></html>`);
 const p=await c.newPage();await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);
 if(!(await p.evaluate(()=>document.fonts.check('700 40px Inter')&&document.fonts.check('40px Instrument')))) throw Error('fonts '+name);
 await p.screenshot({path:path.join(out,name+'.png'),omitBackground:transparent});await p.close();};
for(const [n,h] of overlays) await render(n,h,true); await render('endcard',endcard,false);
await b.close();console.log('rendered',overlays.length+1);})().catch(e=>{console.error(e.message);process.exit(1)});
