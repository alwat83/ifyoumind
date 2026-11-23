# GA4 — consented acquisition measurement

November 23, 2026 · OpenAI / Codex · [Draft PR #128](https://github.com/alwat83/ifyoumind/pull/128) · **OFF baseline preserved; separate activation candidate prepared, not deployed.**

## Current reconciliation — November 23, 2026

**Enhanced Measurement is independently verified savedOFF after a fresh reload** of property565380927 /stream16394318092 /G-NRT31062LW at approximately18:52–18:54UTC. The founder completed the change; Codex did not change a Google setting. The datedON observations below and in the frozenPR128 evidence are historical, superseded by this readback. The UI still lists standard Pageviews; the application retains `send_page_view:false` and manual sanitized views. No need to ask the founder to disable it again. Recheck at future deployment and STOP if it has driftedON.

The original OFF source/evidence head **b86229d9f7887d0ba79204660d1be3bec098c55d**, executablea661acd1 and their frozen archives remain unchanged. A separate `codex/ga4-activation-candidate` branch changes only the productionflag in application code and necessary tests. A true flag **in an undeployed candidate is not live activation**. Do not merge, deploy or collect until separate production authorization. [Current reconciliation and release scope](ACTIVATION_RECONCILIATION.md).

## Decision and verified audit

Use one direct Google tag, **G-NRT31062LW**, for the ifYouMind production stream **16394318092**, property **565380927**. The earlier read-only audit confirmed the stream URL `https://ifyoumind.com`, the ID, zero connected site tags and Enhanced MeasurementON at that time. The fresh savedOFF readback above supersedes that setting observation. The screen reported no data received in the preceding 48 hours; this is an observation, not a diagnosis of production traffic or revenue.

Google's installation screen offers **GTM-TMM5XMZF**. That container is absent from the repository's installed scripts and was not installed during this assignment. Do not install both that offered container and the direct tag. Historical Firebase configuration contained **G-DZMLBPS4ZX**, automatic screen/user tracking, and an unmounted consent UI. The candidate removes those Analytics providers and replaces the old arbitrary event/raw-URL service. This establishes code risk; it does not prove historical collection actually occurred.

**Frozen OFF baseline:** `GA4_PRODUCTION_ENABLED = false` in PR128 at b86229d9. Only the separate, unmerged activation branch prepares `true`, still requiring consent. No released code was changed. No production tracking, Google settings change, Stripe request, deployment, purchase, provider call or account modification was performed.

## Privacy and consent contract

- Basic consent: no tag request, queued pre-consent events or Google collection before affirmative analytics permission. Reject and Manage are available alongside Allow. Corrupt, legacy, future-dated and expired preferences fail closed. Product use does not depend on permission.
- Consent preference: versioned first-party choice, up to 180 days. Analytics cookies: configured for 30 days, no rolling extension. Withdrawal disables future events, cancels pending local work and clears analytics cookies/Checkout dedupe. Previously collected Google data is not retrospectively deleted.
- Google receives a browser identifier and ordinary technical metadata; analytics is **not anonymous**. No Firebase Auth UID, email, name, organization/project/transaction ID, original question, report contents, bill values, amounts or payment credentials are event parameters. No User-ID or advertising/personalization signals are configured.
- Paths and titles come from a finite table. `/decisions/<private-id>` becomes `/decisions/detail` / “Saved finding”; every query and fragment is excluded. Unknown routes are unmeasured. Referrers are reduced to recognized source labels; no raw referring URL is sent.
- Only enumerated campaign labels and event parameters are accepted. Unknown keys or values reject the event. Consent persists, while campaign attribution is held in memory for that document only; no cross-session UTM storage or retrospective attribution.
- Existing authenticated first-party `recordProductEvent` telemetry is also gated by the choice. Its tenant context stays first-party and is never forwarded to GA4. This is distinct from Google's event payloads.
- **Private `/discover/` is a different browser document with `connect-src 'none'`.** No Google, Auth, analytics or server import enters that isolated bundle. Bill processing remains local and untracked even when consent was granted on the public site. Consent does not authorize bill telemetry.
- Static guides and the static 404 do not bootstrap the Angular tracker and are not covered. Ordinary unlisted campaign names/search terms are intentionally dropped. No hidden catch-all collector.

The tag receives sanitized location/title/referrer on configuration and every manual event. `send_page_view:false` prevents the initial automatic page view, but **does not disable Enhanced Measurement history events**. Consequently all Enhanced Measurement auto-events must be disabled in the stream before activation. This is an external release gate, not an asserted property of this draft.

## Events and authoritative purchase proof

| Event | Trigger | Allowed extra parameters |
| --- | --- | --- |
| `page_view` | One current route after consent, then completed SPA navigation | Sanitized page fields and allowed campaign labels |
| `free_tax_example_viewed` | Public illustrative tax finding is revealed | None |
| `free_electricity_example_viewed` | Public illustrative electricity finding is revealed | None |
| `evidence_revealed` | Public evidence disclosure opens | `example`: tax, electricity or cities |
| `registration_completed` | Successful email registration or genuinely new Google account | `method`: email or google |
| `checkout_started` | Successful Checkout creation/reuse response | `offer`: report, starter or plus |
| `purchase_verified` | Consented authenticated return independently matched to a signed-webhook receipt | `offer`: report, starter or plus |

Example/evidence events dedupe within the current route. Checkout attempts dedupe by a local SHA256 of the Session ID, including reused sessions across reloads; no Session ID is sent to Google. Storage denial fails closed for that measurement and never blocks Checkout.

New callable `claimVerifiedPurchase` reads existing **server-owned `stripePayments`** receipts, not a browser success flag. It requires verified authentication, active owner/admin membership, matching workspace/project/offer, live mode, USD, exact current price, fulfilled payment/paid-invoice state and a receipt no older than 24 hours. A bounded Firestore transaction (max three attempts, 15-second callable timeout) atomically creates one hash-only claim per payment receipt. Rules already deny client access; a regression asserts that denial. Claims contain a timestamp and consent version, with no identity, amount or report data. No new billing webhook or Stripe API call, and no entitlement/allowance mutation.

A refreshed redirect, free report credit, legacy Pro entitlement, pending payment or test-mode receipt is never revenue proof. Starter/Plus initial paid invoices qualify; renewals without the matched Checkout context do not. Legacy Pro is not newly instrumented as a new-customer offer.

**At-most-once, best-effort conversion counts:** claiming precedes the browser event. A blocked tag, withdrawal, lost response, tab closure or absence of a timely consented return can undercount. There is no background replay, retry-until-delivery or customer identity in GA4. Do not use this custom event as a GA4 ecommerce revenue ledger: no `value`, `currency`, `transaction_id` or purchase amount is transmitted. Stripe remains the financial authority. Claim hashes have no automatic TTL in this change; existing retention/privacy policy applies. A support deletion must use authorized internal procedures.

## Attribution for the approved organic campaign

Use, for example:

```text
https://ifyoumind.com/?utm_source=instagram&utm_medium=organic_social&utm_campaign=property_tax_carousel_v2&utm_content=bio
https://ifyoumind.com/?utm_source=facebook&utm_medium=organic_social&utm_campaign=property_tax_carousel_v2&utm_content=carousel
```

Allowed sources: instagram, facebook, google, bing, tiktok, linkedin, newsletter. Mediums: organic_social, social, organic, referral, email, cpc. Campaigns: property_tax_carousel_v2, welcome_launch, electricity_example, city_comparison. Content: bio, carousel, reel_01, slide_01 through slide_05. Adding a campaign is a reviewed allowlist change. Organic Google/Instagram/Facebook referrers are classified locally when no allowed source is supplied. Never place emails, personal questions, report IDs or bill figures in campaign links.

## External activation and deployment checklist — not executed

1. Founder authorizes the focused GA4 release and stream change. Select account **ifYouMind**, property **ifYouMind — Production (565380927)**, then **Admin → Data collection and modification → Data streams → ifYouMind — Production Website (16394318092)**. Confirm URL `https://ifyoumind.com` and measurement **G-NRT31062LW** before editing. The latest read-only review (November23, about17:40UTC) still showed Enhanced MeasurementON and0connected site tags. Do not use Dose Ninja's property or the offered GTM container. After authorization only, switch Enhanced MeasurementOFF, complete any confirmation/save presented by Google, close the details and reopen the same stream (then reload). Independently verify the saved switch readsOFF, auto/history/form/click/search/download/video/scroll measurement is disabled, and the ID/property/URL are unchanged. Capture a sanitized screenshot and timestamp. `send_page_view:false` must also remain in the application: it controls the standard initial view; the stream change prevents extra automatic events. If the saved state cannot be read back, stop activation. Review Google Signals, user-provided data collection, external tag destinations and advertising features; keep them off. Review property retention (recommend two months); these settings were not comprehensively verified in this review.

2. Enable only the reviewed `GA4_PRODUCTION_ENABLED` flag in a new exact source candidate after the readback. Re-run focused tests, changing the default-OFF test only as part of that explicitly approved release. No runtime URL/query parameter can enable production collection.
3. Separately authorize and deploy **only `claimVerifiedPurchase`**, with existing narrow Firestore access and no Stripe/OpenAI secret binding; verify its identity, authorization denials and rules. Do not deploy unrelated Functions/rules. Then deploy the matching Hosting candidate, retaining all current marketing assets. Neither deployment is authorized by this draft.
4. Capture the then-current Hosting release and callable revision/absence for rollback. Last verified prior release is Hosting **08500dca665abbab**, release **1795392328755000**; retained previous **2bb9f7f3c6545b0e**. These are historical anchors, not a fresh rollback preflight. Restore only a separately authorized known Hosting artifact; do not automatically roll back or alter AI/billing.
5. In a fresh signed-out browser, reject consent: verify no Google tag/collect request and usable examples. Clear only the test browser's preferences, allow consent, use an approved UTM link, then visit pricing and return: one manual page view per navigation, no raw query/IDs, one tag/destination. Check withdrawal and private Discovery in Network.
6. **Realtime:** open the correct property, Reports → Realtime. Observe the consented page and example/evidence events. Do not interpret internal QA as acquired customers. For **DebugView**, use a private Tag Assistant debug session against the approved destination (not a permanently enabled production debug flag); verify `debug_mode` is limited to that test session. Avoid entering private questions or account/bill data. Check payloads in Network, not merely event totals. Close debugging afterward.
7. Verify registration and Checkout measurement with existing local mocks first. An actual purchase count requires an independently existing/newly authorized genuine Stripe-confirmed receipt; do not create a live Checkout or charge solely to test analytics under this assignment. Verify duplicate-return rejection server-side. Revenue reconciliation remains Stripe-only and the previously accepted live-payment waiver stays explicitly unverified.
8. Stop activation on duplicate/unsanitized automatic events, unexpected destination, consent bypass, private Discovery traffic or authorization failure. Keep the flag false or restore the separately approved previous Hosting version. Do not compensate by weakening privacy assertions.

Official references: [basic consent](https://developers.google.com/tag-platform/security/concepts/consent-mode), [consent implementation](https://developers.google.com/tag-platform/security/guides/consent), [manual views and Enhanced Measurement caveat](https://developers.google.com/analytics/devguides/collection/ga4/views), [SPA measurement](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications), [configuration overrides](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [privacy controls](https://developers.google.com/tag-platform/security/guides/privacy).

## Impact assessment

| Surface | Disposition | Evidence / rationale |
| --- | --- | --- |
| Public Angular routes | Change required | Single sanitized tracker; mounted consent UI, example/evidence hooks |
| Registration / authenticated navigation | Change required | New-account hook, consent state, sanitized private-route aliases; auth rules unchanged |
| Pricing / Checkout return | Change required | Count-only hooks; server receipt proof, never redirects as payment evidence |
| Billing / entitlement / Stripe / AI | Verify only | No configuration, payment, entitlement, model or commercial handler changes |
| Firestore / authorization | Change required | New private claim collection/callable; existing deny-by-default rules unchanged, tested |
| Discovery / private CSV | Verify only | Separate untracked document, offline upload/clear and unchanged storage |
| Mobile / a11y / application states | Change required | Reused Midnight Slate banner, native dialog, reject/manage/withdrawal/regrant/error states |
| Static guides / 404 / marketing JPEGs | Not affected | No tracking imports or asset changes; those static pages remain outside coverage |
| Production operations / CI / dependencies | Verify only | No deployment, workflow/lockfile/provider/billing change; local evidence is not hosted CI |

## Visual evidence and verification

Before-consent / accepted states of the actual candidate, not a new homepage design:

| | Pending choice | Accepted choice |
| --- | --- | --- |
| Desktop 1280 | [Screenshot](screenshots/consent-desktop.png) | [Screenshot](screenshots/accepted-desktop.png) |
| Mobile 390 | [Screenshot](screenshots/consent-mobile.png) | [Screenshot](screenshots/accepted-mobile.png) |

The homepage hero, reveal, typography and CTA are unchanged. The consent banner and native preference dialog use existing tokens; no animation was added. Automated axe and overflow checks cover 320, 390 and 1280 CSS pixels. Installed macOS Chrome is not physical Safari, spoken VoiceOver or pinned Linux pixel comparison. No visual baseline was automatically changed.

Exact commands, final counts, source SHA and known failed diagnostic runs are recorded in [verification evidence](VERIFICATION.md). Retain ignored local logs/traces privately: they can contain synthetic Auth emulator tokens and must not be attached publicly.

**Recommendation:** GO for draft code/founder review after applicable local checks. **NO-GO for unauthorized production collection**; the saved-OFF prerequisite is now satisfied. Exact-source activation/deployment authorization and real collector/Realtime readback remain outstanding. Current implementation is not deployed or GA4-production-verified. No acquisition, willingness to pay or revenue result is claimed.

## Final release review — November 23, 2026

Pinned review baseline: **c4ede4fffa866cad1ea9d2eaf20cad14cbf3368b**. The only necessary application correction found was cross-tab withdrawal: `localStorage.clear()` sends a storage event with a null key. The pinned listener ignored it, leaving an already-consented tab active. A failing browser test reproduced this before the one-condition correction. The same test now passes at320/390/1280; ordinary removal, reload persistence, rejection, regrant and malformed/expired choices remain covered. No visual change, paid-flow or purchase-callable implementation change.

The final candidate deliberately remainsGA4OFF. Approval to deploy this disabled candidate does not authorize changing the flag, editing Google settings or collecting events. A later activation candidate must pin the separately approved flag change and repeat its applicable checks. Hosting and the new callable can be released separately; new claim availability never opens enrollment or alters report access.

### Narrow callable package and deployment plan (preparation only)

Use the existing validated isolated-entry pattern; do not modify `functions/package.json` in the reviewed checkout or deploy the multi-function activation entry. Build the exact approved Functions source into an ignored staging directory; copy only compiled `lib`, package JSON and the existing lockfile. The staged package's main is `lib/ga4-entry.cjs`, with exactly this bootstrap:

```js
const {getApps,initializeApp}=require('firebase-admin/app');
const {setGlobalOptions}=require('firebase-functions/v2');
if(!getApps().some(app=>app.name==='[DEFAULT]'))initializeApp();
setGlobalOptions({region:'us-central1'});
module.exports={claimVerifiedPurchase:require('./intelligence/acquisition-measurement').claimVerifiedPurchase};
```

This is an isolated deployment artifact, not an unchanged standard package. Offline review must require it twice, verify idempotent Admin initialization, exactly one export, `us-central1`, timeout15s, maxInstances2, concurrency10 and **zero secret bindings**. The entry imports no Stripe/OpenAI handlers. Do not copy `.env*`, `.secret*`, credentials, node_modules or runtime config into the final package. Confirm package/compiled-file hashes and record all differences from the source package.

After separate deployment authorization only, use FirebaseCLI13.35.1 with an isolated functions-only config, explicit project `ifyoumind-473fe` and `--only functions:claimVerifiedPurchase`. Do not run a broad Functions/Hosting/rules command or workflow. Record the approved existing runtime service account and its Firestore access before deployment; abort unexpected IAM, secret or permission requests rather than granting access. Verify the new revisionACTIVE/Ready/100%, region/limits, intended runtime and no secrets. Because this is a new callable, it has no prior revision to restore. A function outage must leave Checkout/report delivery working and suppress the analytics count.

Then, separately authorize a Hosting-only release from the matching exact source/static manifest using the existing isolated Hosting procedure. Preserve the six approved marketing JPEGs and every non-target asset; keep DiscoveryCSP and Hosting configuration unchanged. A disabled candidate may be inspected safely without loading Google. Enabling live GA requires the separately reviewed flag-on source plus the saved external settings readback. Do not substitute or rebuild a frozen release artifact during deployment.

### Rollback and post-deployment boundaries

Read-only production observation **2026-11-23T17:42:33.548Z**: Hosting **08500dca665abbab FINALIZED**, all64serving file hashes/config match the retained approved artifact; older **2bb9f7f3c6545b0e** returnedHTTP200/FINALIZED. New callable metadata returned404 (not deployed). This review made zero production writes. Freshly repeat these observations at any future authorized deployment; past availability is not a future rollback guarantee.

The immediate Hosting rollback target for a future GA release is the currently serving08500dca665abbab, not automatically the older2bb9version. Capture its release ID, normalized config, file inventory and restorable artifact; require read and update/release permissions before starting. Use the established console rollback/provider release-version operation only after separate rollback approval; read back the resulting version and anonymous asset hashes. No automatic rollback.

Restore the prior untracked Hosting client first if collection/privacy fails. The new receipt callable has no financial side effects and need not be deleted to restore the client; disabling/removing/changing that callable requires separate authorization. Do not roll back Stripe/webhooks/AI/rules or touch any claim/payment/customer records to make a test pass.

For an approved flag-OFF deployment: verify no Google request even with stored analytics permission, correct auth/tenant denial on the callable, and unchanged purchase/report/navigation flows. Test a valid production receipt only if separately authorized; do not create payment/claim records for this readiness review. For an approved flag-ON activation: verify pending/rejected/expired consent sends nothing, one destination/manual view per SPA navigation/reload, withdrawal/regrant/cross-tab clear, sanitized payloads and private Discovery with zero post-load traffic; compare Realtime/DebugView to the explicit expected QA event sequence. Retain the claim-before-delivery undercount and the Stripe-only revenue rule. Unexpected collection, duplication or sensitive payloads stop activation immediately.

### Prepared review packages — still OFF, not authorized for deployment

Executable source **a661acd16969913ab85bb524aaf677acbbabe348** passed the exact-source native gate (453tests and both guards, zero changes). The final PR evidence commit is documentation-only. [Sanitized manifest/archive hashes](release-candidate.json) distinguish this frozen executable from its final documentation head.

Local Hosting package: `test-results/ga4-final/hosting-a661acd1-filtered/` (66files); single-callable package: `test-results/ga4-final/functions-a661acd1/` (87files). Neither was deployed. The function package copies reviewed `src`, compiled `lib`, `tsconfig`, package/lockfile, changes only stagedpackage.main, and adds the bootstrap above; no environment/secret files or node_modules. Admin initialization/exports/endpoint metadata were inspected offline without invoking it. Full manifests/archives remain local.

The Hosting staging step explicitly excludes only13empty tracked marketing `.gitkeep` directory placeholders in accordance with the existing Hosting `**/.*` ignore. It must verify each is zero-byte, tracked and under `public/assets/marketing/`; any other unexpected filename fails closed. Keep the standard artifact guard unchanged. This exclusion is packaging hygiene, not removal of application assets. All6approved marketingJPEGs and3Discovery files match the retained live baseline, and the Hosting configuration is unchanged.

Reverify the exact prepared static package without rebuilding:

```sh
node scripts/prepare-hosting-release.mjs \
  --expected-sha=a661acd16969913ab85bb524aaf677acbbabe348 \
  --verify=test-results/ga4-final/hosting-a661acd1-filtered
shasum -a 256 test-results/ga4-final/hosting-a661acd1-filtered.tar.gz \
  test-results/ga4-final/functions-a661acd1.tar.gz
```

A founder can approve the narrowly defined callable and Hosting steps together; no need to deploy the disabled client twice. However these specific archives remainOFF: enabling collection requires a separately authorized, pinned flag-on source/artifact and saved Enhanced MeasurementOFF readback. Do not enable collection with the reviewed OFF artifact or reuse its hashes for a different build. No live purchase is needed or authorized for this readiness package.
