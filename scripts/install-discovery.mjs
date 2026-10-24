// Install only the reviewed public Angular island. Never copy preview/test/private assets.
import {copyFile,mkdir,readdir,rm,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
export function allowedDiscoveryAsset(name){return /^(?:index\.html|3rdpartylicenses\.txt|(?:main|polyfills)-[A-Z0-9]+\.js)$/.test(name);}
export async function installDiscovery(destination='dist/ifyoumind-deploy/browser'){
 const source=resolve('dist/ifyoumind-discover/browser');
 const names=await readdir(source);
 if(!names.includes('index.html')||names.some(name=>!allowedDiscoveryAsset(name)))throw new Error('Unexpected public discovery asset');
 const html=await readFile(resolve(source,'index.html'),'utf8');
 if(!html.includes('<base href="/discover/">')||!html.includes("connect-src 'none'"))throw new Error('Discovery privacy/path boundary missing');
 const target=resolve(destination,'discover');
 await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
 for(const name of names)await copyFile(resolve(source,name),resolve(target,name));
 console.log(`Installed ${names.length} allowlisted discovery assets at ${target}`);
}
if(import.meta.url===`file://${process.argv[1]}`)await installDiscovery(process.argv[2]);
