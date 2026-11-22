import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { files, verifyArtifact } from '../hosting-release/artifact.mjs';

export const REGISTRY='docs/marketing/assets.json';
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export const canonicalHash=value=>sha256(JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v));
export const json=file=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw Error('Cannot read valid JSON metadata; file contents omitted');}};
const now=()=>new Date().toISOString();
const clone=value=>JSON.parse(JSON.stringify(value));
const fail=message=>{throw Error(message);};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const presets=json(new URL('./presets.json',import.meta.url));
const immutable=a=>['approved','hosted','published','archived'].includes(a.state);
const states=['draft','review-ready','approved','hosted','published','archived'];

/** Relative regular files only. No traversal, outside-root reads or symlink promotion. */
export function safePath(root,relative,{missing=false,roots=['docs/marketing/','public/assets/marketing/']}={}){
  if(typeof relative!=='string'||path.isAbsolute(relative)||relative.includes('\\')||relative!==path.posix.normalize(relative)||relative.split('/').some(p=>!p||p==='.'||p==='..')||!roots.some(p=>relative.startsWith(p)))fail('Unsafe marketing path');
  let current=path.resolve(root);
  for(const part of relative.split('/')){current=path.join(current,part);try{if(fs.lstatSync(current).isSymbolicLink())fail('Symlink marketing path refused');}catch(e){if(e.code!=='ENOENT')throw e;if(!missing)fail('Missing marketing file: '+relative);}}
  return current;
}
export function readRegistry(root){const r=json(safePath(root,REGISTRY));if(r.schemaVersion!==2||r.site!=='https://ifyoumind.com'||!Array.isArray(r.assets)||!Array.isArray(r.campaigns))fail('Unsupported canonical registry');return r;}
export function writeRegistry(root,registry,expectedHash){const file=safePath(root,REGISTRY);if(expectedHash&&sha256(fs.readFileSync(file))!==expectedHash)fail('Registry changed concurrently');const body=JSON.stringify(registry,null,2)+'\n';if(fs.readFileSync(file,'utf8')===body)return false;const temp=file+'.tmp';fs.writeFileSync(temp,body,{flag:'wx'});fs.renameSync(temp,file);return true;}
export function campaignFor(registry,id){return registry.campaigns.find(c=>c.id===id)||fail('Unknown campaign');}
export function renderVersion(root,id){const r=readRegistry(root),c=campaignFor(r,id),versions=r.assets.filter(a=>a.campaign===id);const last=Math.max(c.initialVersion,...versions.map(a=>a.version));return versions.some(a=>a.version===last&&immutable(a))?last+1:last;}
export function exportName(campaign,slide,version,extension='jpg'){if(!/^[a-z][a-z0-9-]{1,70}$/.test(campaign)||!Number.isSafeInteger(slide)||slide<1||slide>99||!Number.isSafeInteger(version)||version<1||!['jpg','mp4','html'].includes(extension))fail('Invalid versioned asset name');return `${campaign}-carousel-${String(slide).padStart(2,'0')}-v${version}.${extension}`;}

/** Header/type checks are paired with exact hashes and actual browser decode/render receipts. */
export function jpegInfo(bytes){
  if(bytes.length<20||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)fail('Invalid or truncated JPEG');
  let p=2,dimensions;
  while(p<bytes.length-2){if(bytes[p++]!==255)fail('Invalid JPEG segment');while(bytes[p]===255)p++;const marker=bytes[p++];if(marker===0xda)break;if(marker===0xd9)break;if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;const size=bytes.readUInt16BE(p);if(size<2||p+size>bytes.length)fail('Truncated JPEG segment');if([0xc0,0xc1,0xc2].includes(marker)){if(size<8)fail('Invalid JPEG frame');dimensions={width:bytes.readUInt16BE(p+5),height:bytes.readUInt16BE(p+3),components:bytes[p+7]};}p+=size;}
  if(!dimensions||![1,3].includes(dimensions.components)||!dimensions.width||!dimensions.height)fail('Unsupported JPEG frame/color channels');return{width:dimensions.width,height:dimensions.height,mimeType:'image/jpeg'};
}
export function probe(root,relative,presetId){
  const preset=presets.presets[presetId]||fail('Unknown export preset'),file=safePath(root,relative),size=fs.statSync(file).size;if(!size||size>preset.maxBytes)fail('Platform file-size limit exceeded');
  let info;
  if(preset.mimeType==='image/jpeg'){if(!relative.endsWith('.jpg'))fail('JPEG export must use .jpg');info=jpegInfo(fs.readFileSync(file));}
  else{
    if(!relative.endsWith('.mp4'))fail('Video export must use .mp4');let meta;try{meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{timeout:15000,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe']}));}catch{fail('MP4 validation requires a working existing ffprobe; no software was installed');}
    const video=meta.streams?.find(s=>s.codec_type==='video'),audio=meta.streams?.filter(s=>s.codec_type==='audio')||[],fps=video?.avg_frame_rate?.split('/').map(Number),rate=fps?.[0]/fps?.[1],duration=Number(meta.format?.duration);
    if(!meta.format?.format_name?.includes('mp4')||!['h264','hevc'].includes(video?.codec_name)||video.pix_fmt!=='yuv420p'||rate<preset.minFps||rate>preset.maxFps||!Number.isFinite(rate)||duration<preset.minSeconds||duration>preset.maxSeconds||!Number.isFinite(duration)||Number(video.bit_rate)>25000000||audio.some(a=>a.codec_name!=='aac'||!['1','2'].includes(String(a.channels))||Number(a.sample_rate)!==48000))fail('MP4 codec/rate/duration requirements failed');
    const fd=fs.openSync(file,'r'),head=Buffer.alloc(Math.min(size,1024*1024));try{fs.readSync(fd,head,0,head.length,0);}finally{fs.closeSync(fd);}const moov=head.indexOf('moov'),mdat=head.indexOf('mdat');if(preset.requiresFaststart&&(moov<0||mdat>=0&&moov>mdat))fail('MP4 fast-start/moov verification failed');info={width:video.width,height:video.height,mimeType:'video/mp4',fps:rate,duration};
  }
  if(info.width!==preset.width||info.height!==preset.height||info.mimeType!==preset.mimeType)fail('Preset dimensions or MIME mismatch');return{...info,bytes:size};
}
function fileHash(file){const fd=fs.openSync(file,'r'),h=createHash('sha256'),buffer=Buffer.alloc(1024*1024);try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));}finally{fs.closeSync(fd);}return h.digest('hex');}
function privateText(text){return /\b(?:sk_live_|sk_test_|whsec_|sk-proj-)[A-Za-z0-9_-]+|Bearer\s+[A-Za-z0-9._-]+|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b\d{3}-\d{2}-\d{4}\b/i.test(text);}
function validPublication(platform,e){
  if(!/^[0-9_]+$/.test(String(e.postId))||!Number.isFinite(Date.parse(e.publishedAt))||!e.evidenceReference)return false;
  try{const u=new URL(e.permalink);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)return false;
    if(platform==='instagram')return u.hostname==='www.instagram.com'&&/^\/(p|reel)\/[A-Za-z0-9_-]+\/$/.test(u.pathname);
    if(platform==='facebook')return ['www.facebook.com','facebook.com'].includes(u.hostname)&&/^\/[^/]+\/(posts|videos)\/[^/]+\/?$/.test(u.pathname);
    if(platform==='tiktok')return u.hostname==='www.tiktok.com'&&new RegExp('^/@[A-Za-z0-9_.]+/video/'+e.postId+'/?$').test(u.pathname);
  }catch{}return false;
}
function finalApproval(a){return a.approval?.status==='approved'&&a.approval.scope==='final-export'&&a.approval.sha256===a.sha256&&typeof a.approval.reference==='string'&&a.approval.reference.length>5;}
function approvedCaption(root,a){if(!a.captionSourcePath)return false;const bytes=fs.readFileSync(safePath(root,a.captionSourcePath));return a.captionApproval?.status==='approved'&&a.captionApproval.sha256===sha256(bytes)&&typeof a.captionApproval.reference==='string'&&a.captionApproval.reference.length>5;}

export function validateRegistry(root,r=readRegistry(root),{campaign}={}){
  const ids=new Set(),paths=new Map(),results=[];
  for(const a of r.assets){
    if(ids.has(a.assetId)||typeof a.assetId!=='string'||!/^[a-z][a-z0-9-]{1,100}$/.test(a.assetId)||!states.includes(a.state))fail('Duplicate/invalid asset ID or invalid state');ids.add(a.assetId);
    if(paths.has(a.exportPath)&&paths.get(a.exportPath)!==a.sha256)fail('Conflicting shared export');paths.set(a.exportPath,a.sha256);
    if(campaign&&a.campaign!==campaign)continue;
    const preset=presets.presets[a.preset]||fail('Unknown preset');if(a.platform!==preset.platform||!Number.isSafeInteger(a.version)||a.version<1||!a.altText?.trim()||![a.createdAt,a.updatedAt].every(t=>typeof t==='string'&&Number.isFinite(Date.parse(t))))fail('Asset metadata incomplete');
    const file=safePath(root,a.exportPath),facts=probe(root,a.exportPath,a.preset);if(fileHash(file)!==a.sha256||facts.width!==a.width||facts.height!==a.height||facts.mimeType!==a.mimeType||facts.bytes!==a.bytes||path.basename(a.exportPath)!==a.filename)fail('Asset metadata/checksum mismatch: '+a.assetId);
    if(a.state!=='archived'&&!a.legacyFilename&&!/-v\d+\.(jpg|mp4)$/.test(a.filename))fail('Export filename must be versioned');
    if(!a.privacy||!['synthetic-public-only','public-brand'].includes(a.privacy.classification)||!a.privacy.reference||privateText(a.altText))fail('Privacy attestation or text check failed');
    if(a.captionSourcePath){const caption=fs.readFileSync(safePath(root,a.captionSourcePath),'utf8');if(sha256(caption)!==a.captionSha256||privateText(caption))fail('Caption integrity/privacy check failed');}
    if(['approved','hosted','published'].includes(a.state)&&!finalApproval(a))fail('Final export approval is not bound to current bytes');
    if(a.deployment?.status==='hosted'||['hosted','published'].includes(a.state)){if(!finalApproval(a)||a.deployment?.status!=='hosted'||!a.deployment.hostingVersion||!a.deployment.hostingRelease||a.deployment.publicUrl!==r.site+'/'+a.deployment.publicPath)fail('Hosting evidence missing/inconsistent');}
    else if(a.deployment?.publicUrl)fail('Unhosted draft must not claim a public URL');
    if((a.socialPublication?.status==='published'||a.state==='published')&&(a.socialPublication?.status!=='published'||a.socialPublication.platform!==a.platform||!validPublication(a.platform,a.socialPublication)))fail('Publication receipt missing');
    if(a.renderReceiptPath&&a.state!=='archived'){
      const receipt=json(safePath(root,a.renderReceiptPath)),v=receipt.assets.find(x=>x.filename===a.filename);if(!v||v.sha256!==a.sha256||v.sourceSha256!==a.sourceSha256||v.sourceSha256!==sha256(fs.readFileSync(safePath(root,a.sourcePath)))||receipt.externalRequests!==0||receipt.pageErrors!==0)fail('Render receipt is stale/inconsistent');
      const c=v.checks;if(!c||c.overflow!==false||!Array.isArray(c.clipped)||c.clipped.length||c.fontLoaded!==true||c.imageLoaded!==true||!['contentBottom','noteTop','footerBottom','minContrast','minMobileNarrativePx','disclosurePxAt360'].every(k=>Number.isFinite(c[k]))||c.contentBottom>c.noteTop-18||c.footerBottom>a.height-43||c.minContrast<4.5||c.minMobileNarrativePx<13||c.disclosurePxAt360<10||!Array.isArray(c.barWidths)||c.barWidths.some(x=>!Number.isFinite(x.ratio)||!Number.isFinite(x.expected)||Math.abs(x.ratio-x.expected)>.001))fail('Typography/bounds/contrast checks failed');
      const campaign=campaignFor(r,a.campaign),disclosures=campaign.requiredDisclosures;
      const html=fs.readFileSync(safePath(root,a.sourcePath),'utf8');if(!Array.isArray(disclosures)||!disclosures.length||privateText(html)||!disclosures.every(s=>typeof s==='string'&&s.length>5&&html.includes(s)))fail('Required disclosure/privacy text missing');
      if(a.campaign==='property-tax'){const proof=json(path.join(root,'src/app/intelligence/home-bill-examples.json')).tax,n=receipt.numericalValidation;if(sha256(fs.readFileSync(path.join(root,'src/app/intelligence/home-bill-examples.json')))!==receipt.sourceSha256||proof.rows[0].values.join(',')!=='$4,200.00,$4,620.00'||proof.rows[1].values.join(',')!=='$2,400.00,$2,640.00'||n.increase!==420||n.school!==240||n.other!==180||n.county!==90||n.municipal!==90||n.displayedShare!=='57.1%')fail('Numerical source/provenance changed');const p=receipt.productPreview;if(p.url!=='https://ifyoumind.com/?example=tax'||p.retouching!==false||sha256(fs.readFileSync(safePath(root,'docs/marketing/drafts/property-tax/sources/live-tax-finding.png')))!==p.sha256)fail('Product preview provenance changed');}
    }
    results.push({assetId:a.assetId,state:a.state,preset:a.preset,sha256:a.sha256,status:'PASS'});
  }
  if(!results.length)fail('No assets selected');return{status:'PASS',count:results.length,assets:results,hostedCI:false};
}

export function reconcile(root,id){
  const oldBytes=fs.readFileSync(safePath(root,REGISTRY)),r=readRegistry(root),c=campaignFor(r,id),receipt=json(safePath(root,c.receiptPath)),timestamp=now(),captionPath=path.posix.dirname(c.receiptPath)+`/caption-v${receipt.version}.txt`,caption=fs.readFileSync(safePath(root,captionPath));
  for(const [i,v] of receipt.assets.entries()){
    const version=receipt.version,assetId=exportName(id,i+1,version).replace(/\.jpg$/,''),exportPath=path.posix.dirname(c.receiptPath)+'/'+v.filename,sourcePath=exportPath.replace(/\.jpg$/,'.html'),prior=r.assets.find(a=>a.assetId===assetId);
    if(v.filename!==exportName(id,i+1,version))fail('Renderer emitted an unversioned/misordered export');
    const facts=probe(root,exportPath,c.preset),fresh={assetId,campaign:id,collectionId:`${id}-carousel-v${version}`,platform:presets.presets[c.preset].platform,preset:c.preset,channel:c.channel,slide:i+1,version,filename:v.filename,sourcePath,sourceSha256:v.sourceSha256,exportPath,renderReceiptPath:path.posix.dirname(c.receiptPath)+`/render-receipt-v${version}.json`,...facts,sha256:v.sha256,altText:v.altText,captionSourcePath:captionPath,captionSha256:sha256(caption),privacy:clone(c.privacy)};
    if(prior&&immutable(prior)&&Object.entries(fresh).some(([k,v])=>!equal(prior[k],v)))fail('Approved/published/archive version is immutable; render a new version');
    if(prior){Object.assign(prior,fresh);if(!immutable(prior)){prior.state='review-ready';prior.validation={status:'PASS',kind:'render-receipt'};}}
    else r.assets.push({...fresh,state:'review-ready',approval:{status:'pending'},captionApproval:{status:'pending'},deployment:{status:'not-deployed',publicUrl:null},socialPublication:{status:'not-published',postId:null,permalink:null,publishedAt:null},validation:{status:'PASS',kind:'render-receipt'},createdAt:timestamp,updatedAt:timestamp});
  }
  validateRegistry(root,r,{campaign:id});
  for(const a of r.assets){const prior=JSON.parse(oldBytes).assets.find(p=>p.assetId===a.assetId);if(prior&&!equal(prior,a))a.updatedAt=timestamp;}
  if(!equal(JSON.parse(oldBytes),r))r.updatedAt=timestamp;writeRegistry(root,r,sha256(oldBytes));return validateRegistry(root,r,{campaign:id});
}

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function review(root,id){
  const r=readRegistry(root),c=campaignFor(r,id);validateRegistry(root,r,{campaign:id});const current=r.assets.filter(a=>a.campaign===id&&a.state!=='archived'),version=Math.max(...current.map(a=>a.version)),selected=current.filter(a=>a.version===version).sort((a,b)=>a.slide-b.slide),directory=path.dirname(c.receiptPath),caption=fs.readFileSync(safePath(root,selected[0].captionSourcePath),'utf8');
  const css='body{margin:0;background:#090d17;color:#f1f7fa;font:20px Arial;padding:32px}a{color:#58d5e8}p{color:#a8bac9}section{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{font-size:16px;margin-top:10px}pre{white-space:pre-wrap;font:18px/1.5 Arial}@media(max-width:900px){section{grid-template-columns:repeat(2,1fr)}}';
  const gallery=selected.map(a=>`<figure><a href="${escape(a.filename)}"><img src="${escape(a.filename)}" alt="${escape(a.altText)}"></a><figcaption>${escape(a.assetId)} · ${escape(a.state)}</figcaption></figure>`).join('');
  const html=`<!doctype html><html lang="en"><meta charset="utf-8"><title>ifYouMind — ${escape(id)} review</title><style>${css}</style><h1>${escape(id)} · Creative review</h1><p>Registry: docs/marketing/assets.json. Final export approval is separate from direction, hosting and publication.</p><section>${gallery}</section><h2>Caption · ${selected.every(approvedCaption.bind(null,root))?'approved':'pending approval'}</h2><pre>${escape(caption)}</pre><h2>Alt text</h2>${selected.map(a=>`<p><strong>${escape(a.assetId)}</strong>: ${escape(a.altText)}</p>`).join('')}<p><a href="comparison.html">Preserved before / after</a></p></html>`;
  const ready=selected.every(a=>['hosted','published'].includes(a.state)&&finalApproval(a)&&approvedCaption(root,a));
  const handoff={status:ready?'READY_FOR_SEPARATELY_AUTHORIZED_PUBLICATION':'BLOCKED_NOT_APPROVED_OR_HOSTED',campaign:id,platform:presets.presets[c.preset].platform,caption:ready?caption:null,draftCaption:ready?null:caption,assets:selected.map(a=>({assetId:a.assetId,sha256:a.sha256,version:a.version,publicUrl:ready?a.deployment.publicUrl:null,hostingRelease:ready?a.deployment.hostingRelease:null,altText:a.altText,publicationStatus:a.socialPublication.status})),publishExecuted:false};
  fs.writeFileSync(safePath(root,directory+'/publication-handoff.json',{missing:true}),JSON.stringify(handoff,null,2)+'\n');
  fs.writeFileSync(safePath(root,directory+'/index.html',{missing:true}),html);return{status:'PASS',campaign:id,count:selected.length,reviewIndex:directory+'/index.html',contactSheet:directory+'/contact-sheet.jpg',captionApproved:selected.every(a=>approvedCaption(root,a)),deployable:selected.every(finalApproval)};
}

export function selectedApproved(root,r,id){const candidates=r.assets.filter(a=>a.campaign===id&&a.state!=='archived'),latest=Math.max(...candidates.map(a=>a.version)),selected=candidates.filter(a=>a.version===latest);if(!selected.length||selected.some(a=>!finalApproval(a)||!approvedCaption(root,a)||!['approved','hosted','published'].includes(a.state)))fail('BLOCKED: final export and exact caption approval required; creative direction is insufficient');return selected;}
export function promote(root,id){
  const bytes=fs.readFileSync(safePath(root,REGISTRY)),r=readRegistry(root),selected=selectedApproved(root,r,id);validateRegistry(root,r,{campaign:id});
  const plan=selected.map(a=>{const target=`public/assets/marketing/social/${a.platform}/${a.collectionId?'carousels':'posts'}/${a.filename}`,file=safePath(root,target,{missing:true});if(fs.existsSync(file)&&fileHash(file)!==a.sha256)fail('Public asset collision; never overwrite');return{a,target,file};});
  for(const {a,file,target}of plan){fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file))fs.copyFileSync(safePath(root,a.exportPath),file,fs.constants.COPYFILE_EXCL);a.deployment={...a.deployment,status:a.deployment.status==='hosted'?'hosted':'staged',publicPath:target.replace(/^public\//,''),publicUrl:a.deployment.publicUrl||null};}
  if(!equal(JSON.parse(bytes),r)){r.updatedAt=now();writeRegistry(root,r,sha256(bytes));}return{status:'STAGED_NOT_DEPLOYED',assets:plan.map(x=>x.a.assetId),next:'Commit approved promotions, then prepare the exact clean source. No deployment was run.'};
}

/** Pure additive packaging. liveSnapshot is a fresh read-only Hosting readback, never a write. */
export async function prepare(root,id,{baseline,out,source,liveSnapshot,offline=false}={}){
  const r=readRegistry(root),selected=selectedApproved(root,r,id);validateRegistry(root,r,{campaign:id});
  if(Date.now()-Date.parse(presets.checkedAt+'T00:00:00Z')>presets.reviewAfterDays*86400000)fail('Platform specifications need fresh review before release');
  if(!source?.clean||!/^[a-f0-9]{40}$/.test(source.sha))fail('Exact clean source required');
  if(!baseline||!out||!path.resolve(out).startsWith(path.resolve(root,'test-results')+path.sep)||fs.existsSync(out)||path.resolve(out).startsWith(path.resolve(baseline)+path.sep)||path.resolve(baseline).startsWith(path.resolve(out)+path.sep))fail('Separate new ignored release directory required');
  safePath(root,path.relative(root,path.resolve(out)),{missing:true,roots:['test-results/']});
  for(const name of ['manifest.json','firebase.json','public'])safePath(root,path.relative(root,path.resolve(baseline,name)),{roots:['test-results/']});
  const m=json(path.join(baseline,'manifest.json')),config=fs.readFileSync(path.join(baseline,'firebase.json'));if(m.project!=='ifyoumind-473fe'||m.site!=='ifyoumind-473fe'||sha256(config)!==m.configSha256||Object.keys(JSON.parse(config)).join(',')!=='hosting')fail('Hosting baseline/configuration mismatch');
  const actual=await files(path.join(baseline,'public'));if(!equal(actual,m.files))fail('Baseline assets changed');
  if(!offline){if(!liveSnapshot||liveSnapshot.versionStatus!=='FINALIZED'||liveSnapshot.sourceManifestHash!==sha256(fs.readFileSync(path.join(baseline,'manifest.json')))||!Number.isFinite(Date.parse(liveSnapshot.observedAt))||Math.abs(Date.now()-Date.parse(liveSnapshot.observedAt))>15*60000)fail('Fresh live baseline verification required');if(!liveSnapshot.allBaselineFilesMatch||!liveSnapshot.configMatches)fail('Live files/config do not match baseline');}
  const additions=selected.map(a=>{if(!a.deployment?.publicPath)fail('Approved export needs local --promote before exact-source packaging');const file=safePath(root,'public/'+a.deployment.publicPath);if(fileHash(file)!==a.sha256)fail('Promoted export changed');const old=m.files.find(f=>f.path===a.deployment.publicPath);if(old&&old.sha256!==a.sha256)fail('Existing live asset collision');return{a,file,old};});
  fs.mkdirSync(out,{recursive:true});for(const entry of m.files){const file=path.join(out,'public',entry.path);fs.mkdirSync(path.dirname(file),{recursive:true});fs.copyFileSync(path.join(baseline,'public',entry.path),file);}
  for(const {a,file,old}of additions)if(!old){const target=path.join(out,'public',a.deployment.publicPath);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target,fs.constants.COPYFILE_EXCL);}
  fs.writeFileSync(path.join(out,'firebase.json'),config);const entries=await files(path.join(out,'public'));
  const manifest={schemaVersion:1,source:source.sha,project:'ifyoumind-473fe',site:'ifyoumind-473fe',sourceDigest:source.digest,configSha256:sha256(config),files:entries,releaseAuthorized:false};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const verified=await verifyArtifact(out,source.sha);return{status:offline?'OFFLINE_PACKAGE_NOT_RELEASE_VERIFIED':'PREPARED_NOT_DEPLOYED',verified,baselineFilesUnchanged:m.files.length,added:entries.length-m.files.length,manifestSha256:sha256(fs.readFileSync(path.join(out,'manifest.json'))),deployExecuted:false,requiresSeparateFounderAuthorization:true};
}

export function ingestPublication(root,evidence){
  const bytes=fs.readFileSync(safePath(root,REGISTRY)),r=readRegistry(root);if(!Array.isArray(evidence.assetIds)||!evidence.assetIds.length||new Set(evidence.assetIds).size!==evidence.assetIds.length||!validPublication(evidence.platform,evidence))fail('Actual publication receipt required');
  const selected=evidence.assetIds.map(id=>r.assets.find(a=>a.assetId===id)||fail('Unknown publication asset'));for(const a of selected)if(a.platform!==evidence.platform||!['hosted','published'].includes(a.state)||!finalApproval(a)||a.socialPublication?.postId&&['postId','permalink','publishedAt'].some(k=>String(a.socialPublication[k])!==String(evidence[k])))fail('Cannot publish unhosted/unapproved asset or overwrite a receipt');
  let changed=false;for(const a of selected){if(a.socialPublication?.postId)continue;a.state='published';a.socialPublication={status:'published',platform:evidence.platform,postId:String(evidence.postId),permalink:evidence.permalink,publishedAt:evidence.publishedAt,evidenceReference:evidence.evidenceReference,recordedAt:now()};a.updatedAt=now();changed=true;}if(changed)r.updatedAt=now();validateRegistry(root,r);writeRegistry(root,r,sha256(bytes));return{status:'RECORDED_EXTERNAL_PUBLICATION',postId:String(evidence.postId),assetIds:evidence.assetIds,publishExecuted:false,changed};
}

export async function readLiveBaseline(root,baseline,evidence){
  const require=createRequire(path.join(root,'package.json')),auth=require('firebase-tools/lib/auth'),account=auth.getGlobalDefaultAccount();if(!account?.tokens?.refresh_token)fail('Existing founder-controlled Firebase CLI authentication unavailable');
  let token;try{token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);}catch{fail('Existing Firebase CLI authentication failed; credentials were not logged');}const get=async url=>{let r;try{r=await fetch(url,{headers:{authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(15000)});}catch{fail('Hosting read-only preflight transport failure');}if(!r.ok)fail('Hosting read-only preflight HTTP '+r.status);return r.json();};
  const api='https://firebasehosting.googleapis.com/v1beta1/',channel=await get(api+'sites/ifyoumind-473fe/channels/live'),version=await get(api+channel.release.version.name),listed=await get(api+channel.release.version.name+'/files?pageSize=1000');if(listed.nextPageToken)fail('Hosting file inventory incomplete');
  const manifest=json(path.join(baseline,'manifest.json'));const {gzipSync}=await import('node:zlib');for(const e of manifest.files){const f=listed.files?.find(f=>f.path==='/'+e.path);if(f?.status!=='ACTIVE'||f.hash!==sha256(gzipSync(fs.readFileSync(path.join(baseline,'public',e.path)),{level:9})))fail('Serving baseline file mismatch');}if(listed.files.some(f=>!manifest.files.some(e=>'/'+e.path===f.path)&&!['/__/firebase/init.js','/__/firebase/init.json'].includes(f.path)))fail('Unexpected serving asset');
  // Compare normalized provider configuration captured during this baseline's verified deployment.
  if(!evidence||evidence.manifestSha256!==sha256(fs.readFileSync(path.join(baseline,'manifest.json')))||canonicalHash(version.config)!==evidence.liveConfigSha256)fail('Baseline needs matching independently recorded live configuration hash');
  return{version:channel.release.version.name.split('/').at(-1),versionStatus:version.status,allBaselineFilesMatch:true,configMatches:true,sourceManifestHash:sha256(fs.readFileSync(path.join(baseline,'manifest.json'))),observedAt:now()};
}
