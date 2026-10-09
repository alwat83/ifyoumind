import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { authorizeOrganization } from './authorization';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const PRO_PRICE_ID = 'price_1UNpHICZjBRiXCDejbdIRMk2';
const REPORT_PRICE_ID = 'price_1UNpHNCZjBRiXCDeoCCxrn8u';

async function stripePost(path:string, body:URLSearchParams){
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${stripeSecretKey.value()}`,
      'Content-Type':'application/x-www-form-urlencoded',
    },
    body,
  });
  const data=await response.json() as Record<string,unknown>;
  if(!response.ok) throw new Error(String((data.error as {message?:string}|undefined)?.message||'Stripe request failed.'));
  return data;
}
const readMembership = async (organizationId: string, uid: string) =>
  (await organizations().doc(organizationId).collection('members').doc(uid).get()).data();

export const COMMERCIAL_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    marketProjectsPerMonth: 3,
    comparisonMarkets: 1,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPriceUsd: 39,
    marketProjectsPerMonth: 50,
    comparisonMarkets: 3,
  },
  report: {
    id: 'report',
    name: 'Market Report',
    oneTimePriceUsd: 79,
  },
} as const;

function monthStart(): Timestamp {
  const now = new Date();
  return Timestamp.fromDate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
}

export const getCommercialStatus = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );
  const orgRef = organizations().doc(scope.organizationId);
  const org = (await orgRef.get()).data() || {};
  const plan = org.plan === 'pro' ? 'pro' : 'free';

  const usageSnapshot = await orgRef.collection('marketProjects')
    .where('createdAt', '>=', monthStart())
    .count()
    .get();

  const used = usageSnapshot.data().count;
  const limits = COMMERCIAL_PLANS[plan];

  return {
    plan,
    planName: limits.name,
    usedMarketProjects: used,
    marketProjectsPerMonth: limits.marketProjectsPerMonth,
    comparisonMarkets: limits.comparisonMarkets,
    remainingMarketProjects: Math.max(0, limits.marketProjectsPerMonth - used),
    checkoutEnabled: true,
    pricing: {
      proMonthlyUsd: COMMERCIAL_PLANS.pro.monthlyPriceUsd,
      reportOneTimeUsd: COMMERCIAL_PLANS.report.oneTimePriceUsd,
    },
  };
});

export const requestCommercialAccess = onCall(async (request) => {
  const scope = await authorizeOrganization(
    request.auth?.uid, request.data?.organizationId, readMembership,
  );
  const offer = request.data?.offer;
  if (offer !== 'pro' && offer !== 'report') {
    throw new HttpsError('invalid-argument', 'Choose a valid offer.');
  }

  const context = typeof request.data?.context === 'string'
    ? request.data.context.trim().slice(0, 500)
    : '';

  const ref = organizations().doc(scope.organizationId).collection('commercialLeads').doc();
  await ref.set({
    offer,
    context,
    status: 'requested',
    requestedBy: scope.uid,
    requestedEmail: request.auth?.token?.email || null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    offer,
    message: offer === 'pro'
      ? 'Pro interest recorded. Checkout will activate when billing is connected.'
      : 'Market Report interest recorded. Checkout will activate when billing is connected.',
  };
});


export const createCommercialCheckout = onCall({secrets:[stripeSecretKey]}, async (request) => {
  const scope=await authorizeOrganization(request.auth?.uid,request.data?.organizationId,readMembership);
  const offer=request.data?.offer;
  if(offer!=='pro'&&offer!=='report') throw new HttpsError('invalid-argument','Choose a valid offer.');
  const projectId=typeof request.data?.projectId==='string'?request.data.projectId.trim().slice(0,120):'';
  if(offer==='report'){
    if(!projectId) throw new HttpsError('invalid-argument','Choose the decision this report belongs to.');
    const project=await organizations().doc(scope.organizationId).collection('marketProjects').doc(projectId).get();
    if(!project.exists) throw new HttpsError('not-found','Decision project not found.');
  }

  const params=new URLSearchParams();
  params.set('mode',offer==='pro'?'subscription':'payment');
  params.set('line_items[0][price]',offer==='pro'?PRO_PRICE_ID:REPORT_PRICE_ID);
  params.set('line_items[0][quantity]','1');
  params.set('success_url',`https://ifyoumind.com/app/pricing?checkout=success&offer=${offer}&projectId=${encodeURIComponent(projectId)}`);
  params.set('cancel_url',`https://ifyoumind.com/app/pricing?checkout=cancelled&offer=${offer}&projectId=${encodeURIComponent(projectId)}`);
  params.set('client_reference_id',scope.organizationId);
  params.set('customer_email',String(request.auth?.token?.email||''));
  params.set('metadata[organizationId]',scope.organizationId);
  params.set('metadata[offer]',offer);
  params.set('metadata[projectId]',projectId);
  if(offer==='pro'){
    params.set('subscription_data[metadata][organizationId]',scope.organizationId);
    params.set('subscription_data[metadata][offer]','pro');
  }

  try{
    const session=await stripePost('checkout/sessions',params);
    return {url:String(session.url||''),sessionId:String(session.id||'')};
  }catch(error){
    console.error('Stripe checkout creation failed',error);
    throw new HttpsError('internal','Checkout could not be started.');
  }
});

function validStripeSignature(payload:string, header:string, secret:string):boolean{
  const pieces=header.split(',');
  const timestamp=pieces.find(part=>part.startsWith('t='))?.slice(2);
  const signatures=pieces.filter(part=>part.startsWith('v1=')).map(part=>part.slice(3));
  if(!timestamp||!signatures.length)return false;
  if(Math.abs(Date.now()/1000-Number(timestamp))>300)return false;
  const expected=createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  const expectedBuffer=Buffer.from(expected);
  return signatures.some(signature=>{
    const actual=Buffer.from(signature);
    return actual.length===expectedBuffer.length&&timingSafeEqual(actual,expectedBuffer);
  });
}

export const stripeCommercialWebhook = onRequest({secrets:[stripeWebhookSecret]},async(req,res)=>{
  const raw=req.rawBody.toString('utf8');
  const signature=String(req.headers['stripe-signature']||'');
  if(!validStripeSignature(raw,signature,stripeWebhookSecret.value())){
    res.status(400).send('Invalid signature'); return;
  }
  const event=JSON.parse(raw) as {id:string;type:string;data:{object:Record<string,any>}};
  const eventRef=getFirestore().collection('stripeEvents').doc(event.id);
  if((await eventRef.get()).exists){res.status(200).send('Already processed');return;}

  if(event.type==='checkout.session.completed'){
    const session=event.data.object;
    const metadata=session.metadata||{};
    const organizationId=metadata.organizationId;
    const offer=metadata.offer;
    if(organizationId&&offer==='pro'&&session.payment_status!=='unpaid'&&session.subscription){
      await organizations().doc(organizationId).set({
        plan:'pro',
        stripeCustomerId:session.customer||null,
        stripeSubscriptionId:session.subscription||null,
        stripeSubscriptionStatus:'active',
        planUpdatedAt:FieldValue.serverTimestamp(),
      },{merge:true});
    }else if(organizationId&&offer==='report'&&metadata.projectId&&session.payment_status==='paid'){
      const projectRef=organizations().doc(organizationId).collection('marketProjects').doc(metadata.projectId);
      if(!((await projectRef.get()).exists)){
        console.error('Stripe report checkout references missing project',session.id);
        res.status(200).send('No matching project'); return;
      }
      await projectRef.set({
        decisionReportPurchased:true,
        decisionReportPurchasedAt:FieldValue.serverTimestamp(),
        stripeCheckoutSessionId:session.id,
      },{merge:true});
    }
  }else if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
    const subscription=event.data.object;
    const metadata=subscription.metadata||{};
    const organizationId=metadata.organizationId;
    if(organizationId&&metadata.offer==='pro'){
      const status=String(subscription.status||'unknown');
      const proStatuses=new Set(['active','trialing']);
      await organizations().doc(organizationId).set({
        plan:proStatuses.has(status)?'pro':'free',
        stripeCustomerId:subscription.customer||null,
        stripeSubscriptionId:subscription.id||null,
        stripeSubscriptionStatus:status,
        stripeCancelAtPeriodEnd:Boolean(subscription.cancel_at_period_end),
        planUpdatedAt:FieldValue.serverTimestamp(),
      },{merge:true});
    }
  }
  await eventRef.set({type:event.type,processedAt:FieldValue.serverTimestamp()});
  res.status(200).send('ok');
});
