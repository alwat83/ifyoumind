# Public plan comparison

November 10, 2026 · OpenAI / Codex. `codex/public-plan-comparison` is based on [homepage redesign PR #79](https://github.com/alwat83/ifyoumind/pull/79) at `d376f38`.

The redesigned homepage’s **See Pricing** link sent signed-out visitors to login. **Compare Plans** now expands a short comparison inside the pricing band. Visitors can see the free brief’s scope, the one-time report, and the Pro renewal and cancellation terms before choosing whether to create an account. Both paid options give access to the same full report.

The homepage still displays the existing $79 one-time price and $39 monthly Pro price. The purchase-intent and plain registration links use their existing destinations. **Open account pricing (sign-in required)** links to the existing authenticated pricing page. The comparison uses local presentation state and requires no price or billing request.

[Desktop capture](desktop.png) · [Mobile capture](mobile.png)

The follow-up is stacked for review against PR #79. The automatic build and authenticated QA workflows target PRs against `master`. Local checks cover this branch. Any release requires the homepage redesign to be reviewed and separate founder approval. The rollback is to revert this presentation change.

The commercial hypothesis is that visitors can compare the choices with less friction. Actual account creation, conversion and revenue effects remain unmeasured.

## Verification

- Production and local Angular builds, 137 fast checks, targeted template and TypeScript lint, the production bundle guard, and the public discovery isolation guard passed. The existing bundle budget still emits warnings.
- The final Hosting run passed 66 tests. It verified keyboard expansion and collapse, focus and accessible state, the signed-out URL, the account pricing link, and automated accessibility and overflow at desktop, mobile and 320 pixels. Visual inspection prompted a small spacing and icon cleanup, which was included in the final rerun.
- The final demo Firebase run passed all six targeted desktop and mobile cases. It verified the sample and registration journeys, paid intent, and sign-in return paths for report creation and account pricing.
