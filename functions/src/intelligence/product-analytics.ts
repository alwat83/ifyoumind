import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId:string,uid:string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

const ALLOWED_EVENTS=new Set([
  'app_open',
  'decision_created',
  'report_view',
  'pricing_view',
  'checkout_started',
  'checkout_success',
  'checkout_cancelled',
  'billing_portal_opened',
]);

function cleanContext(value:unknown):Record<string,string>{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const output:Record<string,string>={};
  for(const [key,raw] of Object.entries(value as Record<string,unknown>).slice(0,8)){
    if(!/^[A-Za-z0-9_-]{1,40}$/.test(key))continue;
    if(typeof raw!=='string')continue;
    const text=raw.trim().slice(0,120);
    if(text)output[key]=text;
  }
  return output;
}

export const recordProductEvent=onCall(async(request)=>{
  const scope=await authorizeOrganization(request.auth?.uid,request.data?.organizationId,readMembership);
  const event=typeof request.data?.event==='string'?request.data.event:'';
  if(!ALLOWED_EVENTS.has(event))throw new HttpsError('invalid-argument','Unknown product event.');

  await getFirestore().collection('productEvents').add({
    event,
    organizationId:scope.organizationId,
    uid:scope.uid,
    context:cleanContext(request.data?.context),
    createdAt:FieldValue.serverTimestamp(),
  });

  return {ok:true};
});
