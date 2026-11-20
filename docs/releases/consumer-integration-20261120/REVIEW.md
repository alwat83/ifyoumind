# Consumer integration release review

November 20, 2026 · OpenAI / Codex · Development candidate on `codex/consumer-integration-release`.

## Incorporated work

| Source | Reviewed head | Included behavior |
| --- | --- | --- |
| #114 | `0434f1eed394480209407791b7ec1c8d9dcfeacf` | Standing consumer-first instructions and Grandmother Test in the PR template. |
| #115 | `1e19500b21f6076060c9f9ab5cea24d7665017d4` | Account-free tax finding before input, $420 increase, $240 school contribution, synthetic labeling and evidence. |
| #116 | `18a9344aadd2a3cdbb132712de5e1c65d89aed72` | Plain-language homepage, visible tax limitation and category-only return navigation. |
| #117 | `026e518eb595421a348f67daf24e821a49232bd0` | Clean consumer URLs, legacy redirects and the existing authenticated journey. |

All four source heads had passing Launch and Authenticated QA workflows when inspected. #115, #116 and #117 are ancestors of the candidate. The #114 merge conflicted only in the master record, current snapshot and development log. Both records were preserved. Its older execution sequence was updated to the founder’s November 20 directive.

The additional implementation makes pricing public in the existing component. Free examples and the $79 city/Business Decision Report can be inspected before sign-in. Monthly details explicitly show that new enrollment is closed. A verified identity is required before the component reads the workspace, report, credit or subscription status. Anonymous query parameters do not establish a payment outcome. Existing signed-in billing actions still use their current services.

The public component also observes later identity changes. Signing out clears private status and controls; a delayed workspace, status or report response cannot restore the previous reader's information. Pending Checkout responses cannot redirect a signed-out reader. Four targeted desktop/mobile regressions cover sign-out before and after the billing response. The first lifecycle check exposed stale rendered pricing after cross-tab sign-out; running the identity update in Angular's zone and rejecting stale responses resolved it. All four then passed against the demo emulators.

## Screens and journey

- [Current production homepage before](../../design/consumer-question-entry/before-home-1280.jpg) and [mobile before](../../design/consumer-question-entry/before-home-390.jpg).
- [Integration homepage](../../design/consumer-integration/after-home-1280.jpg), [mobile](../../design/consumer-integration/after-home-390.jpg), [320 px](../../design/consumer-integration/after-home-320.jpg).
- [Discovery](../../design/consumer-integration/after-discovery-1280.jpg) and [320 px](../../design/consumer-integration/after-discovery-320.jpg). The inherited #115 captures record its earlier chooser.
- [Live pricing detour before](../../design/consumer-integration/before-pricing-390.jpg) and [public pricing after](../../design/consumer-integration/after-pricing-390.jpg).
- [820 px pricing](../../design/consumer-integration/after-pricing-820.jpg) and [320 px pricing](../../design/consumer-integration/after-pricing-320.jpg).

Local captures use the actual Hosting emulator. The standard visual CSS hides only the emulator warning banner. Before-pricing captures use a fresh anonymous production context, which reached sign-in. The screenshots contain synthetic/public examples.

Question → finding → evidence uses the existing tax and electricity calculators. Public pricing leads to a free example or a report sample. City decision creation, saved history and account tools retain their authentication boundary. Back and reload checks verify a category-only return link and discarded uploaded test data.

## Verification

Implementation head `8f5c86ceba165439cea5406c36c416f730088b4d` passed both [Launch 44792673526](https://github.com/alwat83/ifyoumind/actions/runs/44792673526) and [Authenticated QA 44792673230](https://github.com/alwat83/ifyoumind/actions/runs/44792673230). Read the completed logs: 180 authenticated browser, 84 Hosting, 48 local Discovery, 27 electricity, 36 unified Discovery, 72 Functions, 144 fast web, 8 rules, 5 organization, 48 commerce and 24 fixture/access checks passed. One historical fixture was skipped; zero failures. All reviewed visual baselines passed without changes on this run. This evidence-only follow-up preserves that implementation; the draft PR's checks identify the final candidate head separately.

The integration PR records the final exact commit and workflow links. The local production build and fast tests passed. The first Hosting run passed 83 cases and reported one duplicate-link selector after adding header pricing. Scoping that assertion to the footer resolved the test. The targeted rerun passed six cases, including anonymous pricing without backend writes.

The first full integration run passed 84 Hosting and 173 authenticated browser checks. Three visual cases reported the two missing public-pricing baselines and the mobile homepage footer change. Inspected both new pricing images and all expected/actual/diff images for the homepage before adopting those three baselines. The signed-in pricing and evidence baselines matched. The targeted authenticated rerun passed four cases, including unverified public pricing and a legacy pricing sign-in link. The local SEO audit passed 60 raw/rendered observations and 10 sitemap URLs. Follow the final candidate workflows for the exact reviewed head. They cover authentication, unverified access, unauthorized workspaces, city-save retry, entitlement confirmation, pending and canceled checkout, legacy Pro, screenshots, browser-local privacy and accessible mobile layouts. The historical server-side email-verification fixture remains skipped. Physical-device and spoken screen-reader validation and real-user comprehension remain unmeasured.

After the identity-lifecycle correction, `npm run build` passed again. Angular aborted under sandbox worker restrictions on the first attempt; the normal unsandboxed build completed with the two existing Discovery stylesheet warnings. The four additional lifecycle checks passed with `QA_PORT=4307 QA_BROWSER_CHANNEL=chrome firebase emulators:exec --project demo-ifyoumind --only auth,firestore,functions "npx --no-install playwright test --config e2e/playwright.config.mjs e2e/specs/session.spec.mjs --grep 'public pricing clears' --workers=1"`. These local results are separate from the final exact-head workflows linked on the draft.

## #111 live gate assessment

The live retry test remains unverified. The earlier internal smoke workspace failed the mandatory preflight. No production fixture was created.

The candidate has no diff against deployed master `6dcffca4eb186c6e0da7431523d7137652e14990` in Functions, Firestore/storage rules, the city writer service, the monetization service or purchase-intent handling. Clean routes point to the same components and same callable services. The request ID and quota implementation are the deployed #111 implementation. Guest pricing adds no workspace or commercial requests.

There is therefore no new city-save implementation or backend prerequisite in this UI candidate. Recommendation for founder decision is to allow the consumer UI release to be reviewed independently while retaining the unresolved live #111 test. That recommendation does not remove the founder’s existing release gate. Release awaits explicit approval, including the decision on this dependency.

## Production and rollback

Fresh readback verified Hosting `39dc573f3826dca6`, release `1794933315802000`, and writer `createmarketintelligenceproject-00087-nub` ACTIVE at 100%. Earlier Hosting `cd0b78221355e0f4` is finalized, and the prior compatible writer `createmarketintelligenceproject-00086-ned` is Ready. Checkout is ACTIVE with empty subscription enrollment. These are read-only observations.

1. Obtain founder authorization for the exact candidate and the #111 gate decision. Recheck master, candidate CI and finalized current Hosting before release.
2. Account for the existing master-push workflow. It deploys Hosting, rules and the allowlisted Functions, even when the Functions source is identical. A Hosting-only release needs its own explicitly approved execution path. Do not infer permission to change that workflow.
3. Verify the released Hosting version and source commit independently. Smoke public pricing, example evidence, authentication, legacy saved links and signed-in return paths without creating payments or production fixtures.
4. If Hosting recovery is required, use the retained `39dc573f3826dca6` release configuration as the immediate prior production target. Retain the compatible writer. Rollback execution requires founder authorization.
5. Existing provider callbacks use the old routes and can be interpreted by both prior and candidate Hosting versions. Bookmarks copied from clean routes require a Hosting version with that route table. A rollback temporarily removes the new public pricing and those clean routes.

## Grandmother Test and limits

Engineering checks establish free entry, readable findings, evidence controls, explicit limitations, next-step links, recovery, and access to saved decisions. They do not establish comprehension or comfort returning. The next observed session should ask a consenting participant to describe the tax finding, identify one limitation, find its source and explain what they would check next. The local pilots remain separate.
