# PR76 — first-screen discovery release review

November 5, 2026 CST · OpenAI / Codex. **Committed, locally verified and exact-head CI successful. GO for founder release review; not merged or deployed.** No human usefulness/conversion result claimed.

## Decision and exact candidate

Review only [PR76](https://github.com/alwat83/ifyoumind/pull/76) at **`0971a1b48edf36a00acef78696bc8807528f27ac`**, base/master `c01c93cd1c270949b4c778f4d52e4af1f1e8b25e`. Earlier green `3eb2789` remains history, not this candidate's CI. The existing first-use packet `a6f4c7c` and focused fix `0971a1b` are fast-forward descendants; no source branches replayed or merged.

The homepage puts a useful synthetic electricity/property-tax finding, selection and matching free-example action in the first screen. Exact arithmetic is expandable; supporting artwork follows. November5 local review found and fixed two concrete accessibility problems:

- At320px with increased text spacing, “Try discovery” extended to331.39px and was clipped by the landing container. Navigation and footer action groups now wrap within their available width.
- Forced-colors mode removed the selected option's background/shadow distinction. Explicit system-color borders retain the selection marker while keyboard focus remains separate.

Only three landing HTML/SCSS files differ from production, plus four browser-test files and documentation/evidence. The new correction itself changes two style rules and adds two regression cases across three viewport projects. Business/sample/free/79report/39monthlyPro/five reports, authentication/paid intent, shared discovery engine, source evidence, recognized local USD CSVs and clear/recovery boundaries remain. No backend, dependency/lockfile, Firebase config, deploy workflow, Stripe, price, AI/PDF/upload/storage/category changes.

## Concrete review

[Original first-screen desktop](screenshots/desktop-fold.png) · [mobile](screenshots/mobile-fold.png) · [320px](screenshots/narrow-fold.png) · [design walkthrough](REVIEW.md).

[Clipped navigation before](accessibility-20261105/before-narrow-spacing.png) · [wrapping after](accessibility-20261105/after-narrow-spacing.png) · [forced-colors before](accessibility-20261105/before-forced-colors.png) · [selected marker after](accessibility-20261105/after-forced-colors.png).

Normal-screen captures are the preserved original3eb iteration; new captures show the accessibility correction. Text-spacing overrides deliberately increase page height; the default first-viewport promise does not mean enlarged text must fit without vertical scrolling. Screenshots and browser emulation are not real-device or participant evidence.

## Verification and remaining gates

New final local production build PASS; production bundle guard PASS36files; fast137PASS/0FAIL/0SKIP; integrated Hosting browser72PASS/0FAIL/0SKIP at1280/390/320, including six new text-spacing/forced-color executions. Both selection states and keyboard focus checked. Supplemental five-scenario probe covers text spacing at1280/390/320, short568×320 landscape and forced colors: no offscreen checked controls or clipped metric text, disclosure works, selected tax action has the correct destination. [Before](accessibility-20261105/before.json), [after](accessibility-20261105/after.json), [image hashes](accessibility-20261105/manifest.json).

New exact-head [build42140134230 SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/42140134230) and [full QA42140134237 SUCCESS](https://github.com/alwat83/ifyoumind/actions/runs/42140134237). Decoded new-head logs confirm295browser (48tax/27electricity/36unified/72Hosting/112authenticated),137fast/72Functions/rules7/org5/commerce29PASS; fixtures24PASS+1existingSKIP, not counted as a pass. [Final CI/PR observation](accessibility-20261105/ci-final.json). Fresh PR observation: OPEN/DRAFT/MERGEABLE,47changedfiles, unchanged basec01c93c. Prior3eb289browser results remain historical and are not substituted.

First local build/browser/emulator attempts were blocked by the sandbox; approved local execution succeeded. The old ignored node_modules link pointed to a deleted worktree: preserved in ignored tmp, then npm ci restored the exact lockfile. First supplemental script needed an Angular-bootstrap wait before assessing live handlers; invalid startup interactions were discarded. First integrated fix run69PASS/3FAIL exposed Chrome forcing transparent borders identically; explicit ButtonFace/ButtonText fixed it, final complete72PASS. Failed attempts are not passes.

Historical global91lint/11Angular compiler debt and one existing fixture skip remain; not claimed fixed. Initial bundle660.52kB exceeds500kB warning; landing main6.76kB and mobile4.61kB exceed4kB style warnings, below8kB error budgets. Mobile styles increased from the previous4.40kB; no budget relaxed. Other existing warnings remain. Native-device/Safari/iOS, spoken screen reader, real signup/email/payment and real first-use comprehension/engagement/retention/conversion remain unverified. [Ready permitted first-use round](FIRST_USE_VALIDATION.md) is not conducted and is recommended before broader distribution. None of the internal checks represents genuine traffic or revenue.

## Production and actual deployment scope

Fresh read-only Hosting channel metadata confirms live **608bc867ecf986ac**, release1793817118849000, FINALIZED45files/notdeleted, released2026-11-04T18:31:58.849Z. [Sanitized observation](accessibility-20261105/production-baseline.json). Association toPR75/c01c93c comes from [successful exact-commit deployment41887559100 and prior live verification](../../releases/visual-discovery-20261104/LIVE_VERIFICATION.md); Hosting does not embed the Git SHA. No fresh live browser suite claimed today.

The unchanged [master-push workflow](https://github.com/alwat83/ifyoumind/blob/0971a1b48edf36a00acef78696bc8807528f27ac/.github/workflows/firebase-production.yml) deploys **Hosting, its listed unchanged Functions, Firestore rules/indexes and Storage rules**. Approval must cover this actual scope. It is not a Hosting-only operation. No merge, deployment, rollback, spending or Stripe configuration change has occurred.

Before an authorized merge: recheck exact candidate/base, current successful CI, mergeability, changed-file scope, then-current live/retained rollback version. If the approved head or material scope changes, obtain renewed approval. Merge only76 with an expected-head guard; do not separately merge its shared source/documentation branches. Monitor the resulting production workflow and compare the approved/merged tree.

After deployment: verify homepage first-screen selection/action/evidence on desktop/mobile/320px, text-spacing and forced-colors selection, both full examples/source values/correction/clear, retained Business/prices/registration intent, offline-after-load, isolation headers/assets/redirect/404 and no discovery storage/external calls. Use synthetic/internal read-only checks; no signup/payment or outreach. Record exact merge SHA, workflow, Hosting version and results separately.

## Rollback

Current608bc867ecf986ac is the pre-release artifact to revalidate and retain before/after an authorized release. Hosting restoration needs applicable explicit approval and restores frontend files only. It does not roll back Functions/rules or Git. Prepare a separately reviewed source restore of the three landing and four browser-test files to productionc01c93c, preserving append-only documentation; reverting only0971a1b would remove the accessibility correction but leave the first-screen redesign in place. No schema migration or rollback performed.

## Founder release boundary

**Technical GO for founder release review:** exact-head CI has succeeded; human validation remains a disclosed separate gap. “Keep going” authorizes continued feature-branch work, not production release. [AGENTS.md](../../../AGENTS.md) requires explicit founder approval before master merge/deployment. A concrete decision would authorize **only PR76 at0971a1b48edf36a00acef78696bc8807528f27ac and its configured automatic Firebase deployment**, acknowledging the limits above.

Outbound remains **Pending Founder Setup**; no recruiting, sender question, message/post, account setup, purchase or new service expense. Free household discovery and optional paid Business remain distinct.
