# GA4 — consented acquisition measurement

November 23, 2026 · OpenAI / Codex · [Draft PR #128](https://github.com/alwat83/ifyoumind/pull/128) · **Implemented locally; not deployed.**

## Decision and verified audit

Use one direct Google tag, **G-NRT31062LW**, for the ifYouMind production stream **16394318092**, property **565380927**. Read-only authenticated Google Analytics administration confirmed the stream URL `https://ifyoumind.com`, the ID, zero connected site tags and **Enhanced Measurement ON**. The screen reported no data received in the preceding 48 hours; this is an observation, not a diagnosis of production traffic or revenue.

Google's installation screen offers **GTM-TMM5XMZF**. That container is absent from the repository's installed scripts and was not installed during this assignment. Do not install both that offered container and the direct tag. Historical Firebase configuration contained **G-DZMLBPS4ZX**, automatic screen/user tracking, and an unmounted consent UI. The candidate removes those Analytics providers and replaces the old arbitrary event/raw-URL service. This establishes code risk; it does not prove historical collection actually occurred.

**Activation gate:** `GA4_PRODUCTION_ENABLED = false` in `src/app/services/analytics-policy.ts`. It remains false in this draft. No production tracking, Google settings change, Stripe request, deployment, purchase, provider call or account modification was performed.

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

1. Founder authorizes the focused GA4 release and stream change. In **Admin → Data collection and modification → Data streams → ifYouMind web stream**, switch **Enhanced Measurement OFF**, including history page changes, forms, scrolls, downloads, search and outbound clicks. Read back saved state. Leave the offered GTM container uninstalled. Verify Google Signals, user-provided data collection, unwanted external tag destinations and advertising features are off. Review property data retention (recommend two months); those settings were not comprehensively verified here.
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

**Recommendation:** GO for draft code/founder review after applicable local checks. **NO-GO for production collection** until saved Enhanced Measurement is OFF, exact-source activation/deployment is separately authorized, and real collector/Realtime readback succeeds. Current implementation is not deployed or GA4-production-verified. No acquisition, willingness to pay or revenue result is claimed.
