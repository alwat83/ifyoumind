# Billing budget alert proposal

**Status:** proposed for founder review. Nothing has been configured.

**An alert is not a cap.** A Cloud Billing budget only sends notifications. It never stops spending or services, and billing data can lag by several hours or more, so an alert can arrive after money is spent. The hard bounds on spending are code-level: #47's quotas and `maxInstances`.

## Proposed configuration
| Setting | Proposal |
| --- | --- |
| Billing account | The one linked to `ifyoumind-473fe` (must not be a Dose Ninja account) |
| Scope | Project `ifyoumind-473fe` only; all services |
| Period | Monthly |
| Amount | **$50 a month initial.** Adjust to about twice the typical monthly spend once you've checked the Billing report; I can't see current spend |
| Thresholds | 50%, 90% and 100% of actual spend; 100% of forecast spend |
| Recipients | Billing admins and users on the billing account (your ifYouMind address) |
| Credits | Exclude credits, so the alert reflects gross usage |

**Faster signal (recommended alongside, also free):** a Cloud Monitoring alert on Firestore document reads above **5 million in 1 hour**. Normal traffic is far below that, and this fires within minutes rather than waiting on billing data.

## Equivalent command (for review only; not run)
```
gcloud billing budgets create \
  --billing-account=<BILLING_ACCOUNT_ID> \
  --display-name="ifYouMind monthly guardrail" \
  --budget-amount=50USD \
  --filter-projects=projects/ifyoumind-473fe \
  --credit-types-treatment=exclude-all-credits \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 \
  --threshold-rule=percent=1.0,basis=forecasted-spend
```

The console path is Billing → Budgets & alerts → Create budget, with the same values.

**Approvals:** the amount; the recipients; whether to add the Firestore reads alert. Changing any billing setting needs your explicit go-ahead.
