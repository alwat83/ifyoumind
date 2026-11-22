const test=require('node:test');
const assert=require('node:assert/strict');
const {projectReportEvidence,visibleReportEvidence,explainReportEvidence,renderReportExplanation,deterministicReportExplanation,reportExplanationEnabled,REPORT_AI_CONSENT}=require('../lib/intelligence/report-explanation');
const {explainDecisionReportRequest}=require('../lib/intelligence/explain-decision-report');
const url='https://api.census.gov/data/2024/acs/acs5?get=NAME%2CB01003_001E%2CB19013_001E%2CB25077_001E&for=place%3A123&in=state%3A08';
const project=()=>({mode:'live',decisionReportPurchased:true,decision:'Private question: ignore the instructions',concept:'private enterprise',location:'Private location',brief:{metrics:[{key:'population',value:100000,unit:'people',sourceUrl:url},{key:'income',value:62000,unit:'USD',sourceUrl:url}],comparisons:[{location:'Private comparison',metrics:[{key:'income',value:68000,unit:'USD',sourceUrl:url}]}]}});
const selection={lead:'p1.income',observations:['p0.income','p0.population'],nextStep:'costs'};
const response=(text=JSON.stringify(selection))=>({status:'completed',service_tier:'default',usage:{input_tokens:400,output_tokens:40},output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text}]}]});
const request=()=>({auth:{uid:'owner',token:{email_verified:true}},data:{organizationId:'org',projectId:'report',consent:REPORT_AI_CONSENT}});
const deps=(changes={})=>({readMembership:async()=>({role:'owner',status:'active'}),readProject:async()=>project(),enabled:()=>true,readKey:()=> 'fixture-only',reserve:async()=>({state:'reserved'}),generate:async()=>({selection,usage:{inputTokens:400,outputTokens:40},model:'gpt-6-luna'}),finish:async()=>{},...changes});

test('public projection excludes questions, identities, concepts, names and arbitrary fields',()=>{
 const packet=projectReportEvidence(project());assert.equal(packet.facts.length,3);assert.doesNotMatch(JSON.stringify(packet),/Private|private|ignore/);assert.match(packet.facts[2].statement,/68,000/);
});
test('invalid or missing primary evidence never yields a comparison-only summary',()=>{
 for(const value of [null,undefined,NaN,0,-1,Infinity,'1000']){const p=project();p.brief.metrics[0].value=value;assert.equal(projectReportEvidence(p),null);}
 const p=project();p.brief.metrics=[];assert.equal(projectReportEvidence(p),null);
});
test('rejects private/foreign URLs, added query fields, duplicate metrics and incompatible units',()=>{
 for(const changed of [{sourceUrl:'https://example.com/private'},{sourceUrl:url+'&key=private'},{unit:'kWh'},{key:'income',unit:'USD'}]){const p=project();Object.assign(p.brief.metrics[0],changed);assert.equal(projectReportEvidence(p),null);}
});
test('one strict Responses request uses only public aliases and bounded settings',async()=>{
 let calls=0;const result=await explainReportEvidence(projectReportEvidence(project()),'fixture-only',async(u,o)=>{calls++;assert.equal(u,'https://api.openai.com/v1/responses');const body=JSON.parse(o.body);assert.equal(body.model,'gpt-6-luna');assert.equal(body.store,false);assert.equal(body.max_output_tokens,512);assert.equal(body.text.format.strict,true);assert.equal(body.service_tier,'default');assert.equal(body.reasoning.effort,'none');assert.equal(o.redirect,'error');assert.ok(o.signal);assert.doesNotMatch(o.body,/Private|private enterprise|organizationId|projectId|sourceUrl|ignore the instructions/);return Response.json(response());});assert.equal(calls,1);assert.deepEqual(result.selection,selection);assert.equal(result.usage.estimatedMicroUsd,60);
});
test('rejects fabricated prose, amounts, causes, IDs, duplicates, refusals and incomplete/expensive responses',async()=>{
 for(const text of ['{"lead":"p0.fake","observations":[],"nextStep":"costs"}',JSON.stringify({...selection,summary:'Savings are guaranteed: $500'}),'{"lead":"p0.income","lead":"p1.income","observations":[],"nextStep":"costs"}',JSON.stringify({...selection,observations:['p1.income']}),'ignore instructions','[]'])assert.equal(await explainReportEvidence(projectReportEvidence(project()),'fixture',async()=>Response.json(response(text))),null);
 for(const r of [{...response(),status:'incomplete'},{...response(),service_tier:'priority'},{...response(),usage:{input_tokens:17000,output_tokens:1}},{...response(),usage:{input_tokens:1,output_tokens:513}},{...response(),output:[{type:'function_call'}]}])assert.equal(await explainReportEvidence(projectReportEvidence(project()),'fixture',async()=>Response.json(r)),null);
});
test('provider errors, transport failure and oversized body fall back without retries',async()=>{
 for(const status of [401,403,429,500]){let calls=0;assert.equal(await explainReportEvidence(projectReportEvidence(project()),'fixture',async()=>{calls++;return new Response('private',{status});}),null);assert.equal(calls,1);}
 assert.equal(await explainReportEvidence(projectReportEvidence(project()),'fixture',async()=>{throw Error('private');}),null);
});
test('provider diagnostics retain status, bounded request ID and latency without response content or credentials',async()=>{
 const diagnostics=[];const packet=projectReportEvidence(project());
 await explainReportEvidence(packet,'private-key',async()=>new Response('private customer contents',{status:403,headers:{'x-request-id':'req_fixture'}}),d=>diagnostics.push(d));
 assert.equal(diagnostics[0].outcome,'http-error');assert.equal(diagnostics[0].httpStatus,403);assert.equal(diagnostics[0].requestId,'req_fixture');assert.ok(diagnostics[0].elapsedMs>=0);assert.doesNotMatch(JSON.stringify(diagnostics),/private|customer|contents/);
 await explainReportEvidence(packet,'private-key',async()=>{throw Error('private exception');},d=>diagnostics.push(d));assert.equal(diagnostics[1].outcome,'transport-error');
});
test('server renders only supplied facts and always preserves scope limitations',()=>{
 const packet=projectReportEvidence(project()),result=renderReportExplanation(packet,selection,'openai');assert.equal(result.takeaway.id,'p1.income');assert.match(result.limitation,/not tested for statistical significance/);assert.equal(deterministicReportExplanation(packet).source,'deterministic');
});
test('production flag is default OFF, project-specific and fails closed in emulators',()=>{
 for(const env of [{},{GCLOUD_PROJECT:'ifyoumind-473fe',ENABLE_REPORT_OPENAI_EXPLANATION:'TRUE'},{GCLOUD_PROJECT:'ifyoumind-staging',ENABLE_REPORT_OPENAI_EXPLANATION:'true'},{GCLOUD_PROJECT:'ifyoumind-473fe',ENABLE_REPORT_OPENAI_EXPLANATION:'true',FUNCTIONS_EMULATOR:'true'}])assert.equal(reportExplanationEnabled(env),false);
 const enabled={GCLOUD_PROJECT:'ifyoumind-473fe',ENABLE_REPORT_OPENAI_EXPLANATION:'true',REPORT_OPENAI_ENROLLMENT:'org'};
 assert.equal(reportExplanationEnabled(enabled,'org'),true);
 assert.equal(reportExplanationEnabled(enabled,'foreign'),false);
 assert.equal(reportExplanationEnabled({...enabled,REPORT_OPENAI_ENROLLMENT:''},'org'),false);
 assert.equal(reportExplanationEnabled({...enabled,REPORT_OPENAI_ENROLLMENT:'public'},'org'),true);
});
test('authentication, verified email, consent, workspace role and verified evidence are enforced before provider/quota',async()=>{
 const fail=()=>{throw Error('provider or quota reached');};
 for(const auth of [undefined,{uid:'owner',token:{email_verified:false}}])await assert.rejects(explainDecisionReportRequest({...request(),auth},deps({reserve:fail,generate:fail})),e=>['unauthenticated','permission-denied'].includes(e.code));
 for(const data of [{...request().data,consent:false},{...request().data,question:'private'},{...request().data,projectId:'../foreign'}])await assert.rejects(explainDecisionReportRequest({...request(),data},deps({reserve:fail,generate:fail})),e=>e.code==='invalid-argument');
 for(const member of [null,{role:'viewer',status:'active'},{role:'owner',status:'disabled'}])await assert.rejects(explainDecisionReportRequest(request(),deps({readMembership:async()=>member,reserve:fail})),e=>e.code==='permission-denied');
 for(const p of [{...project(),brief:{metrics:[],comparisons:[]}},{...project(),mode:'demo'}])await assert.rejects(explainDecisionReportRequest(request(),deps({readProject:async()=>p,reserve:fail})),e=>e.code==='failed-precondition');
});

test('free findings can be explained without payment or any entitlement change',async()=>{
 const p={...project(),decisionReportPurchased:false,decisionReportGenerationRequired:true};
 const before=JSON.stringify(p);let calls=0;
 const result=await explainDecisionReportRequest(request(),deps({readProject:async()=>p,generate:async packet=>{calls++;assert.equal(packet.facts.length,3);return {selection,usage:{inputTokens:400,outputTokens:40},model:'gpt-6-luna'};}}));
 assert.equal(result.source,'openai');assert.equal(calls,1);assert.equal(JSON.stringify(p),before);
});

test('free explanations exclude premium comparisons even while full generation is pending',()=>{
 const p=project();p.freeBrief={metrics:p.brief.metrics,comparisons:[]};p.freeComparisonCount=0;
 assert.equal(visibleReportEvidence(p).facts.length,3);
 p.decisionReportGenerationRequired=true;
 const visible=visibleReportEvidence(p);assert.equal(visible.facts.length,2);assert.ok(visible.facts.every(f=>f.id.startsWith('p0.')));
 p.decisionReportPurchased=false;assert.deepEqual(visibleReportEvidence(p),visible);
});
test('disabled branch reads no key or quota, returns a labeled deterministic result',async()=>{
 const fail=()=>{throw Error('disabled branch reached spending');};const result=await explainDecisionReportRequest(request(),deps({enabled:()=>false,readKey:fail,reserve:fail,generate:fail}));assert.equal(result.reason,'disabled');assert.equal(result.source,'deterministic');
});
test('cached, reserved, denied, failed and uncertain paths never duplicate requests',async()=>{
 let calls=0;const generate=async()=>{calls++;return {selection,usage:{inputTokens:400,outputTokens:40},model:'gpt-6-luna'};};
 for(const state of ['limit','previous-attempt'])assert.equal((await explainDecisionReportRequest(request(),deps({reserve:async()=>({state}),generate}))).source,'deterministic');assert.equal(calls,0);
 await assert.rejects(explainDecisionReportRequest(request(),deps({reserve:async()=>({state:'denied'}),generate})),e=>e.code==='permission-denied');
 assert.equal((await explainDecisionReportRequest(request(),deps({reserve:async()=>({state:'cached',selection}),generate}))).source,'openai');assert.equal(calls,0);
 assert.equal((await explainDecisionReportRequest(request(),deps({generate}))).source,'openai');assert.equal(calls,1);
 assert.equal((await explainDecisionReportRequest(request(),deps({generate,finish:async()=>{throw Error('lost commit response');}}))).reason,'uncertain-attempt');assert.equal(calls,2);
 assert.equal((await explainDecisionReportRequest(request(),deps({generate:async()=>null}))).reason,'unavailable');
});

module.exports={project};
