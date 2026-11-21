# Local consumer review

Running at **http://127.0.0.1:4392/**; [pricing](http://127.0.0.1:4392/pricing). Exact tested source `4fa109f5ba683e197efc781223225f0d1fca5407`. Synthetic data only. No real bills, payments, provider generation or public participant invitations. Stop the owned preview before running another verification suite: ports8080/9099/5001/4392 must not overlap.

The local bundle and demo backend are distinct from the production artifact. The existing global setup validates emulator configuration and seeds synthetic Census/sample data. Use supported seeded cities and fixtures only; do not attempt live external lookups or Checkout. The static preview is not proof of production security headers: the exact-source Hosting suite separately checks those. Four-width screenshots and five tasks are linked in [review](REVIEW.md).

## Reproduce after the exact-source run

Use an existing locked dependency/browser/emulator installation. The run below already contains both builds and Functions output; if rebuilding, follow the exact-source runner, not a production configuration override. No software installation or cloud action is required. Resolve the checkout path locally; do not copy authentication files, ADC, `.env` or credentials into the source snapshot.

Terminal1, starting at the repository root:

```sh
REVIEW_RUN="$PWD/test-results/local-first/2026-11-21T18-24-22-773Z-4fa109f5"
cd "$REVIEW_RUN/worktree"
env -i PATH="$PATH" HOME="$REVIEW_RUN/home" node e2e/support/static-server.mjs 4392
```

Terminal2, starting at the same repository root:

```sh
REVIEW_RUN="$PWD/test-results/local-first/2026-11-21T18-24-22-773Z-4fa109f5"
REVIEW_CACHE="$HOME/.cache/firebase/emulators"
cd "$REVIEW_RUN/worktree"
env -i PATH="$PATH" HOME="$REVIEW_RUN/home" CI=true NG_CLI_ANALYTICS=false FIREBASE_CLI_DISABLE_TELEMETRY=1 FIREBASE_EMULATORS_PATH="$REVIEW_CACHE" GCLOUD_PROJECT=demo-ifyoumind METADATA_SERVER_DETECTION=none FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node node_modules/firebase-tools/lib/bin/firebase.js emulators:exec --project demo-ifyoumind --only auth,firestore,functions 'node --input-type=module -e "await (await import(\"./e2e/support/global-setup.mjs\")).default(); console.log(\"SYNTHETIC REVIEW READY\"); setInterval(() => {}, 30000)"'
```

Wait for synthetic seed readiness. Open the loopback URL; do not expose it publicly or substitute the production project. Stop both owned commands with Ctrl-C; never kill unrelated Node/Java processes. The held session contains only synthetic state. When it ends, no participant findings or real bill data should have been retained. Existing physical Safari, spoken VoiceOver, Linux pixels and unassisted comprehension gaps remain unverified.
