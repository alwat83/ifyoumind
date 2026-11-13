import { randomUUID } from 'node:crypto';
import { getFirestore, Timestamp, type DocumentData, type DocumentReference } from 'firebase-admin/firestore';
import { HttpsError, onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { blocksNewProCheckout, decisionReportAccess } from './report-entitlement-logic';
import { stripeKeyMode, validStripeSignature } from './stripe-commerce-logic';
import { isSubscriptionOffer, subscriptionCatalog, subscriptionEnrollment, SUBSCRIPTION_PLANS, type SubscriptionOffer } from './subscription-plans';

const apiVersion = '2025-02-24.acacia';
const stripeKey = defineSecret('STRIPE_SECRET_KEY');
const webhookKey = defineSecret('STRIPE_SUBSCRIPTION_WEBHOOK_SECRET');
const namespace = 'decision-reports-v1';
const checkoutLifetime = 60 * 60;
const reservationLifetime = 90_000;
const safeId = /^[A-Za-z0-9_-]{1,128}$/;
const seconds = () => Math.floor(Date.now() / 1000);
const organizations = () => getFirestore().collection('intelligenceOrganizations');
export const subscriptionBilling = (org: DocumentReference) => org.collection('subscriptionBilling').doc('current');
const periodDocument = (billing: DocumentReference, key: string) => billing.collection('periods').doc(key);

class InvalidStripeRecord extends Error {}
function requireRecord(condition: unknown): asserts condition {
  if (!condition) throw new InvalidStripeRecord();
}
function providerId(value: unknown, prefix: string): value is string {
  return typeof value === 'string' && value.startsWith(prefix) && /^[A-Za-z0-9_]{4,128}$/.test(value);
}

async function stripe(path: string, body?: URLSearchParams, idempotency?: string): Promise<DocumentData> {
  const key = stripeKey.value();
  const mode = stripeKeyMode(key);
  if (mode === 'unknown') throw new Error('Subscription Stripe mode unavailable');
  const headers: Record<string, string> = { Authorization: `Bearer ${key}`, 'Stripe-Version': apiVersion };
  if (body) headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idempotency) headers['Idempotency-Key'] = idempotency;
  const response = await fetch('https://api.stripe.com/v1/' + path, {
    method: body ? 'POST' : 'GET', body, headers, redirect: 'error', signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error('Subscription Stripe request failed');
  return await response.json() as DocumentData;
}

async function verifyAccount(account: string) {
  const result = await stripe('account');
  requireRecord(result.id === account);
}

function checkoutOrigin() {
  return stripeKeyMode(stripeKey.value()) === 'test' &&
    process.env.SUBSCRIPTION_LOCAL_RETURN === 'true' ? 'http://localhost:4200' : 'https://ifyoumind.com';
}

function checkoutUrl(value: unknown): string {
  const url = new URL(typeof value === 'string' ? value : '');
  requireRecord(url.origin === 'https://checkout.stripe.com' && !url.username && !url.password && url.pathname.startsWith('/c/pay/'));
  return url.href;
}

export async function startSubscriptionCheckout(organizationId: string, offer: SubscriptionOffer, projectId: unknown) {
  const catalog = subscriptionCatalog();
  if (!catalog || !subscriptionEnrollment(organizationId)) throw new HttpsError('failed-precondition', 'Subscription enrollment is currently closed.');
  if (typeof projectId !== 'string' || !safeId.test(projectId)) throw new HttpsError('invalid-argument', 'Start or open a decision before choosing a subscription.');
  const org = organizations().doc(organizationId);
  const billing = subscriptionBilling(org);
  const project = org.collection('marketProjects').doc(projectId);
  const attempt = randomUUID();
  const mode = stripeKeyMode(stripeKey.value());
  const launch = getFirestore().collection('subscriptionLaunch').doc(mode + '_' + catalog.account);
  try {
    await verifyAccount(catalog.account);
    const price = await stripe('prices/' + catalog[offer]);
    requireRecord(price.id === catalog[offer] && price.livemode === (mode === 'live') && price.active === true &&
      price.unit_amount === SUBSCRIPTION_PLANS[offer].cents && price.currency === 'usd' &&
      price.recurring?.interval === 'month' && price.recurring.interval_count === 1);
    await clearExpiredReportCheckout(project);
    const checkout = await getFirestore().runTransaction(async tx => {
      const [orgSnapshot, projectSnapshot, billingSnapshot, launchSnapshot] = await tx.getAll(org, project, billing, launch);
      const orgData = orgSnapshot.data();
      const data = billingSnapshot.data();
      if (!orgData || !projectSnapshot.exists) throw new HttpsError('not-found', 'Decision not found.');
      if (projectSnapshot.data()?.reportCheckout && decisionReportAccess(projectSnapshot.data()) === 'none') {
        throw new HttpsError('failed-precondition', 'Complete or let the existing one-time checkout expire before subscribing for this report.');
      }
      if (blocksNewProCheckout(orgData) || orgData.stripeSubscriptionId || data?.subscriptionId) {
        throw new HttpsError('failed-precondition', 'This workspace already has billing history. Manage your existing plan in Account.');
      }
      const existing = data?.checkout;
      if (existing) {
        const priorOffer: unknown = existing.offer;
        if (existing.account !== catalog.account || existing.mode !== mode ||
          !isSubscriptionOffer(priorOffer) || existing.priceId !== catalog[priorOffer]) {
          throw new HttpsError('failed-precondition', 'A previous checkout needs billing review.');
        }
        // Replace only after Stripe explicitly confirms the prior session is expired.
        return existing;
      }
      const seats: string[] = launchSnapshot.data()?.workspaces ?? [];
      if (!seats.includes(organizationId)) {
        if (seats.length >= 10) throw new HttpsError('resource-exhausted', 'Subscription enrollment has reached its launch limit.');
        tx.set(launch, { workspaces: [...seats, organizationId] });
      }
      const next = { attempt, account: catalog.account, mode, offer, priceId: catalog[offer], projectId, expiresAt: seconds() + checkoutLifetime };
      tx.set(billing, { checkout: next }, { merge: true });
      return next;
    });
    if (checkout.id) {
      const existing = await stripe('checkout/sessions/' + checkout.id);
      requireRecord(existing.metadata?.attempt === checkout.attempt && existing.client_reference_id === organizationId);
      if (existing.status === 'open') {
        if (checkout.offer !== offer || checkout.projectId !== projectId) {
          throw new HttpsError('failed-precondition', 'An existing checkout is open for a different choice. Return to it or wait for it to expire.');
        }
        return { url: checkoutUrl(existing.url) };
      }
      if (existing.status !== 'expired') throw new HttpsError('failed-precondition', 'Checkout is complete. Return to your decision while payment is confirmed.');
      await getFirestore().runTransaction(async tx => {
        const data = (await tx.get(billing)).data();
        if (!data?.subscriptionId && data?.checkout?.id === existing.id) tx.update(billing, { checkout: null });
      });
      throw new HttpsError('failed-precondition', 'The previous checkout expired. Choose a plan again to open a fresh checkout.');
    }
    if (checkout.offer !== offer || checkout.projectId !== projectId) {
      throw new HttpsError('failed-precondition', 'A previous checkout for a different choice is pending.');
    }
    if (checkout.expiresAt - seconds() < 31 * 60) throw new HttpsError('failed-precondition', 'A previous checkout needs billing review.');
    const metadata = { source: namespace, organizationId, attempt: checkout.attempt, offer: checkout.offer };
    const base = checkoutOrigin();
    const resultUrl = base + '/app/result/' + encodeURIComponent(checkout.projectId);
    const params = new URLSearchParams({
      mode: 'subscription', client_reference_id: organizationId, 'line_items[0][price]': checkout.priceId,
      'line_items[0][quantity]': '1', expires_at: String(checkout.expiresAt),
      success_url: resultUrl + '?subscription=confirming',
      cancel_url: base + '/app/pricing?checkout=cancelled&projectId=' + encodeURIComponent(checkout.projectId),
    });
    for (const [key, value] of Object.entries(metadata)) {
      params.set(`metadata[${key}]`, String(value));
      params.set(`subscription_data[metadata][${key}]`, String(value));
    }
    const session = await stripe('checkout/sessions', params, 'ifyoumind-subscription-' + checkout.attempt);
    requireRecord(providerId(session.id, mode === 'live' ? 'cs_live_' : 'cs_test_') && session.livemode === (mode === 'live'));
    const url = checkoutUrl(session.url);
    await getFirestore().runTransaction(async tx => {
      const current = (await tx.get(billing)).data();
      requireRecord(current && current.checkout?.attempt === checkout.attempt && (!current.checkout.id || current.checkout.id === session.id));
      tx.update(billing, { 'checkout.id': session.id });
    });
    return { url };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('Subscription checkout could not be verified');
    throw new HttpsError('unavailable', 'Checkout could not be opened. Please try again.');
  }
}

function activePeriod(period: DocumentData | undefined, now = seconds()) {
  return Boolean(period && !period.held && period.start <= now && now < period.end);
}

export async function readSubscriptionStatus(org: DocumentReference) {
  const billing = subscriptionBilling(org);
  const data = (await billing.get()).data();
  if (!data) return null;
  const period = data.periodStart > seconds()
    ? (await billing.collection('periods').where('start', '<=', seconds()).orderBy('start', 'desc').limit(1).get()).docs[0]?.data()
    : data.periodKey ? (await periodDocument(billing, data.periodKey).get()).data() : undefined;
  return {
    offer: isSubscriptionOffer(data.offer) ? data.offer : null,
    pending: Boolean(data.checkout && !data.subscriptionId),
    linked: providerId(data.customerId, 'cus_'),
    state: typeof data.state === 'string' ? data.state : null,
    paidThrough: period?.end ? Math.min(period.end, data.endedAt || period.end) : null,
    cancelAt: data.cancelAt || null,
    remaining: activePeriod(period) && (!data.endedAt || seconds() < data.endedAt)
      ? Math.max(0, period!.limit - period!.used - period!.reserved) : 0,
  };
}

function cancellation(subscription: DocumentData) {
  return {
    state: String(subscription.status || 'unknown'),
    cancelAt: Number(subscription.cancel_at) || (subscription.cancel_at_period_end ? Number(subscription.current_period_end) || null : null),
    endedAt: subscription.status === 'canceled' ? Number(subscription.ended_at) || seconds() : null,
  };
}

function validateSubscription(sub: DocumentData, live: boolean) {
  requireRecord(sub.livemode === live && providerId(sub.id, 'sub_') && providerId(sub.customer, 'cus_') &&
    sub.metadata?.source === namespace && typeof sub.metadata.organizationId === 'string' &&
    safeId.test(sub.metadata.organizationId) && isSubscriptionOffer(sub.metadata.offer));
  return { org: organizations().doc(sub.metadata.organizationId), offer: sub.metadata.offer as SubscriptionOffer };
}

async function recordPaidInvoice(invoiceId: string, catalog: NonNullable<ReturnType<typeof subscriptionCatalog>>, live: boolean, created: number) {
  const invoice = await stripe('invoices/' + invoiceId + '?expand[]=payment_intent.latest_charge');
  if (!providerId(invoice.subscription, 'sub_')) return;
  const sub = await stripe('subscriptions/' + invoice.subscription);
  if (sub.metadata?.source !== namespace) return;
  const { org, offer } = validateSubscription(sub, live);
  const plan = SUBSCRIPTION_PLANS[offer];
  const billing = subscriptionBilling(org);
  const record = (await billing.get()).data();
  requireRecord(record?.checkout?.account === catalog.account && record.checkout.mode === (live ? 'live' : 'test') &&
    record.checkout.attempt === sub.metadata.attempt && record.checkout.offer === offer && record.checkout.priceId === catalog[offer]);
  const line = invoice.lines?.data?.[0];
  const intent = invoice.payment_intent;
  const charge = intent?.latest_charge;
  const start = line?.period?.start, end = line?.period?.end;
  requireRecord(invoice.id === invoiceId && invoice.livemode === live && invoice.customer === sub.customer &&
    invoice.status === 'paid' && invoice.paid === true && invoice.paid_out_of_band !== true && invoice.currency === 'usd' &&
    invoice.amount_paid === plan.cents && invoice.collection_method === 'charge_automatically' &&
    ['subscription_create', 'subscription_cycle'].includes(invoice.billing_reason) &&
    invoice.lines?.has_more === false && invoice.lines.data.length === 1 && line.price?.id === catalog[offer] &&
    line.type === 'subscription' && line.quantity === 1 && line.proration === false &&
    Number.isSafeInteger(start) && Number.isSafeInteger(end) && end > start && end - start <= 32 * 86400 &&
    intent?.status === 'succeeded' && intent.customer === sub.customer && intent.currency === 'usd' &&
    intent.amount_received === plan.cents && charge?.paid === true && charge.livemode === live && charge.customer === sub.customer && providerId(charge.id, 'ch_'));
  if (!record.subscriptionId) {
    requireRecord(providerId(record.checkout.id, live ? 'cs_live_' : 'cs_test_'));
    const session = await stripe('checkout/sessions/' + record.checkout.id);
    requireRecord(session.status === 'complete' && session.livemode === live && session.subscription === sub.id &&
      session.customer === sub.customer && session.client_reference_id === org.id &&
      session.metadata?.attempt === record.checkout.attempt && session.metadata?.source === namespace);
  }
  const key = sub.id + '_' + start;
  const period = periodDocument(billing, key);
  const account = getFirestore().collection('subscriptionCustomerLinks').doc(sub.customer);
  const paid = getFirestore().collection('subscriptionChargeLinks').doc(charge.id);
  await getFirestore().runTransaction(async tx => {
    const [workspace, current, prior, owner, payment] = await tx.getAll(org, billing, period, account, paid);
    const data = current.data();
    requireRecord(workspace.exists && !blocksNewProCheckout(workspace.data()) &&
      data && data.checkout?.attempt === sub.metadata.attempt && (!data.subscriptionId || data.subscriptionId === sub.id) &&
      (!data.customerId || data.customerId === sub.customer) &&
      (!owner.exists || owner.data()?.organizationId === org.id));
    const paymentData = payment.data();
    if (prior.exists || paymentData?.periodKey) {
      requireRecord(prior.data()?.invoiceId === invoiceId && paymentData?.periodKey === key && paymentData?.organizationId === org.id);
      return;
    }
    requireRecord(!paymentData || (paymentData.account === catalog.account && paymentData.live === live));
    tx.create(period, { invoiceId, start, end, limit: plan.reports, used: 0, reserved: 0,
      held: charge.refunded === true || (paymentData?.held ?? charge.disputed === true),
      reversalEventAt: paymentData?.reversalEventAt ?? 0 });
    tx.set(paid, { organizationId: org.id, periodKey: key, account: catalog.account, live }, { merge: true });
    tx.set(account, { organizationId: org.id, account: catalog.account, live });
    const paymentLog = getFirestore().collection('stripePayments').doc(invoiceId);
    tx.create(paymentLog, {
      offer, organizationId: org.id, invoiceId, subscriptionId: sub.id, amountTotal: plan.cents,
      currency: 'usd', livemode: live, paidAt: Timestamp.fromMillis((invoice.status_transitions?.paid_at || created) * 1000),
      checkoutSessionId: invoice.billing_reason === 'subscription_create' ? data.checkout.id : null,
      fulfilment: 'credits-granted',
    });
    if (!data.periodStart || start >= data.periodStart) {
      const updateState = !data.endedAt && (data.stateEventAt ?? 0) <= created;
      tx.set(billing, { subscriptionId: sub.id, customerId: sub.customer, offer, periodKey: key, periodStart: start,
        ...(updateState ? { ...cancellation(sub), stateEventAt: created } : {}) }, { merge: true });
    }
  });
}

async function recordSubscriptionState(subId: string, live: boolean, created: number, catalog: NonNullable<ReturnType<typeof subscriptionCatalog>>) {
  const sub = await stripe('subscriptions/' + subId);
  if (sub.metadata?.source !== namespace) return;
  const { org } = validateSubscription(sub, live);
  const billing = subscriptionBilling(org);
  await getFirestore().runTransaction(async tx => {
    const data = (await tx.get(billing)).data();
    if (data?.checkout?.account !== catalog.account || data?.subscriptionId !== sub.id || data?.customerId !== sub.customer ||
      (data.stateEventAt ?? 0) > created || (data.endedAt && sub.status !== 'canceled')) return;
    tx.update(billing, { ...cancellation(sub), stateEventAt: created });
  });
}

async function reconcileCharge(chargeId: string, created: number, catalog: NonNullable<ReturnType<typeof subscriptionCatalog>>, live: boolean) {
  const link = getFirestore().collection('subscriptionChargeLinks').doc(chargeId);
  const charge = await stripe('charges/' + chargeId);
  requireRecord(charge.id === chargeId && charge.livemode === live);
  let disputed = false;
  if (charge.disputed) {
    const disputes = await stripe('disputes?charge=' + chargeId + '&limit=10');
    requireRecord(disputes.has_more === false && Array.isArray(disputes.data));
    disputed = disputes.data.length === 0 || disputes.data.some((item: DocumentData) => !['won', 'warning_closed'].includes(item.status));
  }
  await getFirestore().runTransaction(async tx => {
    const data = (await tx.get(link)).data();
    requireRecord(!data || (data.account === catalog.account && data.live === live));
    if ((data?.reversalEventAt ?? 0) > created) return;
    const period = data?.periodKey
      ? periodDocument(subscriptionBilling(organizations().doc(data.organizationId)), data.periodKey) : null;
    const grant = period ? await tx.get(period) : null;
    const change = { held: charge.refunded === true || disputed, reversalEventAt: created };
    tx.set(link, { account: catalog.account, live, ...change }, { merge: true });
    if (period && grant?.exists) tx.update(period, change);
  });
}

export const stripeSubscriptionWebhook = onRequest({ secrets: [stripeKey, webhookKey] }, async (request, response) => {
  if (request.method !== 'POST') { response.status(405).send('Method not allowed'); return; }
  const raw = request.rawBody.toString('utf8');
  if (!validStripeSignature(raw, String(request.headers['stripe-signature'] || ''), webhookKey.value())) {
    response.status(400).send('Invalid signature'); return;
  }
  const catalog = subscriptionCatalog();
  const mode = stripeKeyMode(stripeKey.value());
  if (!catalog || mode === 'unknown') { response.status(503).send('Billing configuration unavailable'); return; }
  try {
    const event = JSON.parse(raw);
    const object = event.data?.object;
    requireRecord(event.livemode === (mode === 'live') && !event.account && Number.isSafeInteger(event.created) && object);
    await verifyAccount(catalog.account);
    if (event.type === 'invoice.paid' && providerId(object.id, 'in_')) {
      await recordPaidInvoice(object.id, catalog, event.livemode, event.created);
    } else if (['customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type) && providerId(object.id, 'sub_')) {
      await recordSubscriptionState(object.id, event.livemode, event.created, catalog);
    } else if (event.type === 'charge.refunded' && providerId(object.id, 'ch_')) {
      await reconcileCharge(object.id, event.created, catalog, event.livemode);
    } else if (['charge.dispute.created','charge.dispute.updated','charge.dispute.closed'].includes(event.type) && providerId(object.charge, 'ch_')) {
      await reconcileCharge(object.charge, event.created, catalog, event.livemode);
    }
    response.status(200).send('ok');
  } catch (error) {
    // Provider ordering, configuration errors and mismatches remain visible for Stripe redelivery.
    console.warn('Subscription webhook processing deferred', error instanceof InvalidStripeRecord ? 'unverified record' : 'request failed');
    response.status(503).send('Subscription event could not be verified');
  }
});

export async function reserveSubscriptionPreview(org: DocumentReference, count: number, month: string) {
  const billing = subscriptionBilling(org);
  return getFirestore().runTransaction(async tx => {
    const data = (await tx.get(billing)).data();
    if (!subscriptionEnrollment(org.id) && !data?.subscriptionId) return false;
    const limit = data?.subscriptionId ? 12 : 3;
    const used = Math.max(count, data?.previewUsage?.month === month ? data.previewUsage.used : 0);
    if (used >= limit) throw new HttpsError('resource-exhausted', 'This workspace has reached its decision limit for this month.');
    tx.set(billing, { previewUsage: { month, used: used + 1 } }, { merge: true });
    return true;
  });
}

type ReportReservation = { token: string; projectId: string; periodKey: string | null; expiresAt: number };

export async function reserveReport(org: DocumentReference, projectId: string) {
  const billing = subscriptionBilling(org);
  const project = org.collection('marketProjects').doc(projectId);
  const token = randomUUID();
  await clearExpiredReportCheckout(project);
  return getFirestore().runTransaction(async tx => {
    const [billingSnapshot, projectSnapshot] = await tx.getAll(billing, project);
    const data = billingSnapshot.data();
    const target = projectSnapshot.data();
    if (!target) throw new HttpsError('not-found', 'Decision not found.');
    const access = decisionReportAccess(target);
    if (access !== 'none' && !target.decisionReportGenerationRequired) return null;
    const old = data?.reportReservation as ReportReservation | undefined;
    const now = Date.now();
    if (old && old.expiresAt > now) throw new HttpsError('aborted', 'A report is already being prepared. Try again shortly.');
    const paid = access !== 'none' && target.decisionReportGenerationRequired === true;
    if (!paid && target.reportCheckout) {
      throw new HttpsError('failed-precondition', 'A one-time checkout is still pending for this report.');
    }
    let key = paid ? null : data?.periodKey;
    if (!paid && data?.periodStart > Math.floor(now / 1000)) {
      const current = await tx.get(billing.collection('periods')
        .where('start', '<=', Math.floor(now / 1000)).orderBy('start', 'desc').limit(1));
      key = current.docs[0]?.id;
    }
    if (!paid && (!key || (data?.endedAt && now / 1000 >= data.endedAt))) {
      throw new HttpsError('failed-precondition', 'This workspace does not have a paid report credit.');
    }
    const refs = new Map<string, DocumentReference>();
    for (const periodKey of [key, old?.periodKey]) {
      if (periodKey && !refs.has(periodKey)) refs.set(periodKey, periodDocument(billing, periodKey));
    }
    const snapshots = refs.size ? await tx.getAll(...refs.values()) : [];
    const periods = new Map(snapshots.map(s => [s.id, s.data()]));
    const current = key ? periods.get(key) : undefined;
    const reclaimed = old?.periodKey && periods.get(old.periodKey);
    if (reclaimed) reclaimed.reserved = Math.max(0, reclaimed.reserved - 1);
    if (paid) {
      if ((target.paidReportAttempts ?? 0) >= 3) throw new HttpsError('resource-exhausted', 'Contact support to finish this purchased report.');
      tx.update(project, { paidReportAttempts: (target.paidReportAttempts ?? 0) + 1 });
    } else {
      if (!activePeriod(current, Math.floor(now / 1000)) || !current || current.used + current.reserved >= current.limit) {
        throw new HttpsError('resource-exhausted', 'No report credits remain in the current paid period.');
      }
      if ((current.attempts ?? 0) >= current.limit * 3) throw new HttpsError('resource-exhausted', 'Contact support to finish your report.');
      current.reserved++;
      current.attempts = (current.attempts ?? 0) + 1;
    }
    for (const [periodKey, period] of periods) {
      if (period) tx.update(refs.get(periodKey)!, { reserved: period.reserved, attempts: period.attempts ?? 0 });
    }
    const reservation: ReportReservation = { token, projectId, periodKey: key || null, expiresAt: now + reservationLifetime };
    tx.set(billing, { reportReservation: reservation }, { merge: true });
    return { reservation, target };
  });
}

export async function finishReport(org: DocumentReference, uid: string, reservation: ReportReservation, brief?: DocumentData) {
  const billing = subscriptionBilling(org);
  const project = org.collection('marketProjects').doc(reservation.projectId);
  const member = org.collection('members').doc(uid);
  const period = reservation.periodKey ? periodDocument(billing, reservation.periodKey) : null;
  return getFirestore().runTransaction(async tx => {
    const [b, p, m, grant] = await tx.getAll(billing, project, member, ...(period ? [period] : []));
    const data = b.data();
    if (data?.reportReservation?.token !== reservation.token) return false;
    const target = p.data();
    const owner = m.data();
    const now = Date.now();
    const eligible = brief?.decisionReport && target && owner?.status === 'active' &&
      ['owner','admin'].includes(owner.role) && now < reservation.expiresAt &&
      (period ? activePeriod(grant?.data(), Math.floor(now / 1000)) && (!data.endedAt || now / 1000 < data.endedAt)
        : decisionReportAccess(target) !== 'none');
    if (period && grant?.exists) {
      const consumed = eligible && decisionReportAccess(target) === 'none';
      tx.update(period, { reserved: Math.max(0, grant.data()!.reserved - 1), used: grant.data()!.used + (consumed ? 1 : 0) });
    }
    if (eligible) {
      const unlock = decisionReportAccess(target) === 'none';
      tx.update(project, {
        brief,
        decisionReportGenerationRequired: false,
        ...(unlock ? { decisionReportIncludedWithSubscription: true } : {}),
      });
    }
    tx.update(billing, { reportReservation: null });
    return Boolean(eligible);
  });
}

export async function openSubscriptionPortal(organizationId: string, role: string) {
  const data = (await subscriptionBilling(organizations().doc(organizationId)).get()).data();
  if (!data?.customerId) return null;
  if (!['owner','admin'].includes(role)) throw new HttpsError('permission-denied', 'Only workspace owners and admins can manage billing.');
  const catalog = subscriptionCatalog();
  try {
    requireRecord(catalog && data.checkout?.account === catalog.account &&
      data.checkout.mode === stripeKeyMode(stripeKey.value()) && providerId(data.customerId, 'cus_'));
    await verifyAccount(catalog.account);
    const session = await stripe('billing_portal/sessions', new URLSearchParams({
      customer: data.customerId, return_url: checkoutOrigin() + '/app/account',
    }));
    const url = new URL(String(session.url || ''));
    const sessionPath = /^\/p\/session\/[^/]+$/.test(url.pathname) ||
      (url.pathname === '/p/session' && Boolean(url.searchParams.get('secret')));
    requireRecord(url.origin === 'https://billing.stripe.com' && !url.username && !url.password && sessionPath);
    return { url: url.href };
  } catch {
    throw new HttpsError('unavailable', 'Billing management could not be opened. Try again or contact support.');
  }
}

// Only launch workspaces use this lease. Existing one-time customers and their Checkout remain unchanged.
export async function startLaunchReportCheckout(organizationId: string, projectId: string, params: URLSearchParams) {
  const org = organizations().doc(organizationId);
  const billing = subscriptionBilling(org);
  const project = org.collection('marketProjects').doc(projectId);
  if (!subscriptionEnrollment(organizationId) && !(await billing.get()).data()?.subscriptionId &&
    !(await project.get()).data()?.reportCheckout) return null;
  try {
    await clearExpiredReportCheckout(project);
    const attempt = randomUUID();
    const checkout = await getFirestore().runTransaction(async tx => {
      const [b, p] = await tx.getAll(billing, project);
      const target = p.data();
      if (!target || decisionReportAccess(target) !== 'none') throw new HttpsError('failed-precondition', 'This report is already unlocked.');
      const data = b.data();
      if ((data?.reportReservation?.projectId === projectId && data.reportReservation.expiresAt > Date.now()) ||
        (data?.checkout?.projectId === projectId && !data.subscriptionId)) {
        throw new HttpsError('failed-precondition', 'A report or subscription checkout is already in progress.');
      }
      if (target.reportCheckout) return target.reportCheckout;
      const next = { attempt, expiresAt: seconds() + checkoutLifetime };
      tx.update(project, { reportCheckout: next });
      return next;
    });
    if (checkout.id) {
      const session = await stripe('checkout/sessions/' + checkout.id);
      requireRecord(session.metadata?.reportAttempt === checkout.attempt && session.status === 'open');
      return { url: checkoutUrl(session.url), sessionId: session.id };
    }
    if (checkout.expiresAt - seconds() < 31 * 60) throw new HttpsError('failed-precondition', 'A previous checkout needs billing review.');
    params.set('expires_at', String(checkout.expiresAt));
    params.set('metadata[reportAttempt]', checkout.attempt);
    const session = await stripe('checkout/sessions', params, 'ifyoumind-report-' + checkout.attempt);
    requireRecord(providerId(session.id, 'cs_') && session.livemode === (stripeKeyMode(stripeKey.value()) === 'live'));
    const url = checkoutUrl(session.url);
    await getFirestore().runTransaction(async tx => {
      const data = (await tx.get(project)).data();
      requireRecord(data?.reportCheckout?.attempt === checkout.attempt && (!data?.reportCheckout?.id || data.reportCheckout.id === session.id));
      tx.update(project, { 'reportCheckout.id': session.id });
    });
    return { url, sessionId: session.id };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('unavailable', 'One-time checkout could not be opened. Please try again.');
  }
}

async function clearExpiredReportCheckout(project: DocumentReference) {
  const data = (await project.get()).data();
  const checkout = data?.reportCheckout;
  if (!checkout?.id || checkout.expiresAt > seconds() || decisionReportAccess(data) !== 'none') return;
  const session = await stripe('checkout/sessions/' + checkout.id);
  if (session.status !== 'expired' || session.metadata?.reportAttempt !== checkout.attempt) return;
  await getFirestore().runTransaction(async tx => {
    const current = (await tx.get(project)).data();
    if (current?.reportCheckout?.id === checkout.id && current?.reportCheckout?.attempt === checkout.attempt) {
      tx.update(project, { reportCheckout: null });
    }
  });
}
