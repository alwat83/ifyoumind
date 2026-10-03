# AI synthesis setup

ifYouMind keeps statistics and evidence generation separate from generative synthesis.

## Runtime

The synthesis function uses the OpenAI Responses API and receives only a compact saved analysis packet. It does not receive Firebase credentials, provider tokens, raw workspace secrets, or unrestricted database access.

## Required Firebase secret

- `OPENAI_API_KEY`

## Optional parameter

- `AI_SYNTHESIS_MODEL` defaults to `gpt-6-luna`.

The model can be changed without changing the evidence/reasoning contract.

## Guardrails implemented in code

Before model invocation:
- analysis must already exist;
- dataset alignment/statistics are deterministic;
- evidence signals have stable IDs;
- the model receives only saved evidence.

After model invocation:
- JSON shape is validated;
- evidence signal IDs must exist in the supplied packet;
- output lengths are bounded;
- numeric claims are rejected unless the number was present in the evidence packet;
- synthesis is stored alongside the immutable analysis run;
- causal claims are forbidden by the prompt contract and deterministic reasoning policy.

The generative layer explains evidence. It does not calculate or overwrite the statistical evidence.
