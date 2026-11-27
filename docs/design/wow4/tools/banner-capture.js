// GET-only: load the live homepage with no stored consent, serialize the pending banner with computed styles inlined, per viewport.
const { chromium } = require('playwright'); const fs=require('fs'); const { exe } = require('./measure.js');
(async()=>{const b=await chromium.launch({executablePath:exe}); const out={};
for (const [w,h] of [[1280,800],[390,664],[375,553],[320,568]]) { const m=w<800;
 const c=await b.newContext({viewport:{width:w,height:h},isMobile:m,hasTouch:m}); await c.route(/googletagmanager|google-analytics|analytics\.google|doubleclick/, r=>r.abort());
 const p=await c.newPage(); await p.goto('https://ifyoumind.com/',{waitUntil:'load'}); await p.waitForSelector('.cookie-consent-banner'); await p.evaluate(()=>document.fonts.ready);
 out[`${w}x${h}`]=await p.evaluate(()=>{const root=document.querySelector('.cookie-consent-banner'); const props=['display','position','bottom','left','right','top','z-index','background-color','color','padding','margin','gap','flex-direction','flex-wrap','justify-content','align-items','font-family','font-size','font-weight','line-height','border','border-radius','min-height','width','max-width','text-decoration','cursor','box-shadow','text-align','flex','box-sizing','letter-spacing'];
  const clone=root.cloneNode(true); const src=[root,...root.querySelectorAll('*')], dst=[clone,...clone.querySelectorAll('*')];
  src.forEach((s,i)=>{const cs=getComputedStyle(s); dst[i].setAttribute('style',props.map(k=>`${k}:${cs.getPropertyValue(k)}`).join(';')); [...dst[i].attributes].filter(a=>a.name.startsWith('_ng')||a.name==='ng-reflect-router-link').forEach(a=>dst[i].removeAttribute(a.name));});
  clone.querySelectorAll('a').forEach(a=>a.setAttribute('href','#'));
  return {html:clone.outerHTML,height:Math.round(root.getBoundingClientRect().height),var:getComputedStyle(document.documentElement).getPropertyValue('--consent-banner-height')};});
 console.log(w,h,out[`${w}x${h}`].height,'var',out[`${w}x${h}`].var); await c.close(); }
fs.writeFileSync(process.argv[2],JSON.stringify(out)); await b.close();})();
