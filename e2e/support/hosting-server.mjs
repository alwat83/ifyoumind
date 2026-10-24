// Actual Firebase Hosting emulator; loopback/demo project only. No deployments or cloud credentials.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {spawn} from 'node:child_process';
const config=JSON.parse(await readFile('firebase.json','utf8'));
const port=Number(process.env.DISCOVER_PORT||4316);
const filename=resolve('tmp/discovery-integration/hosting-emulator.json');
config.hosting.public=relative(dirname(filename),resolve('dist/ifyoumind-deploy/browser'));
const local={hosting:config.hosting,emulators:{hosting:{host:'127.0.0.1',port},ui:{enabled:false},singleProjectMode:true}};
await mkdir('tmp/discovery-integration',{recursive:true});
await writeFile(filename,JSON.stringify(local));
const env={...process.env};
for(const name of ['GOOGLE_APPLICATION_CREDENTIALS','FIREBASE_TOKEN','GCP_SA_KEY'])delete env[name];
const child=spawn(process.execPath,['node_modules/firebase-tools/lib/bin/firebase.js','emulators:start','--only','hosting','--project','demo-ifyoumind','--config',filename],{stdio:'inherit',env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>{process.exitCode=code||0;});
