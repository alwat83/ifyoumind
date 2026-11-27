// Renders and keyboard/a11y probes for B+: no banner (consent preset as in shoot.js is N/A for file://), several states.
const { chromium } = require('playwright'); const { exe } = require('./measure.js'); const [url,out]=process.argv.slice(2);
(async()=>{const b=await chromium.launch({executablePath:exe});
for (const [w,h] of [[1280,800],[390,844],[375,667],[320,568]]) { const m=w<800; const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:m,hasTouch:m}); const p=await c.newPage();
 await p.goto(url); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) console.log('OVERFLOW',w);
 await p.screenshot({path:`${out}/bp-${w}x${h}.png`});
 if(w===1280||w===390){ await p.locator('.claim').nth(0).click(); await p.waitForTimeout(1800); await p.screenshot({path:`${out}/bp-${w}x${h}-after.png`});
  await p.evaluate(()=>scrollTo(0,0)); await p.locator('.tab[data-ex=elec]').click(); await p.locator('.claim').nth(2).click(); await p.waitForTimeout(1800); await p.screenshot({path:`${out}/bp-${w}x${h}-elec-cant.png`}); }
 await c.close(); }
// keyboard: tab order from top, activate with Enter, reduced motion
const c=await b.newContext({viewport:{width:390,height:664},reducedMotion:'reduce'}); const p=await c.newPage(); await p.goto(url);
const order=[]; for(let i=0;i<6;i++){await p.keyboard.press('Tab'); order.push(await p.evaluate(()=>document.activeElement.textContent.trim().slice(0,26)));}
await p.keyboard.press('Enter'); await p.waitForTimeout(100);
const st=await p.evaluate(()=>({expanded:document.activeElement.getAttribute('aria-expanded'),live:document.getElementById('live').textContent,verdict:document.querySelector('.check.open .verdict .tag').textContent}));
console.log('tab order',JSON.stringify(order)); console.log('enter (reduced motion, 100ms)',JSON.stringify(st)); await b.close();})();
