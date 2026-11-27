// Inject the captured live banner into each prototype; check every primary control is fully above it; screenshot before/after.
const { chromium } = require('playwright'); const fs=require('fs'); const { exe } = require('./measure.js');
const [bannerFile, protoDir, outDir]=process.argv.slice(2); const B=JSON.parse(fs.readFileSync(bannerFile));
const P=process.env.ONLY?{}:{a:['a-clarity.html','#go'],b:['b-guess.html','.choice'],c:['c-annotated.html','#t']};Object.assign(P,{bp:['bplus-check.html','.own, .tab, .claim']});
(async()=>{const br=await chromium.launch({executablePath:exe});
for (const [k,[f,sel]] of Object.entries(P)) for (const [w,h] of [[1280,800],[390,664],[375,553],[320,568]]) { const m=w<800, ban=B[`${w}x${h}`];
 const c=await br.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:m,hasTouch:m}); const p=await c.newPage();
 await p.goto('file://'+protoDir+'/'+f,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(([html,hgt])=>{document.body.insertAdjacentHTML('beforeend',html);document.documentElement.style.setProperty('--consent-banner-height',hgt+'px');},[ban.html,ban.height]);
 await p.waitForTimeout(300);
 const r=await p.evaluate(s=>{const bt=document.querySelector('.cookie-consent-banner').getBoundingClientRect().top;return {bt:Math.round(bt),els:[...document.querySelectorAll(s)].map(e=>{const q=e.getBoundingClientRect();return {t:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,22),top:Math.round(q.top),bot:Math.round(q.bottom),h:Math.round(q.height),w:Math.round(q.width),clear:q.bottom<=bt&&q.top>=0}}),ox:document.documentElement.scrollWidth>innerWidth}},sel);
 const bad=r.els.filter(e=>!e.clear); console.log(k.padEnd(3),`${w}x${h}`,'bannerTop',r.bt,bad.length?'COVERED: '+bad.map(e=>`${e.t}(${e.top}-${e.bot})`).join(', '):'ALL CLEAR', 'minH',Math.min(...r.els.map(e=>e.h)), 'lastBottom',Math.max(...r.els.map(e=>e.bot)), r.ox?'OVERFLOW':'');
 await p.screenshot({path:`${outDir}/${k}-${w}x${h}-banner.png`});
 if(k==='bp'){ await p.locator('.claim').first().click(); await p.waitForTimeout(2000);
  const v=await p.evaluate(()=>{const bt=document.querySelector('.cookie-consent-banner').getBoundingClientRect().top;const f=document.querySelector('.check.open .finding').getBoundingClientRect();const g=document.querySelector('.check.open .go').getBoundingClientRect();return {findingVisible:f.top>=0&&f.bottom<=bt,ctaVisible:g.bottom<=bt,live:document.getElementById('live').textContent}});
  console.log('    after tap',JSON.stringify(v)); await p.screenshot({path:`${outDir}/${k}-${w}x${h}-banner-after.png`}); }
 await c.close(); }
await br.close();})();
