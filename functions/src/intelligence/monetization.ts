import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { authorizeOrganization } from './authorization';
import {
  grantsPro,
  shouldApplySubscriptionEvent,
  stripeKeyMode,
  stripePriceIds,
  subscriptionEventMayChangePlan,
  validStripeSignature,
} from './stripe-commerce-logic';
import { LEDGER_EVENT_TYPES, ledgerEntryFor, mergeLedgerData, orderingField, shouldApplyLedgerEvent } from './revenue-ledger-logic';
import {
  allowancePeriod,
  blocksNewProCheckout,
  blocksReportCheckout,
  decisionReportAccess,
  includedReportsUsed,
  proUnlockDecision,
} from './report-entitlement-logic';

const organizations = () => getFirestore().collection('intelligenceOrganizations');
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

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
    // Approved by the founder on 2026-10-11. Resets on the 1st of each UTC calendar month.
    includedReportsPerMonth: 5,
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

export const getCommercialStatus = onCall({secrets:[stripeSecretKey]}, async (request) => {
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
  const includedReportsPerMonth = plan === 'pro' ? COMMERCIAL_PLANS.pro.includedReportsPerMonth : 0;
  const usedIncludedReports = plan === 'pro' ? includedReportsUsed(org, allowancePeriod()) : 0;

  return {
    plan,
    planName: limits.name,
    usedMarketProjects: used,
    marketProjectsPerMonth: limits.marketProjectsPerMonth,
    comparisonMarkets: limits.comparisonMarkets,
    remainingMarketProjects: Math.max(0, limits.marketProjectsPerMonth - used),
    includedReportsPerMonth,
    usedIncludedReports,
    remainingIncludedReports: Math.max(0, includedReportsPerMonth - usedIncludedReports),
    checkoutEnabled: true,
    paymentsLive: stripeKeyMode(stripeSecretKey.value()) === 'live',
    pricing: {
      proMonthlyUsd: COMMERCIAL_PLANS.pro.monthlyPriceUsd,
      reportOneTimeUsd: COMMERCIAL_PLANS.report.oneTimePriceUsd,
      proIncludedReportsPerMonth: COMMERCIAL_PLANS.pro.includedReportsPerMonth,
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
    if(blocksReportCheckout(project.data())){
      throw new HttpsError('failed-precondition','This Decision Report is already unlocked. Open it from your decisions.');
    }
  }else{
    const org=(await organizations().doc(scope.organizationId).get()).data();
    if(blocksNewProCheckout(org)){
      throw new HttpsError('failed-precondition','This workspace already has a Pro subscription. Use Manage billing on your account page to change it.');
    }
  }

  const params=new URLSearchParams();
  params.set('mode',offer==='pro'?'subscription':'payment');
  // Price IDs belong to one Stripe mode, so checkout picks the set matching the installed secret key.
  const prices=stripePriceIds(stripeKeyMode(stripeSecretKey.value()));
  params.set('line_items[0][price]',offer==='pro'?prices.pro:prices.report);
  if(stripeKeyMode(stripeSecretKey.value())!=='live'){
    console.warn('Creating a Stripe checkout with a non-live key: real cards will be declined.');
  }
  params.set('line_items[0][quantity]','1');
  // Lets customers enter a promotion code created in the Stripe dashboard. No codes exist by default.
  params.set('allow_promotion_codes','true');
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

async function recordBillingReview(organizationId:string,kind:string,details:Record<string,unknown>){
  console.warn('Billing review needed',kind,organizationId,details);
  await getFirestore().collection('billingReviews').add({
    kind,
    organizationId,
    ...details,
    status:'open',
    createdAt:FieldValue.serverTimestamp(),
  });
}

// Stripe-confirmed payments, kept apart from the browser's return from Checkout so growth
// reporting never counts a redirect as revenue. Keyed by checkout session and timestamped with the
// Stripe event, so a redelivered event rewrites the same record. Never blocks fulfilment.
async function recordConfirmedPayment(
  session:Record<string,any>,
  offer:'report'|'pro',
  event:{created:number;livemode?:boolean},
  extra:Record<string,unknown>={},
){
  if(!session.id)return;
  try{
    await getFirestore().collection('stripePayments').doc(String(session.id)).set({
      offer,
      organizationId:session.metadata?.organizationId||null,
      projectId:session.metadata?.projectId||null,
      checkoutSessionId:String(session.id),
      // Links later refunds and disputes (which reference the payment intent) to this payment.
      paymentIntentId:typeof session.payment_intent==='string'?session.payment_intent:null,
      invoiceId:typeof session.invoice==='string'?session.invoice:null,
      // Subscription checkouts have no payment intent; their refunds and disputes match by customer.
      customerId:typeof session.customer==='string'?session.customer:null,
      amountTotal:typeof session.amount_total==='number'?session.amount_total:null,
      currency:typeof session.currency==='string'?session.currency:null,
      livemode:event.livemode===true,
      paidAt:Timestamp.fromMillis(event.created*1000),
      ...extra,
    });
  }catch(error){
    console.error('Could not record confirmed Stripe payment',session.id,error);
  }
}

// Renewals, failed renewals, refunds and disputes, as Stripe reports them. Read-only for access:
// nothing here changes plans or report entitlements. Older events never overwrite newer ones.
async function recordLedgerEvent(event:{id:string;type:string;created:number;livemode?:boolean;data:{object:Record<string,any>}}){
  const entry=ledgerEntryFor(event);
  if(!entry)return;
  const db=getFirestore();
  const ref=db.collection('stripeLedger').doc(entry.id);
  const applied=await db.runTransaction(async tx=>{
    const existing=(await tx.get(ref)).data();
    if(!shouldApplyLedgerEvent(event.created,existing?.[orderingField(entry)]))return false;
    tx.set(ref,{...mergeLedgerData(existing,entry),updatedAt:FieldValue.serverTimestamp()});
    return true;
  });
  if(!applied)console.info('Ignoring stale Stripe ledger event',event.id,event.type);
  if(event.type==='charge.dispute.created'){
    // One review per dispute, even if Stripe redelivers the event after a failed attempt.
    const review=db.collection('billingReviews').doc(`dispute_opened_${entry.data.disputeId}`);
    await review.create({
      kind:'dispute_opened',
      organizationId:null,
      disputeId:entry.data.disputeId,
      chargeId:entry.data.chargeId,
      paymentIntentId:entry.data.paymentIntentId,
      customerId:entry.data.customerId,
      amount:entry.data.amount,
      currency:entry.data.currency,
      reason:entry.data.reason,
      livemode:entry.data.livemode,
      status:'open',
      createdAt:FieldValue.serverTimestamp(),
    }).catch((error:{code?:unknown})=>{if(error?.code!==6)throw error;}); // 6 = ALREADY_EXISTS
    console.warn('Billing review needed','dispute_opened',entry.data.disputeId);
  }
}

async function fulfillReportPayment(session:Record<string,any>):Promise<'unpaid'|'missing'|'duplicate'|'fulfilled'>{
  const metadata=session.metadata||{};
  const organizationId=metadata.organizationId;
  if(!organizationId||!metadata.projectId||session.payment_status!=='paid')return 'unpaid';
  const projectRef=organizations().doc(organizationId).collection('marketProjects').doc(metadata.projectId);
  const projectSnapshot=await projectRef.get();
  if(!projectSnapshot.exists){
    console.error('Stripe report checkout references missing project',session.id);
    return 'missing';
  }else if(projectSnapshot.data()?.decisionReportPurchased===true&&projectSnapshot.data()?.stripeCheckoutSessionId!==session.id){
    // A second payment for a report that was already bought. Keep the original purchase record
    // and flag the extra charge for a manual refund decision.
    await recordBillingReview(organizationId,'duplicate_report_payment',{
      checkoutSessionId:session.id,
      projectId:metadata.projectId,
      originalCheckoutSessionId:projectSnapshot.data()?.stripeCheckoutSessionId||null,
      amountTotal:session.amount_total??null,
      currency:session.currency??null,
    });
    return 'duplicate';
  }else{
    await projectRef.set({
      decisionReportPurchased:true,
      decisionReportPurchasedAt:FieldValue.serverTimestamp(),
      stripeCheckoutSessionId:session.id,
    },{merge:true});
    return 'fulfilled';
  }
}

async function handleReportPayment(session:Record<string,any>,event:{created:number;livemode?:boolean}){
  const outcome=await fulfillReportPayment(session);
  if(outcome!=='unpaid')await recordConfirmedPayment(session,'report',event,{fulfilment:outcome});
}

export const unlockDecisionReportWithPro = onCall(async (request) => {
  const scope=await authorizeOrganization(
    request.auth?.uid,request.data?.organizationId,readMembership,['owner','admin'],
  );
  const projectId=request.data?.projectId;
  if(typeof projectId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(projectId)){
    throw new HttpsError('invalid-argument','Invalid decision.');
  }
  const orgRef=organizations().doc(scope.organizationId);
  const projectRef=orgRef.collection('marketProjects').doc(projectId);
  const limit=COMMERCIAL_PLANS.pro.includedReportsPerMonth;
  const period=allowancePeriod();

  return getFirestore().runTransaction(async tx=>{
    const [orgSnapshot,projectSnapshot]=await Promise.all([tx.get(orgRef),tx.get(projectRef)]);
    if(!projectSnapshot.exists) throw new HttpsError('not-found','Decision not found.');
    const org=orgSnapshot.data()||{};
    const used=includedReportsUsed(org,period);
    const decision=proUnlockDecision({
      plan:org.plan,
      access:decisionReportAccess(projectSnapshot.data()),
      used,
      limit,
    });
    if(!decision.ok){
      throw new HttpsError(
        decision.reason==='not-pro'?'permission-denied':'resource-exhausted',
        decision.reason==='not-pro'
          ? 'Full reports are included with Pro.'
          : `You have used all ${limit} included reports this month. You can still buy this report individually.`,
      );
    }
    if(decision.alreadyUnlocked){
      return {unlocked:true,remainingIncludedReports:Math.max(0,limit-used)};
    }
    tx.set(projectRef,{
      decisionReportIncludedWithPro:true,
      decisionReportUnlockedAt:FieldValue.serverTimestamp(),
      decisionReportUnlockedBy:scope.uid,
    },{merge:true});
    tx.set(orgRef,{proReportAllowance:{period,used:used+1}},{merge:true});
    return {unlocked:true,remainingIncludedReports:Math.max(0,limit-used-1)};
  });
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
      livemode?:boolean;
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
              const existing=(await organizations().doc(organizationId).get()).data()||{};
              const priorSubscriptionId=typeof existing.stripeSubscriptionId==='string'?existing.stripeSubscriptionId:'';
              if(priorSubscriptionId&&priorSubscriptionId!==(subscription.id||subscriptionId)&&grantsPro(existing.stripeSubscriptionStatus)){
                await recordBillingReview(organizationId,'duplicate_pro_subscription',{
                  checkoutSessionId:session.id,
                  existingSubscriptionId:priorSubscriptionId,
                  newSubscriptionId:subscription.id||subscriptionId,
                });
              }
              await organizations().doc(organizationId).set({
                plan:'pro',
                stripeCustomerId:subscription.customer||session.customer||null,
                stripeSubscriptionId:subscription.id||subscriptionId,
                stripeSubscriptionStatus:String(subscription.status),
                stripeCancelAtPeriodEnd:Boolean(subscription.cancel_at_period_end),
                stripeSubscriptionEventCreated:event.created,
                planUpdatedAt:FieldValue.serverTimestamp(),
              },{merge:true});
              await recordConfirmedPayment(session,'pro',event,{subscriptionId:subscription.id||subscriptionId});
            }else{
              console.warn('Checkout completed without active Pro subscription',session.id,subscription.status);
            }
          }
        }else if(offer==='report'){
          await handleReportPayment(event.data.object,event);
        }
      }else if(event.type==='checkout.session.async_payment_succeeded'){
        // Delayed payment methods (bank debits) complete checkout unpaid and confirm payment later.
        if(event.data.object.metadata?.offer==='report')await handleReportPayment(event.data.object,event);
      }else if(LEDGER_EVENT_TYPES.has(event.type)){
        await recordLedgerEvent(event);
      }else if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
        const subscription=event.data.object;
        const metadata=subscription.metadata||{};
        const organizationId=metadata.organizationId;
        if(organizationId&&metadata.offer==='pro'){
          const orgRef=organizations().doc(organizationId);
          const current=(await orgRef.get()).data()||{};
          const status=String(subscription.status||'unknown');
          if(!subscriptionEventMayChangePlan(current,subscription.id,status)){
            // e.g. a duplicate subscription being cancelled must not end the workspace's live one.
            console.info('Ignoring event for a non-current Stripe subscription',event.id,subscription.id);
          }else if(shouldApplySubscriptionEvent(event.created,current.stripeSubscriptionEventCreated)){
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
