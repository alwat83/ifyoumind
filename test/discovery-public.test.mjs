import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allowedDiscoveryAsset} from '../scripts/install-discovery.mjs';
test('public island install excludes source maps, private inputs, previews and arbitrary paths',()=>{
 for(const name of ['index.html','main-ABCDEFG1.js','polyfills-ABCDEFG1.js'])assert.equal(allowedDiscoveryAsset(name),true);
 for(const name of ['private.csv','statement.pdf','main-X.js.map','chunk-XYZ.js','../index.html','tmp','data.json','app-shell.html','main-X.js/secret'])assert.equal(allowedDiscoveryAsset(name),false,name);
});
test('discovery Hosting redirect and privacy headers preserve existing Business rewrites',()=>{
 const {hosting}=JSON.parse(readFileSync('firebase.json','utf8'));
 assert.deepEqual(hosting.redirects.find(r=>r.regex==='^/discover$'),{regex:'^/discover$',destination:'/discover/',type:301});
 assert.equal(hosting.rewrites.some(r=>r.source.includes('discover')),false);
 for(const path of ['/login','/register','/app/**'])assert.equal(hosting.rewrites.find(r=>r.source===path)?.destination,'/app-shell.html');
 const headers=hosting.headers.find(r=>r.source==='/discover/**').headers;
 assert.match(headers.find(h=>h.key==='Content-Security-Policy').value,/connect-src 'none'/);
 assert.match(headers.find(h=>h.key==='X-Robots-Tag').value,/noindex/);
});
