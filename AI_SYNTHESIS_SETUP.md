# OpenAI explanation setup

The existing Market and Universal synthesis source files are historical prototypes. Their callables are outside the deployed index and production allowlist. The existing paid Decision Report uses deterministic Census evidence and report rules.

The internal synthetic market explanation uses a separate callable, with a disabled-by-default runtime flag and a fixed synthetic input. The production deployment allowlist excludes it. Production and demo project IDs also fail closed at runtime. Firebase project `ifyoumind-473fe` returned no `OPENAI_API_KEY` secret or function binding in the November 13 audit.

Start with the [activation review and founder checklist](docs/product/OPENAI_ACTIVATION_READINESS.md). The demonstration uses a mocked Responses transport and the Firebase emulator. A live synthetic request requires separate founder approval, a funded non-production OpenAI project with model access, and the scoped Secret Manager binding in an authorized staging Firebase project.
