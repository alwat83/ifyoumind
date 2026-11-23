import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fingerprint, integrity } from '../local-verification/core.mjs';
import { readRegistry,campaignFor,safePath,renderVersion,reconcile,validateRegistry,review,promote,prepare,selectedApproved,readLiveBaseline,ingestPublication,json } from './core.mjs';

const root=path.resolve(fileURLToPath(new URL('../../',import.meta.url)));
const [command,...args]=process.argv.slice(2),options={};
async function renderContactSheet(campaign,result){
  const {chromium}=await import('@playwright/test');const browser=await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL||'chrome',headless:true});
  try{const page=await browser.newPage({viewport:{width:1800,height:1150}});await page.route(url=>!['file:','data:'].includes(url.protocol),route=>route.abort());await page.goto(pathToFileURL(path.join(root,result.reviewIndex)).href);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:path.join(root,result.contactSheet),type:'jpeg',quality:92,fullPage:true});}finally{await browser.close();}
}
try{
  for(let i=0;i<args.length;i++){const flag=args[i];if(!['--campaign','--baseline','--baseline-record','--out','--offline','--promote','--publication-evidence'].includes(flag)||options[flag]!==undefined)throw Error('Unknown/duplicate marketing option');if(['--offline','--promote'].includes(flag))options[flag]=true;else{if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Option requires a value');options[flag]=args[++i];}}
  const registry=readRegistry(root),id=options['--campaign']||'property-tax';let result;
  if(command==='render'){
    const campaign=campaignFor(registry,id),renderer=safePath(root,campaign.rendererPath);
    const child=spawnSync(process.execPath,[renderer],{cwd:root,env:{...process.env,MARKETING_ASSET_VERSION:String(renderVersion(root,id))},stdio:'inherit'});if(child.error||child.status!==0)throw Error('Campaign renderer failed; canonical registry was not reconciled');
    result={reconciliation:reconcile(root,id),review:review(root,id)};
    // The shared index/contact sheet reflects canonical states/caption, not a separate campaign tracker.
    await renderContactSheet(campaign,result.review);
  }else if(command==='validate')result=validateRegistry(root,registry,{campaign:options['--campaign']});
  else if(command==='manifest')result=options['--publication-evidence']?ingestPublication(root,json(path.resolve(options['--publication-evidence']))):reconcile(root,id);
  else if(command==='review'){result=review(root,id);await renderContactSheet(campaignFor(registry,id),result);}
  else if(command==='prepare'){
    selectedApproved(root,registry,id); // Must stop before credentials, source/public writes or network on unapproved exports.
    if(options['--promote'])result=promote(root,id);
    else{
      if(!options['--baseline']||!options['--out'])throw Error('Approved release requires --baseline and --out');
      const before=await fingerprint(root);if(before.status)throw Error('Commit the approved registry/promotions before exact-source preparation');
      const baseline=path.resolve(options['--baseline']),out=path.resolve(options['--out']);
      const record=options['--baseline-record']?json(safePath(root,options['--baseline-record'])):null;
      const liveSnapshot=options['--offline']?null:await readLiveBaseline(root,baseline,record);
      result=await prepare(root,id,{baseline,out,source:{sha:before.head,digest:before.digest,clean:!before.status},liveSnapshot,offline:Boolean(options['--offline'])});
      const after=await fingerprint(root);if(!integrity(before,after,before.head)){fs.writeFileSync(path.join(out,'INVALID.json'),JSON.stringify({status:'INVALID_SOURCE_CHANGED',deployExecuted:false}));throw Error('Source changed; prepared package is INVALID');}
      fs.mkdirSync(path.join(root,'test-results','marketing-assets'),{recursive:true});fs.writeFileSync(path.join(root,'test-results','marketing-assets','last-prepare.json'),JSON.stringify(result,null,2)+'\n');
    }
  }else throw Error('Use render, validate, manifest, review or prepare; this tool has no deploy/publish command');
  console.log(JSON.stringify(result,null,2));
}catch(error){console.error(JSON.stringify({status:error.message.startsWith('BLOCKED:')?'BLOCKED':'FAIL',message:error.message,deployExecuted:false,publishExecuted:false}));process.exitCode=error.message.startsWith('BLOCKED:')?2:1;}
