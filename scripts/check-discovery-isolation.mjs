// Build-time regression guard for the local-only Phase 1 boundary. No network or private input.
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {allowedDiscoveryAsset} from './install-discovery.mjs';
const args=new Set(process.argv.slice(2));
const production=args.has('--production')||(!args.has('--preview')&&!args.has('--electricity')&&!args.has('--unified'));
const preview=args.has('--preview')||args.has('--electricity')||args.has('--unified')||!args.has('--production');
if(production){
 const root=resolve('dist/ifyoumind-deploy/browser');
 const files=(await readdir(root)).filter(name=>name.endsWith('.js'));
 for(const file of files){const content=await readFile(resolve(root,file),'utf8');if(/app-tax-discovery|app-unified-discovery|Rerun discovery|county_usd|consumption_kwh/.test(content))throw new Error(`Local discovery code in production: ${file}`);}
 console.log(`PASS: ${files.length} production JS files exclude the discovery experience`);
 const island=resolve(root,'discover');
 const assets=await readdir(island);
 if(assets.some(name=>!allowedDiscoveryAsset(name)))throw new Error('Unapproved public discovery file');
 const html=await readFile(resolve(island,'index.html'),'utf8');
 for(const required of ['<app-unified-discovery>','<base href="/discover/">',"connect-src 'none'",'noindex,nofollow','https://ifyoumind.com/discover/'])if(!html.includes(required))throw new Error(`Public discovery boundary missing: ${required}`);
 for(const [,src] of html.matchAll(/<script[^>]*src="([^"]+)"/g))if(!src.startsWith('/discover/'))throw new Error('Public discovery script outside approved path');
 let hasBoth=false;
 for(const name of assets.filter(name=>name.endsWith('.js'))){const body=await readFile(resolve(island,name),'utf8');if(/cloudfunctions\.net|firebaseapp\.com|google-analytics\.com|api\.openai\.com/.test(body))throw new Error(`Provider or preview copy in public island: ${name}`);hasBoth ||= body.includes('consumption_kwh')&&body.includes('county_usd')&&body.includes('app-unified-discovery');}
 if(!hasBoth)throw new Error('Both public discovery categories must be built');
 if((await readFile(resolve(root,'sitemap.xml'),'utf8')).includes('/discover'))throw new Error('Noindex discovery pilot must stay outside sitemap');
 console.log(`PASS: ${assets.length} allowlisted public /discover/ assets, both categories, no provider endpoints, noindex`);
}
if(preview){
 const root=resolve(args.has('--unified')?'dist/ifyoumind-unified/browser':args.has('--electricity')?'dist/ifyoumind-electricity/browser':'dist/ifyoumind-discovery/browser');
 const html=await readFile(resolve(root,'index.html'),'utf8');
 const selector=args.has('--unified')?'app-unified-discovery':'app-tax-discovery';
 if(!html.includes('<'+selector+'>'))throw new Error('Preview HTML bootstrap selector missing');
 if(!html.includes("connect-src 'none'")||!html.includes('noindex,nofollow'))throw new Error('Preview privacy/indexing boundary missing');
 if(/(?:src|href)="https?:/i.test(html))throw new Error('External preview asset');
 let entryFound=false;
 for(const file of (await readdir(root)).filter(name=>name.endsWith('.js'))){const content=await readFile(resolve(root,file),'utf8');entryFound ||= content.includes('app-tax-discovery');if(/cloudfunctions\.net|api\.openai\.com|firebaseapp\.com|google-analytics\.com/.test(content))throw new Error(`Service dependency in local preview: ${file}`);}
 if(!entryFound)throw new Error('Preview entry not built');
 console.log('PASS: standalone discovery bundle, no provider endpoints, connect-src none, noindex');
}
