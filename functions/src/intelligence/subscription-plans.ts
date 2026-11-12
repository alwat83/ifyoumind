export const SUBSCRIPTION_PLANS = {
  starter: { name: 'Starter', cents: 499, reports: 1 },
  plus: { name: 'Plus', cents: 999, reports: 3 },
} as const;

export type SubscriptionOffer = keyof typeof SUBSCRIPTION_PLANS;
export const isSubscriptionOffer = (value: unknown): value is SubscriptionOffer =>
  value === 'starter' || value === 'plus';

const workspaceId = /^[A-Za-z0-9_-]{1,128}$/;

export function subscriptionEnrollment(organizationId: string): boolean {
  const enrolled = (process.env.SUBSCRIPTION_ENROLLMENT || '').split(',').map(id => id.trim()).filter(Boolean);
  return enrolled.length <= 10 && enrolled.every(id => workspaceId.test(id)) && enrolled.includes(organizationId);
}

export function subscriptionCatalog() {
  const account = process.env.SUBSCRIPTION_STRIPE_ACCOUNT || '';
  const starter = process.env.SUBSCRIPTION_STARTER_PRICE || '';
  const plus = process.env.SUBSCRIPTION_PLUS_PRICE || '';
  return /^acct_[A-Za-z0-9]+$/.test(account) && /^price_[A-Za-z0-9]+$/.test(starter) &&
    /^price_[A-Za-z0-9]+$/.test(plus) && starter !== plus ? { account, starter, plus } : null;
}
