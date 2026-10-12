import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authorizeOrganization } from './authorization';
import { eventContext, isAllowedEvent } from './product-event-logic';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const readMembership = async (organizationId:string,uid:string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

export const recordProductEvent=onCall(async(request)=>{
  const scope=await authorizeOrganization(request.auth?.uid,request.data?.organizationId,readMembership);
  const event=typeof request.data?.event==='string'?request.data.event:'';
  if(!isAllowedEvent(event))throw new HttpsError('invalid-argument','Unknown product event.');

  await getFirestore().collection('productEvents').add({
    event,
    organizationId:scope.organizationId,
    uid:scope.uid,
    context:eventContext(event,request.data?.context),
    createdAt:FieldValue.serverTimestamp(),
  });

  return {ok:true};
});
