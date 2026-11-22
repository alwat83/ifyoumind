const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
test('isolated production entry initializes Admin idempotently and exports only reviewed endpoints',()=>{
 process.env.GCLOUD_PROJECT='demo-ifyoumind';
 const code=fs.readFileSync(path.join(__dirname,'../../scripts/production-activation-entry.cjs'),'utf8');
 const filename=path.join(__dirname,'../lib/production-activation-entry.js');
 const load=()=>{const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(code,filename);return m.exports;};
 const first=load(),second=load();assert.deepEqual(Object.keys(first).sort(),['createMarketIntelligenceProject','explainDecisionReport','getMarketIntelligenceProject']);
 assert.deepEqual(Object.keys(second).sort(),Object.keys(first).sort());
 const {getApps}=require('firebase-admin/app');assert.equal(getApps().filter(a=>a.name==='[DEFAULT]').length,1);
 const explanation=first.explainDecisionReport.__endpoint;
 assert.equal(explanation.platform,'gcfv2');assert.equal(explanation.timeoutSeconds,20);assert.equal(explanation.maxInstances,2);assert.equal(explanation.concurrency,1);
 assert.deepEqual(explanation.secretEnvironmentVariables.map(s=>s.key),['OPENAI_API_KEY']);
 assert.deepEqual(first.createMarketIntelligenceProject.__endpoint.secretEnvironmentVariables.map(s=>s.key),['CENSUS_API_KEY']);
 assert.equal(first.getMarketIntelligenceProject.__endpoint.secretEnvironmentVariables?.length||0,0);
 assert.ok(!Object.keys(first).some(k=>/Stripe|Webhook|Checkout|Portal/.test(k)));
});
