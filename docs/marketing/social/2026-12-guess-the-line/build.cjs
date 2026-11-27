// "Guess the line" carousel: 5 slides, 1080x1350. All figures come from the app's illustrative tax fixture and are asserted.
// Usage: node build.cjs <repoRoot> <outDir> <playwrightModuleDir>
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const [root,out,pwDir]=process.argv.slice(2);
const { chromium } = require(path.join(pwDir,'node_modules','playwright'));
const fx=JSON.parse(fs.readFileSync(path.join(root,'src/app/intelligence/home-bill-examples.json'))).tax;
const n=s=>Number(String(s).replace(/[^\d.-]/g,''));
const [t0,t1]=fx.rows[0].values.map(n); const cells=Object.fromEntries(fx.proof[1].cells.map(c=>[c.cell,n(c.raw)]));
const county=cells.B3-cells.B2, school=cells.C3-cells.C2, muni=cells.D3-cells.D2, inc=t1-t0;
const share=(school/inc*100).toFixed(1), pct=Math.round((inc/t0)*100);
if(!(t0===4200&&t1===4620&&inc===420&&county===90&&school===240&&muni===90&&county+school+muni===inc&&share==='57.1'&&fx.share==='57.1%'&&pct===10)) throw Error('fixture drift');
const usd=v=>'$'+v.toLocaleString('en-US');
const font=path.join(root,'public/fonts/instrument-serif/regular.woff2');
const css=`@font-face{font-family:Instrument;src:url('file://${font}')}
*{box-sizing:border-box;margin:0}body{background:#090D17}
main{width:1080px;height:1350px;display:flex;flex-direction:column;padding:72px 80px 56px;border-top:10px solid #58D5E8;color:#F1F7FA;font-family:Inter,Arial,sans-serif;background:radial-gradient(120% 70% at 85% 100%,#122B36 0%,#090D17 62%)}
.top{display:flex;justify-content:space-between;align-items:center}.brand{font-size:40px;font-weight:700;letter-spacing:-.04em}.count{font-size:24px;color:#A8BAC9;font-variant-numeric:tabular-nums}
.eyebrow{margin-top:72px;font-size:24px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#58D5E8}
h1{margin-top:28px;font-size:84px;line-height:1.02;font-weight:700;letter-spacing:-.035em}
.serif{font-family:Instrument,Georgia,serif;font-weight:400;letter-spacing:-.01em}
.q{font-family:Instrument,Georgia,serif;font-size:92px;line-height:1.0;margin-top:14px}
.body{margin-top:32px;font-size:36px;line-height:1.4;color:#B2C3D1;max-width:26ch}
.choices{margin-top:56px;display:grid;gap:22px}.choice{display:flex;align-items:center;gap:28px;border:2px solid #40576B;border-radius:10px;padding:26px 32px;font-size:44px;font-weight:600;background:#101A27}
.choice b{display:inline-grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#7C9CFF;color:#090D17;font-size:34px}.choice span.qm{margin-left:auto;color:#58D5E8;font-family:Instrument,Georgia,serif;font-size:56px}
.swipe{margin-top:auto;font-size:30px;color:#F1F7FA;font-weight:600}
.big{font-family:Instrument,Georgia,serif;font-size:150px;line-height:.95;margin-top:24px;letter-spacing:-.02em}.big .arrow{color:#58D5E8}
.bars{margin-top:72px;display:grid;gap:48px}.bar{display:grid;grid-template-columns:250px 1fr 170px;align-items:center;gap:24px;font-size:42px}
.track{height:88px;background:#162330;border-radius:6px;overflow:hidden}.fill{height:100%;background:#6D849A}.hi .fill{background:#58D5E8}.hi{font-weight:700}.val{text-align:right;font-variant-numeric:tabular-nums}
.sum{margin-top:52px;font-size:34px;color:#A8BAC9;font-variant-numeric:tabular-nums}
.pct{font-family:Instrument,Georgia,serif;font-size:260px;line-height:.9;color:#58D5E8;margin-top:20px}
.limit{margin-top:36px;padding:28px 32px;border-left:6px solid #F2CF8A;background:#30291B;font-size:30px;line-height:1.4;color:#F1F7FA;max-width:30ch}
.cta{margin-top:auto;align-self:flex-start;background:#7C9CFF;color:#090D17;font-size:44px;font-weight:700;padding:28px 44px;border-radius:8px}
.foot{margin-top:40px;padding-top:22px;border-top:1px solid #33485A;font-size:22px;line-height:1.45;color:#A8BAC9}.foot b{color:#F1F7FA;font-weight:600;letter-spacing:.08em}
.spacer{flex:1}
.totals{margin-top:56px;display:grid;gap:26px}.trow{display:grid;grid-template-columns:110px 1fr;align-items:center;gap:22px;font-size:32px;color:#A8BAC9}.trow .track{height:72px}.trow .fill{display:flex;align-items:center;justify-content:flex-end;padding-right:22px;font-size:34px;font-weight:700;color:#090D17;background:#7C9CFF}.trow.now .fill{background:#58D5E8}.axis{font-size:22px;color:#6D849A;margin-left:132px}`;
const foot=`<p class="foot"><b>ILLUSTRATIVE EXAMPLE · MADE-UP FIGURES</b><br>Not a customer result. Not tax advice or a finding that any bill is wrong.</p>`;
const top=i=>`<div class="top"><div class="brand">ifyoumind</div><div class="count">${i}/5</div></div>`;
const bar=(label,v,hi)=>`<div class="bar${hi?' hi':''}"><span>${label}</span><div class="track"><div class="fill" style="width:${(v/school*100).toFixed(1)}%"></div></div><span class="val">+${usd(v)}</span></div>`;
const slides=[
 {id:'01-quiz',alt:`Quiz slide with made-up figures: "This tax bill went up $420. Which line did most of it?" Three choices: A, County. B, School. C, Municipal. Swipe for the answer.`,
  html:`${top(1)}<p class="eyebrow">Quick quiz · made-up example</p><h1>This tax bill<br>went up ${usd(inc)}.</h1><p class="q">Which line did most of it?</p><div class="choices"><div class="choice"><b>A</b>County<span class="qm">?</span></div><div class="choice"><b>B</b>School<span class="qm">?</span></div><div class="choice"><b>C</b>Municipal<span class="qm">?</span></div></div><p class="swipe" style="margin-top:44px">Guess, then swipe →</p><div class="spacer"></div>${foot}`},
 {id:'02-total',alt:`Same home, two years, made-up figures: total property tax was $4,200 in 2024 and $4,620 in 2025, up $420, about 10 percent.`,
  html:`${top(2)}<p class="eyebrow">Same home · two years</p><p class="big">${usd(t0)} <span class="arrow">→</span><br>${usd(t1)}</p><p class="body">Total property tax, ${fx.columns[0]} to ${fx.columns[1]}. Up ${usd(inc)}, about ${pct}%.</p><div class="totals" role="img"><div class="trow"><span>${fx.columns[0]}</span><div class="track"><div class="fill" style="width:${(t0/t1*100).toFixed(1)}%">${usd(t0)}</div></div></div><div class="trow now"><span>${fx.columns[1]}</span><div class="track"><div class="fill" style="width:100%">${usd(t1)}</div></div></div><p class="axis">Bars start at $0</p></div><p class="body" style="color:#F1F7FA">Three lines on the bill changed. Which one matters most?</p><div class="spacer"></div>${foot}`},
 {id:'03-answer',alt:`The answer is B, School. Increase by line in the made-up example: County plus $90, School plus $240, Municipal plus $90. $90 plus $240 plus $90 equals $420.`,
  html:`${top(3)}<p class="eyebrow">The answer</p><h1>B. <span class="serif" style="font-size:110px">School.</span></h1><div class="bars">${bar('County',county)}${bar('School',school,true)}${bar('Municipal',muni)}</div><p class="sum">${usd(county)} + ${usd(school)} + ${usd(muni)} = ${usd(inc)} increase</p><div class="spacer"></div>${foot}`},
 {id:'04-meaning',alt:`School tax was 57.1 percent of the $420 increase in this made-up example. That shows where to look first. It does not show the bill is wrong; an assessment notice and local tax rates explain why it changed.`,
  html:`${top(4)}<p class="eyebrow">What it tells you</p><p class="pct">${Math.round(school/inc*100)}%</p><p class="body" style="color:#F1F7FA;max-width:28ch">of the increase came from one line: ${usd(school)} of ${usd(inc)} (${share}%).</p><p class="body">Now you know where to look first.</p><p class="limit">It doesn’t mean the bill is wrong. Your assessment notice and local tax rates explain <i>why</i> a line changed.</p><div class="spacer"></div>${foot}`},
 {id:'05-try',alt:`Find the line that moved. Explore the free property-tax example at ifyoumind.com. No account needed for the example.`,
  html:`${top(5)}<p class="eyebrow">Try it yourself</p><h1>Find the line<br><span class="serif" style="font-size:104px">that moved.</span></h1><p class="body">Open the free property-tax example and see every number behind the answer. No account needed.</p><div class="cta">ifyoumind.com</div>${foot}`},
];
(async()=>{fs.mkdirSync(out,{recursive:true}); const b=await chromium.launch({executablePath:process.env.PW_CHROMIUM});
const c=await b.newContext({viewport:{width:1080,height:1350},deviceScaleFactor:1});
await c.route('**/*',r=>{const u=r.request().url(); return /^(file:|data:|https:\/\/fonts\.(googleapis|gstatic)\.com)/.test(u)?r.continue():r.abort();});
const rec=[];
for(const s of slides){ const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"><style>${css}</style></head><body><main>${s.html}</main></body></html>`;
 const hf=path.join(out,`slide-${s.id}.html`); fs.writeFileSync(hf,html); const p=await c.newPage(); await p.goto('file://'+hf); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(300);
 const chk=await p.evaluate(()=>({ox:document.documentElement.scrollWidth-innerWidth,oy:document.documentElement.scrollHeight-innerHeight,inter:document.fonts.check('700 40px Inter'),serif:document.fonts.check('40px Instrument')}));
 if(chk.ox>0||chk.oy>0||!chk.inter||!chk.serif) throw Error(s.id+' render check '+JSON.stringify(chk));
 const png=path.join(out,`slide-${s.id}.png`); await p.screenshot({path:png}); await p.close(); rec.push({id:s.id,alt:s.alt}); }
await b.close(); fs.writeFileSync(path.join(out,'alt-text.json'),JSON.stringify(rec,null,1)); console.log('rendered',rec.length);})().catch(e=>{console.error(e.message);process.exit(1)});
