import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { authorizeOrganization } from './authorization';
import { grantsPro, shouldApplySubscriptionEvent, validStripeSignature } from './stripe-commerce-logic';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const PRO_PRICE_ID = 'price_1UNpHICZjBRiXCDejbdIRMk2';
const REPORT_PRICE_ID = 'price_1UNpHNCZjBRiXCDeoCCxrn8u';

async function stripeGet(path:string){
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{
    headers:{Authorization:`Bearer ${stripeSecretKey.value()}`},
  });
  const data=await response.json() as Record<string,any>;
  if(!response.ok) throw new Error(String(data.error?.message||'Stripe request failed.'));
  return data;
}

async function stripePost(path:string, body:URLSearchParams){
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${stripeSecretKey.value()}`,
      'Content-Type':'application/x-www-form-urlencoded',
    },
    body,
  });
  const data=await response.json() as Record<string,any>;
  if(!response.ok){
    const stripeError=data.error||{};
    const error=new Error(String(stripeError.message||'Stripe request failed.')) as Error & {
      stripeType?:string;
      stripeCode?:string;
    };
    error.stripeType=typeof stripeError.type==='string'?stripeError.type:undefined;
    error.stripeCode=typeof stripeError.code==='string'?stripeError.code:undefined;
    throw error;
  }
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


export const createBillingPortalSession = onCall({secrets:[stripeSecretKey]}, async (request) => {
  const scope=await authorizeOrganization(request.auth?.uid,request.data?.organizationId,readMembership);
  const org=(await organizations().doc(scope.organizationId).get()).data()||{};
  const customerId=typeof org.stripeCustomerId==='string'?org.stripeCustomerId.trim():'';
  if(!customerId){
    throw new HttpsError('failed-precondition','No Stripe billing account is connected yet.');
  }

  const params=new URLSearchParams();
  params.set('customer',customerId);
  params.set('return_url','https://ifyoumind.com/app/account');

  try{
    const session=await stripePost('billing_portal/sessions',params);
    return {url:String(session.url||'')};
  }catch(error){
    console.error('Stripe billing portal creation failed',error);
    throw new HttpsError('internal','Billing management could not be opened.');
  }
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
  const customerEmail=typeof request.auth?.token?.email==='string'
    ? request.auth.token.email.trim()
    : '';
  if(customerEmail) params.set('customer_email',customerEmail);
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
    const stripeError=error as Error & {stripeType?:string;stripeCode?:string};
    console.error('Stripe checkout creation failed',{
      message:stripeError.message,
      type:stripeError.stripeType||null,
      code:stripeError.stripeCode||null,
    });
    const detail=[stripeError.stripeType,stripeError.stripeCode].filter(Boolean).join('/');
    const safeMessage=String(stripeError.message||'')
      .replace(/sk_(?:test|live)_[^\s)]+/g,'[redacted]')
      .slice(0,180);
    throw new HttpsError(
      'internal',
      `Checkout could not be started (Stripe: ${detail||'request_error'}${safeMessage?'; '+safeMessage:''}).`,
    );
  }
});

export const stripeCommercialWebhook = onRequest(
  {secrets:[stripeWebhookSecret,stripeSecretKey]},
  async(req,res)=>{
    const raw=req.rawBody.toString('utf8');
    const signature=String(req.headers['stripe-signature']||'');
    if(!validStripeSignature(raw,signature,stripeWebhookSecret.value())){
      res.status(400).send('Invalid signature'); return;
    }

    const event=JSON.parse(raw) as {
      id:string;
      type:string;
      created:number;
      data:{object:Record<string,any>};
    };

    const db=getFirestore();
    const eventRef=db.collection('stripeEvents').doc(event.id);
    const nowMs=Date.now();
    let claimed=false;

    await db.runTransaction(async tx=>{
      const existing=await tx.get(eventRef);
      if(existing.exists){
        const data=existing.data()||{};
        const processingRecently=
          data.status==='processing'&&
          Number.isFinite(Number(data.claimedAtMs))&&
          nowMs-Number(data.claimedAtMs)<5*60*1000;
        if(data.status==='processed'||processingRecently)return;
      }
      tx.set(eventRef,{
        type:event.type,
        status:'processing',
        claimedAtMs:nowMs,
        updatedAt:FieldValue.serverTimestamp(),
      },{merge:true});
      claimed=true;
    });

    if(!claimed){
      res.status(200).send('Already processed or processing');
      return;
    }

    try{
      if(event.type==='checkout.session.completed'){
        const session=event.data.object;
        const metadata=session.metadata||{};
        const organizationId=metadata.organizationId;
        const offer=metadata.offer;

        if(organizationId&&offer==='pro'&&session.subscription){
          const subscriptionId=typeof session.subscription==='string'
            ? session.subscription
            : String(session.subscription?.id||'');
          if(subscriptionId){
            const subscription=await stripeGet(`subscriptions/${encodeURIComponent(subscriptionId)}`);
            if(grantsPro(subscription.status)){
              await organizations().doc(organizationId).set({
                plan:'pro',
                stripeCustomerId:subscription.customer||session.customer||null,
                stripeSubscriptionId:subscription.id||subscriptionId,
                stripeSubscriptionStatus:String(subscription.status),
                stripeCancelAtPeriodEnd:Boolean(subscription.cancel_at_period_end),
                stripeSubscriptionEventCreated:event.created,
                planUpdatedAt:FieldValue.serverTimestamp(),
              },{merge:true});
            }else{
              console.warn('Checkout completed without active Pro subscription',session.id,subscription.status);
            }
          }
        }else if(organizationId&&offer==='report'&&metadata.projectId&&session.payment_status==='paid'){
          const projectRef=organizations().doc(organizationId).collection('marketProjects').doc(metadata.projectId);
          if(!((await projectRef.get()).exists)){
            console.error('Stripe report checkout references missing project',session.id);
          }else{
            await projectRef.set({
              decisionReportPurchased:true,
              decisionReportPurchasedAt:FieldValue.serverTimestamp(),
              stripeCheckoutSessionId:session.id,
            },{merge:true});
          }
        }
      }else if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
        const subscription=event.data.object;
        const metadata=subscription.metadata||{};
        const organizationId=metadata.organizationId;
        if(organizationId&&metadata.offer==='pro'){
          const orgRef=organizations().doc(organizationId);
          const current=(await orgRef.get()).data()||{};
          if(shouldApplySubscriptionEvent(event.created,current.stripeSubscriptionEventCreated)){
            const status=String(subscription.status||'unknown');
            await orgRef.set({
              plan:grantsPro(status)?'pro':'free',
              stripeCustomerId:subscription.customer||null,
              stripeSubscriptionId:subscription.id||null,
              stripeSubscriptionStatus:status,
              stripeCancelAtPeriodEnd:Boolean(subscription.cancel_at_period_end),
              stripeSubscriptionEventCreated:event.created,
              planUpdatedAt:FieldValue.serverTimestamp(),
            },{merge:true});
          }else{
            console.info('Ignoring stale Stripe subscription event',event.id,event.created);
          }
        }
      }

      await eventRef.set({
        status:'processed',
        processedAt:FieldValue.serverTimestamp(),
        updatedAt:FieldValue.serverTimestamp(),
      },{merge:true});
      res.status(200).send('ok');
    }catch(error){
      console.error('Stripe webhook fulfillment failed',event.id,error);
      await eventRef.delete().catch(()=>undefined);
      res.status(500).send('Webhook processing failed');
    }
  }
);
