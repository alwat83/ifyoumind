// Genuine 1080x1920 product footage: device-pixel screenshots of the live site during a real interaction.
// Illustrative example data only; analytics consent preset to rejected; Google blocked.
const { chromium } = require('playwright'); const fs=require('fs'); const os=require('os');
const out=process.argv[2]; const exe=`${os.homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
(async()=>{const b=await chromium.launch({executablePath:exe});
const c=await b.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
await c.addInitScript(()=>localStorage.setItem('ifyoumind_cookie_consent',JSON.stringify({version:'ga4-analytics-v1',analytics:false,at:Date.now()})));
let g=0; await c.route(/googletagmanager|google-analytics|analytics\.google|doubleclick/, r=>{g++; return r.abort();});
const p=await c.newPage(); p.setDefaultTimeout(15000);
await p.goto('https://ifyoumind.com/',{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(800);
const shots=[]; let n=0; const t0=Date.now();
const hold=async(label,secs)=>{ const end=Date.now()+secs*1000; do { const name=`f${String(n++).padStart(5,'0')}.png`; await p.screenshot({path:`${out}/frames/${name}`}); shots.push({name,label,t:(Date.now()-t0)/1000}); } while(Date.now()<end); };
await hold('homepage hero',2.5);
await p.getByRole('button',{name:'Reveal what changed'}).tap(); await p.waitForTimeout(400);
await hold('finding $420 / $240',3.5);
await p.locator('details.home-evidence summary').tap(); await p.waitForTimeout(300);
await p.locator('details.home-evidence').evaluate(e=>e.scrollIntoView({block:'start'})); await p.waitForTimeout(300);
await hold('evidence opened',3.5);
await p.evaluate(()=>window.scrollBy(0,420)); await p.waitForTimeout(250);
await hold('evidence detail',3);
const open=await p.locator('details.home-evidence').evaluate(e=>e.open);
fs.writeFileSync(`${out}/frames.json`,JSON.stringify({source:'https://ifyoumind.com/ (live Hosting ab3e2779ba205697)',capturedAt:new Date().toISOString(),viewport:'540x960 CSS @2x = 1080x1920',consent:'rejected (preset)',googleRequests:g,evidenceOpened:open,frames:shots},null,1));
console.log('frames',shots.length,'fps~',(shots.length/shots.at(-1).t).toFixed(1),'googleRequests',g,'evidenceOpened',open); await b.close();})().catch(e=>{console.error('ERR',e.message.split('\n')[0]);process.exit(1)});
