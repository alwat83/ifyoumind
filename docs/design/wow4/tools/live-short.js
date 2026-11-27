// GET-only: live homepage, pending banner, first action position.
const { chromium } = require('playwright'); const { exe } = require('./measure.js');
(async()=>{const b=await chromium.launch({executablePath:exe});
for (const [w,h] of [[1280,800],[390,664],[375,553],[320,568]]) { const m=w<800; const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:m,hasTouch:m});
 await c.route(/googletagmanager|google-analytics|analytics\.google|doubleclick/, r=>r.abort()); const p=await c.newPage(); await p.goto('https://ifyoumind.com/',{waitUntil:'load'}); await p.waitForSelector('.cookie-consent-banner'); await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const a=document.querySelector('.first-action').getBoundingClientRect(),bt=document.querySelector('.cookie-consent-banner').getBoundingClientRect().top;return {t:document.querySelector('.first-action').innerText.trim().slice(0,30),top:Math.round(a.top),bot:Math.round(a.bottom),bt:Math.round(bt),clear:a.bottom<=bt}});
 console.log('live',`${w}x${h}`,JSON.stringify(r)); await p.screenshot({path:`${process.argv[2]}/live-${w}x${h}-banner.png`}); await c.close(); }
await b.close();})();
