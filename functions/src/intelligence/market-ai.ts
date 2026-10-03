import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');
const MARKET_AI_MODEL = defineString('MARKET_AI_MODEL', { default: 'gpt-6-luna' });

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

interface AiDecisionInsight {
  headline:string;
  summary:string;
  supports:string[];
  cautions:string[];
  comparisonTakeaways:string[];
  nextChecks:string[];
  confidence:'low'|'medium'|'high';
  confidenceReason:string;
}

function outputText(response:any):string {
  for (const item of response?.output || []) {
    if (item?.type !== 'message') continue;
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  throw new Error('AI response did not contain output text.');
}

function cleanString(value:unknown,label:string,max:number):string {
  if(typeof value!=='string'||!value.trim()||value.trim().length>max) throw new Error(`Invalid AI field: ${label}`);
  return value.trim();
}

function cleanArray(value:unknown,label:string,maxItems:number,maxLength:number):string[] {
  if(!Array.isArray(value)||value.length>maxItems) throw new Error(`Invalid AI field: ${label}`);
  return value.map((item,index)=>cleanString(item,`${label}[${index}]`,maxLength));
}

function numericTokens(text:string):string[] {
  return text.match(/-?\d+(?:\.\d+)?/g)||[];
}

function collectAllowedNumbers(project:any):Set<string> {
  const allowed=new Set<string>();
  const push=(value:any)=>{
    const n=Number(value);
    if(Number.isFinite(n)) {
      allowed.add(n.toString());
      allowed.add(Math.round(n).toString());
    }
  };
  for(const metric of project?.brief?.metrics||[]) push(metric.value);
  for(const comparison of project?.brief?.comparisons||[]) {
    for(const metric of comparison?.metrics||[]) push(metric.value);
  }
  return allowed;
}

function validate(raw:any,allowedNumbers:Set<string>):AiDecisionInsight {
  if(!raw||typeof raw!=='object') throw new Error('AI response must be an object.');
  const result:AiDecisionInsight={
    headline:cleanString(raw.headline,'headline',180),
    summary:cleanString(raw.summary,'summary',1000),
    supports:cleanArray(raw.supports,'supports',4,320),
    cautions:cleanArray(raw.cautions,'cautions',4,320),
    comparisonTakeaways:cleanArray(raw.comparisonTakeaways,'comparisonTakeaways',4,320),
    nextChecks:cleanArray(raw.nextChecks,'nextChecks',5,320),
    confidence:raw.confidence==='low'||raw.confidence==='medium'||raw.confidence==='high' ? raw.confidence : 'medium',
    confidenceReason:cleanString(raw.confidenceReason,'confidenceReason',500),
  };

  const prose=[
    result.headline,result.summary,result.confidenceReason,
    ...result.supports,...result.cautions,...result.comparisonTakeaways,...result.nextChecks,
  ].join(' ');

  for(const token of numericTokens(prose)) {
    const normalized=Number(token).toString();
    if(!allowedNumbers.has(normalized)) throw new Error(`AI introduced unsupported numeric claim: ${token}`);
  }
  return result;
}

export const synthesizeMarketDecision = onCall(
  {secrets:[OPENAI_API_KEY],timeoutSeconds:90},
  async(request)=>{
    const scope=await authorizeOrganization(
      request.auth?.uid,
      request.data?.organizationId,
      readMembership,
    );

    const projectId=request.data?.projectId;
    if(typeof projectId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(projectId)){
      throw new HttpsError('invalid-argument','Invalid market project.');
    }

    const ref=organizations().doc(scope.organizationId).collection('marketProjects').doc(projectId);
    const snapshot=await ref.get();
    if(!snapshot.exists) throw new HttpsError('not-found','Market project not found.');
    const project=snapshot.data()!;

    if(project.mode!=='live'||!project.brief?.metrics?.length){
      throw new HttpsError('failed-precondition','AI synthesis requires a live, source-backed market brief.');
    }

    if(project.aiInsight){
      return {projectId,aiInsight:project.aiInsight,model:project.aiModel||null,cached:true};
    }

    const packet={
      question:project.decision,
      concept:project.concept,
      primaryLocation:project.location,
      primaryMetrics:project.brief.metrics.map((m:any)=>({
        key:m.key,label:m.label,value:m.value,unit:m.unit,source:m.sourceLabel,
      })),
      comparisons:(project.brief.comparisons||[]).map((comparison:any)=>({
        location:comparison.location,
        metrics:(comparison.metrics||[]).map((m:any)=>({
          key:m.key,label:m.label,value:m.value,unit:m.unit,source:m.sourceLabel,
        })),
      })),
      deterministicSupports:project.brief.opportunities||[],
      deterministicCautions:project.brief.risks||[],
      knownLimitations:[
        'Current live market enrichment includes Census demographics, household income, home value, and population change.',
        'Current live enrichment does not yet include commercial rent, foot traffic, business competition, crime, or concept-specific demand.',
        'ACS values are estimates, not real-time measurements.',
      ],
    };

    const instructions=[
      'You are the AI reasoning layer for ifYouMind, an evidence-first consumer decision product.',
      'Use ONLY the supplied packet. Do not use outside facts, web knowledge, assumptions, or invented context.',
      'Never change, infer, interpolate, estimate, or invent a numeric value.',
      'Any number you mention must appear exactly in the packet.',
      'Do not claim causation. Explain patterns, tradeoffs, strengths, weaknesses, and uncertainty.',
      'Do not imply that the available Census data proves whether a business will succeed.',
      'Clearly distinguish what the data supports from what still requires local validation.',
      'Write for a mainstream consumer in plain English, not an analyst.',
      'Return JSON only with keys: headline, summary, supports, cautions, comparisonTakeaways, nextChecks, confidence, confidenceReason.',
      'confidence must be low, medium, or high and should reflect evidence coverage, not optimism about the decision.',
      'Keep each list to no more than four items except nextChecks, which may have five.',
    ].join('\n');

    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{
        authorization:`Bearer ${OPENAI_API_KEY.value()}`,
        'content-type':'application/json',
      },
      body:JSON.stringify({
        model:MARKET_AI_MODEL.value(),
        instructions,
        input:JSON.stringify(packet),
        max_output_tokens:1200,
        store:false,
      }),
    });

    const responseData=await response.json();
    if(!response.ok){
      console.error('Market AI synthesis failed',response.status,responseData?.error?.type);
      throw new HttpsError('unavailable','AI interpretation is temporarily unavailable.');
    }

    let parsed:unknown;
    try{parsed=JSON.parse(outputText(responseData));}
    catch{throw new HttpsError('internal','AI interpretation returned an invalid format.');}

    let aiInsight:AiDecisionInsight;
    try{aiInsight=validate(parsed,collectAllowedNumbers(project));}
    catch(error){
      console.error('Market AI validation rejected response',error);
      throw new HttpsError('internal','AI interpretation failed evidence validation.');
    }

    await ref.set({
      aiInsight,
      aiModel:MARKET_AI_MODEL.value(),
      aiSynthesizedAt:FieldValue.serverTimestamp(),
      aiPolicyVersion:1,
    },{merge:true});

    return {projectId,aiInsight,model:MARKET_AI_MODEL.value(),cached:false};
  }
);
