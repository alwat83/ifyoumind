# Question-to-answer intelligence, Phase 1

November 16, 2026 Pacific · OpenAI / Codex · Draft from Electric Minimal merge `921d55b65800722e001c1df35993241b0d88deac`.

The old `/app/decide` path always moved non-bill questions to the place form. The app now reads common U.S. city, comparison and annual salary phrases in the browser. It uses the existing workspace-authorized free-brief callable to verify recognized city/state pairs and retrieve Census evidence. When both cities are recognized, the question goes straight to the saved brief. When one is missing, the existing place form asks for it and keeps the recognized city. Questions about a local tax rate or electricity price show the existing evidence limits. Changes to a personal bill still route to private Discovery.

For the requested Los Angeles–Birmingham question the brief leads with ACS median home values. The original question and supplied salary remain visible. Population, household income and home values describe places. A personal cost comparison or salary equivalent would require comparable housing costs, applicable taxes, transportation, and other recurring expenses. The brief keeps the underlying figures, source links and survey limitations. Housing questions lead with median home value and identify current listings, financing and other ownership costs as the next evidence to check. [Census home-value table](https://api.census.gov/data/2024/acs/acs5/groups/B25077.html) · [Census household-income table](https://api.census.gov/data/2024/acs/acs5/groups/B19013.html)

The parser recognizes explicit U.S. city/state phrases, a narrow set of conventional city aliases, and bounded USD amounts in salary context. Ambiguous bare names stay unresolved. Ranges, approximate amounts and explicitly nonannual periods stay in the original question without a normalized amount. Census verifies every pair. The saved brief retains the original question and locations via the same data contract, and presentation reconstructs the salary from that question. The OpenAI review branch accepts a fixed staging-only synthetic packet. Ordinary questions use the local rules and send no data to a model provider. [OpenAI staging draft](https://github.com/alwat83/ifyoumind/pull/96)

The browser history entry retains the submitted question and fields for the same signed-in UID. Reload never submits automatically. While work is in progress the form prevents repeated submission. Back followed by the same successful submission reopens its saved brief. An interrupted request before a result ID reaches the browser follows the existing retry behavior. The browser does not know whether that request reached the server, so check Your decisions before resubmitting after an interrupted connection.

## Before and after

| State | Desktop | Mobile |
| --- | --- | --- |
| Old place form after entering the question and repeating both cities | [1280 px](question-to-answer-phase-1/before-desktop.jpg) | [390 px](question-to-answer-phase-1/before-mobile.jpg) |
| New first answer after one submit | [1280 px](question-to-answer-phase-1/after-desktop.jpg) | [390 px](question-to-answer-phase-1/after-mobile.jpg) |

After question entry, the old route used five actions to get a comparison. The user continued, entered the first city, added a comparison, entered the second city, and submitted. The new route uses one submit. Including question entry, the journey goes from six actions to two. The screenshots use synthetic Census values seeded in the demo emulator and illustrate the journey.

## Verification

The 26 decision browser cases exercise the real local callable and auth guard, direct and manual paths, partial input, saved-answer reload, Back and repeat submission, quota feedback, an upstream outage, a rejected city, and tax/electricity routing. The specified salary case checks keyboard, first-answer focus, source links, axe and layouts at 320, 390, 768 and 1280 px. The browser test confirms one create request and zero Checkout, report generation or OpenAI requests. Browser coverage here is Chromium with emulated viewports. Both local builds, 140 fast web tests, the production bundle guard and the Discovery isolation check passed.

The draft uses the existing Electric Minimal components, data contract and authorization. The branch can be reverted independently of Electric Minimal. The draft PR records the complete CI results and founder review status. Customer conversion has yet to be measured.
