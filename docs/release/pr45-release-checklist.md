# PR #45 (customer-trust fixes): final production release checklist

**Status:** held for separate founder approval at head `b224851`. That head has master `2cbbba3` merged in. CI was green on it on 2026-10-14.

## Before merge
- [ ] Founder approval names the exact head.
- [ ] The PR head is still exactly that SHA.
- [ ] Master hasn't moved since the last CI run. It is now `94d8838` (#46), so **merge master in once more and re-run CI**. #46 touched only `functions/src/engine/`, the engine tests and the docs, so no conflict is expected.
- [ ] CI is green (`build` and `qa`) on the final head.
- [ ] The diff has only the reviewed files: `evidence-summary.ts`, `market-report.component.{ts,html}`, `market-report-findings.component.scss`, `public-landing.component.html`, `public-landing-offers.component.scss`, `consumer-home.component.html`, `auth/login/*`, `auth/register/register.component.html`, `docs/ux/city-input-proposal.md`, and the tests. **No sitemap or build artefacts.**
- [ ] No Stripe, pricing, functions, rules or entitlement files are in the diff.
- [ ] Wording re-checked:
  - no "favorable" or "caution";
  - no "about the same" or "no clear difference";
  - the method note says nothing has been tested for significance;
  - small gaps are flagged "may not be real".

## Merge and deploy
- [ ] Merge commit only (no squash or rebase), with a message that names the head and the rollback.
- [ ] Watch the production deploy run to success for that commit.
- [ ] Don't push anything else to master until verification is done.

## Production verification
**Signed out (available now):**
- [ ] `/sample-report`: the headline matches the reviewed Austin text, each gap shows its size, Nashville's 1-point growth gap is flagged, and the method note is present.
- [ ] Homepage: the sample card text is the reviewed version, and "your own data", "neighborhood" and "household signals" are absent.
- [ ] `/login`: "Forgot password?" is shown. The message for an unknown address is the same as for a known one.
- [ ] `/register`: the Terms and Privacy links open the right pages.
- [ ] Phone width (Pixel 7 size): the headline is on the first screen, and the $79 prompt comes after the comparison.

**Signed in (needs the dedicated ifYouMind QA account):**
- [ ] An older saved decision renders without errors.
- [ ] A new free decision shows the new summary.
- [ ] A reset email arrives; check its sender, link domain and spam placement.

**With production log access:**
- [ ] No new client or function errors in the first hour.

## Rollback
Revert the merge commit and push. That triggers a redeploy of the previous Hosting build. There are no data or schema changes.
