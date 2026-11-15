# Decision Report sample handoff release

November 15, 2026 · OpenAI / Codex. [PR #102](https://github.com/alwat83/ifyoumind/pull/102) routes a signed-in reader of the public sample to the Business Decision Brief. The $79 link carries report intent through the existing decision entry and email verification.

| Release gate | Evidence |
| --- | --- |
| Founder-authorized source | `699d0472465c240716b23625736185241716bc04`, mergeable and clean against master `b22cb7582bbeb615b17b7fee34b7f6a3ec216560`. [Launch build](https://github.com/alwat83/ifyoumind/actions/runs/43773285606) and [authenticated QA](https://github.com/alwat83/ifyoumind/actions/runs/43773285602) passed for that exact head. |
| Live before merge | An authenticated Firebase Hosting channel read and its release list both showed finalized version `51e354bfe0e900e2`, release `1794690322738000`. No newer release had superseded it. |
| Requested rollback | Version `1beeaa395c606d55` remained finalized with 57 files, retained release `1794687726345000`, and active sampled files. The permission check returned `firebasehosting.sites.get` and `firebasehosting.sites.update`. [Firebase rollback procedure](https://firebase.google.com/docs/hosting/manage-hosting-resources#roll_back_to_a_previous_version_of_your_site). |
| Merge | [Merge commit `89f481712d7e66f2e63b0861eb004e439d3480e1`](https://github.com/alwat83/ifyoumind/commit/89f481712d7e66f2e63b0861eb004e439d3480e1) at November 15 23:43:58 UTC. The approved commit is its second parent, and both trees are `859355a04a98a2e37269942816d66b28ceafddad`. |

[Automatic production workflow `43776389795`](https://github.com/alwat83/ifyoumind/actions/runs/43776389795) succeeded for the merge commit. The Firebase live channel and release list both point to finalized version `de4cfa6b28163962`, release `1794786392489000`, at November 15 23:46:32.489 UTC. The immediate predecessor `51e354bfe0e900e2` and requested older rollback `1beeaa395c606d55` remained retained. Authentication, active rollback file listings, and Hosting update permission were confirmed again after deployment. No rollback was performed.

| Signed-in production smoke | Result |
| --- | --- |
| Public sample | The report and recommendation loaded. Both free links targeted `/app/decide?type=business`. Both $79 links targeted `/app/decide?type=business&intent=report`. |
| $79 report link | Opened `/app/decide?type=business&intent=report` and showed the prefilled Business question “Should I open this business here?” Registration and Checkout were not entered. |
| Start free | Opened `/app/decide?type=business` with the same prefilled Business question. No decision was submitted. |

The production workflow created new revisions of the existing commerce services. Read-only comparison of `STRIPE_` and `SUBSCRIPTION_` fields, including secret binding references, matched across the old and new Commercial Status, Checkout and Paid Decision Report revisions. The enrollment check stayed empty. The staging synthetic callable stayed on `explainsyntheticmarket-00004-lor` with its flag `false`. The merged change did not modify billing code or deployment settings. The production smoke verified navigation only. An independent paid purchase and report delivery are separate business evidence.
