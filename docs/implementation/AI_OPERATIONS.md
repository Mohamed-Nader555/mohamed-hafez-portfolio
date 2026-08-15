# Grounded AI operations

The assistant uses a build-time MiniSearch artifact made only from `src/data` records that have public source links. Regenerate it with `npm run knowledge:build`; the generated JSON is deliberately ignored and must never contain raw PDFs, local paths, prompts, answers, or private source names.

## Normal operation

- Default provider and model: Cloudflare Workers AI, `@cf/meta/llama-3.1-8b-instruct-fast`.
- Before a production deployment, confirm that model availability and free-tier eligibility in the Cloudflare Workers AI model catalog. Change `AI_MODEL` in Cloudflare configuration only after running the retrieval/API fallback tests.
- Watch Workers AI invocation/errors and free neuron usage in the Cloudflare dashboard. Rate-limit outcomes appear as normal 429 Worker responses; do not add visitor-level logs.
- Every accepted question is Turnstile-validated, rate limited by a server-hashed browser-session UUID, retrieved against curated evidence, and sent to the provider once at most.

## Fallback and failure

If Workers AI has quota, capacity, timeout, malformed JSON, unknown citations, or any provider failure, chat returns a labeled extractive summary of the retrieved verified facts. Unsupported questions return a strict refusal without provider use. Static pages remain usable if all dynamic bindings fail.

## Provider switch procedure

1. Keep the `AiProvider` adapter contract; never expose an API credential to the client.
2. Verify the candidate’s privacy, quota, and billing terms before enabling it.
3. Run `npm run knowledge:evaluate`, focused answer/API tests, and the fallback test with provider failures.
4. Require manual owner approval before any paid provider or plan change. There is no automatic upgrade or automatic failover.

## Cloudflare setup

Create a managed Turnstile widget restricted to the production hostname and save only its public sitekey as `PUBLIC_TURNSTILE_SITEKEY`. Set `TURNSTILE_SECRET_KEY` and `RATE_LIMIT_HASH_SECRET` using `wrangler secret put`; never commit them. `.dev.vars.example` contains Cloudflare’s official dummy test pair for local development only. Configure unique positive integer rate-limit namespace IDs for the Cloudflare account before deployment if the placeholders conflict.

Run `npm run deploy:dry` before connecting a Cloudflare account. Do not deploy until a real Turnstile secret, Workers AI binding, and final hostname are configured.
