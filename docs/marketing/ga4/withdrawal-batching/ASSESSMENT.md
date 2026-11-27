# GA4 delayed delivery after consent withdrawal: privacy assessment (November 26, 2026)

**Scope:** existing production behaviour of Hosting `d47dcec2093b625f`, source `b9151c64`. This is **separate from the PR #132 CSS change**, which doesn't touch analytics and behaves identically.
**Provider/agent:** Anthropic / Claude Code, local session. Offline diagnosis only: the real public Google tag was replayed locally, and every collector request was recorded and answered locally, so no data reached Google. Nothing was changed.

## Finding
Google's tag holds events in memory for about **5 seconds** before sending them as a batch. When a visitor withdraws consent:
- The app sets Google's official `ga-disable-G-NRT31062LW` flag and deletes the analytics cookies, as designed.
- **Events the tag already holds are still sent.** They go out when the batch timer fires (about 4s after withdrawal, with the page still open) or immediately if the page unloads or is hidden.
- Every late event was **recorded while consent was granted**. It carries consent state `gcs=G101` (granted) and the visitor's pre-withdrawal pseudonymous client ID, and it holds only sanitized fields: allowlisted event names, the canonical URL and fixed titles.
- **No event recorded after withdrawal was ever sent.** The page stayed open 20s with further interaction, then was navigated and reloaded.

The common trigger is ordinary. A visitor opens the Privacy page and withdraws within about 5 seconds. That page's own `page_view`, recorded on arrival while consent was granted, is then delivered after the withdrawal (E6 below).

## Evidence
Experiments E1–E6, run on **both** production `d47dcec2` and PR #132 `4aab384e`. The results are identical.

| Experiment | Result |
|---|---|
| E1: consented, Reveal | `free_tax_example_viewed` sent ~5.06s after the click (batch interval) |
| E2: Reveal, withdraw 0.9s later, stay 20s | 2 pre-withdrawal events sent ~4.1s after withdrawal; 0 afterwards |
| E3: same, then navigate away | 2 pre-withdrawal events sent at unload (~0.3s after withdrawal) |
| E4: same, then tab hidden | 2 pre-withdrawal events sent on hide |
| E5: also send `consent update analytics_storage=denied` | **Not a discard.** The tag flushed the queue immediately, and one hit went out as `gcs=G100` (denied) still carrying the client ID |
| E6: no other activity, withdraw from the Privacy page | That page's own `page_view` (recorded under consent) sent after withdrawal |

- Raw sanitized results: [`results-production-d47dcec2.json`](results-production-d47dcec2.json) and [`results-pr132-4aab384e.json`](results-pr132-4aab384e.json). They hold only event names, canonical URLs, consent state and whether a client ID was present; no IDs are stored.
- Reproduce with [`withdraw-probe.cjs`](withdraw-probe.cjs): `node withdraw-probe.cjs <dist dir> <captured gtag.js> <out.json>`.

## Is this consistent with what we tell visitors?
- **Preferences dialog:** "Withdrawing consent stops future collection and clears analytics cookies; it cannot undo information already sent."
- **Privacy Policy:** "Withdrawal stops future collection and removes analytics cookies; it does not remove information already collected by Google."

| Promise | Holds? |
|---|---|
| "Stops future collection" | **Yes.** Nothing recorded after withdrawal is sent |
| "Clears/removes analytics cookies" | **Yes** |
| "Cannot undo information already sent" | **Not quite.** The natural reading is that information *not yet sent* will not be sent. Up to about 5 seconds of already-recorded activity is still delivered after withdrawal. The policy's "already collected by Google" has the same ambiguity |

**Assessment:** low severity, but a real gap between wording and behaviour.
- The window is about 5 seconds, and the data was recorded under valid consent.
- Under GDPR Art. 7(3), withdrawal doesn't make earlier processing unlawful. A conservative reading still treats transmitting it *after* withdrawal as processing after withdrawal.
- This is not legal advice; the founder or counsel should decide.

## Can queued events be safely discarded?
No supported mechanism was found.
- **`ga-disable` flag:** doesn't clear the pending batch (E2–E4).
- **`gtag('consent','update',{analytics_storage:'denied'})`:** flushes the batch instead of discarding it, and can emit a denied-state hit with the client ID (E5). **Rejected as worse.**
- **Removing the tag script, or reloading:** doesn't clear in-memory timers, and unloading triggers a flush (E3).
- **Intercepting `navigator.sendBeacon`/`fetch`:** this would patch the vendor's transport at runtime. It's fragile across tag updates, and the GA4 work explicitly avoided vendor patches. Not recommended.

## Does it need a separate corrective PR?
**Yes, a small wording-only PR, kept separate from #132.** Proposed text, for founder (ideally counsel) approval, because it changes consent wording:
- **Dialog:** "Withdrawing consent stops new analytics collection and clears analytics cookies. Activity from the few seconds before you withdraw may still be sent, and information already sent can't be undone."
- **Policy:** "Withdrawal stops new collection and removes analytics cookies. Activity recorded in the few seconds before withdrawal may still be delivered, and withdrawal does not remove information already collected by Google."

No test asserts the current wording, so the change touches only the two templates and needs no assertion changes. Consent and transport assertions stay as they are.

An engineering change to discard the queue is **not recommended** unless Google provides a supported API.

## Release impact
- **Not a blocker for the #132 Hosting-only CSS release.** The behaviour is already in production and identical with and without #132.
- It should be resolved, by wording or founder acceptance, before the analytics milestone is marked fully closed or GA4 is used for paid campaigns.
- The **GA4 Realtime receipt** for release `1795723013497000` is still **pending founder confirmation**.
