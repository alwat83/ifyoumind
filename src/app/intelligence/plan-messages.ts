// Account-page wording for a Pro subscription. Kept free of Angular so test/plan-messages.test.mjs can run it.
// It always describes what the customer actually pays, which matters once a new list price launches and
// earlier subscribers keep their price.

export interface SubscriptionView {
  monthlyUsd:number|null;
  grandfathered:boolean;
  listMonthlyUsd:number;
  cancelAtPeriodEnd:boolean;
}

const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:n%1?2:0}).format(n);

export function planMessages(subscription:SubscriptionView|null|undefined):{price:string|null;earlierPrice:string|null;cancellation:string}{
  const price=subscription?.monthlyUsd!=null?`You pay ${usd(subscription.monthlyUsd)}/month.`:null;
  const earlierPrice=subscription?.grandfathered&&subscription.monthlyUsd!=null
    ? `You're on an earlier price. It stays ${usd(subscription.monthlyUsd)}/month for as long as your subscription stays active; the current price for new subscribers is ${usd(subscription.listMonthlyUsd)}/month.`
    : null;
  const keep='Reports you have already unlocked stay unlocked, and your decisions stay in your account.';
  const cancellation=subscription?.cancelAtPeriodEnd
    ? `Your subscription is set to end at the close of this billing period. ${keep} To keep it, open Manage billing before then.`
    : subscription?.grandfathered
      ? `You can cancel at any time in Manage billing; it stops at the end of the billing period. ${keep} If you subscribe again later, the current price applies.`
      : `You can cancel at any time in Manage billing; it stops at the end of the billing period. ${keep}`;
  return {price,earlierPrice,cancellation};
}
