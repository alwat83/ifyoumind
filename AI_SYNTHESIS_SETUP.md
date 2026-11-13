# OpenAI explanation setup

The existing Market and Universal synthesis source files are historical prototypes. Their callables are outside the deployed index and production allowlist. The existing paid Decision Report uses deterministic Census evidence and report rules.

The internal synthetic market explanation uses a separate callable, with a disabled-by-default runtime flag and a fixed synthetic input. The production deployment allowlist excludes it. Production and demo project IDs also fail closed at runtime. Firebase project `ifyoumind-473fe` returned no `OPENAI_API_KEY` secret or function binding in the November 13 audit.

Start with the [activation review and founder checklist](docs/product/OPENAI_ACTIVATION_READINESS.md). The demonstration uses a mocked Responses transport and the Firebase emulator.

## Founder setup for an authorized staging test

These steps are for a separately approved staging run. Use a dedicated staging Firebase project and a separate OpenAI API project. Confirm the project IDs before provisioning. `ifyoumind-473fe` is production and is blocked by this prototype.

1. In the [OpenAI API dashboard](https://platform.openai.com/settings/organization/billing/overview), verify funded API access and the staging project's `gpt-6-luna` availability. Review data sharing and set the approved project hard spend limit and alerts. Create a staging project service-account key with the minimum effective permissions to count Responses input tokens and create a response. Keep the key in the credential entry workflow. [OpenAI service accounts and scoped keys](https://developers.openai.com/api/docs/guides/api-keys) · [Spend controls](https://developers.openai.com/api/docs/guides/spend-limits)
2. In a trusted local terminal, replace `STAGING_PROJECT_ID` with the approved Firebase project ID. Enter the key only when prompted by the first command. Keep it out of command arguments, environment files, repository files, CI, chat, and screenshots. The second command reads metadata only. Confirm the new version is `ENABLED`. [Firebase secret setup](https://firebase.google.com/docs/functions/config-env#secret_manager)

   ```sh
   firebase functions:secrets:set OPENAI_API_KEY --project STAGING_PROJECT_ID
   firebase functions:secrets:get OPENAI_API_KEY --project STAGING_PROJECT_ID --non-interactive
   ```

3. Review the function identity before any deploy. Grant the staging runtime access to that one secret and the staging Firestore access needed for membership reads and quota transactions. The function already declares `secrets: [key]`. Verify the planned binding and runtime project ID. Keep the flag absent or `false` for the first staging deploy. If separately approved, target only `functions:explainSyntheticMarket` and verify that a verified internal admin with active workspace owner/admin membership receives the deterministic result. Use synthetic staging accounts and workspace data. [Firebase runtime identities](https://firebase.google.com/docs/functions/manage-functions#set_a_service_account)
4. With separate approval, set `ENABLE_SYNTHETIC_OPENAI_EXPLANATION=true` in the staging-only runtime configuration and redeploy the same function to staging. Submit one callable request containing only the staging `organizationId`. Verify provider acceptance, usage, delivered service tier, latency and billing using restricted usage evidence. Restore the flag to `false`, redeploy the staging function and confirm fallback. Revoke the staging key when the trial ends if it is no longer needed.

Production activation would require a separate reviewed release. The current prototype blocks the production project ID and is excluded from the production deployment allowlist.
