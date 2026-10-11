# Grounded AI operations

The assistant answers from the **claims ledger**: one typed list of everything it may say about Mohamed. `npm run knowledge:build` writes it as two git-ignored files in `src/generated/` (`ledger.json` and `knowledge.md`, plus the MiniSearch artifact used for keyword hints and the fallback). The ledger has three origins: the site (evidence records, case-study pages, data records), Mohamed's notes (bridges and skill tiers) and his own answers. Each claim has a public citation. The generated files must never contain raw PDFs, local paths, prompts, chat text or private source names.

Mohamed's notes and answers reach the ledger only through `npm run claims:apply`, which writes the committed files in `src/data/claims/`. The YAML files it reads live outside the repository.

## Two pipelines, one switch

`ASSISTANT_MODE` (a plain variable in `wrangler.jsonc`) chooses the pipeline:

| Mode      | What runs                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ledger`  | The writer and checker pipeline below (Google Gemini).                                                                      |
| `classic` | The earlier pipeline, untouched: keyword retrieval, one Cloudflare Workers AI call (`@cf/meta/llama-3.1-8b-instruct-fast`). |

To roll back, set `ASSISTANT_MODE` to `classic` and redeploy. With `ledger` set and no `GEMINI_API_KEY`, the Worker logs one configuration message and runs `classic`. `/api/chat/health` reports `mode` and `geminiKey` (true or false, never the key) and the stage `version`.

## The ledger pipeline

1. **Guard.** The hard guard in `src/lib/rag/guard.ts` refuses salary, personal life, health, references, prompt injection and secrets before any model is called. Those questions are not counted against the cap.
2. **Router hints.** Code matches the question against bridge phrases, the other ways each of his answers is asked, and the trigger words of each gap answer, and adds the ids keyword search ranked highest. They go to the writer as hints.
3. **Writer.** One call to `gemini-3.8-flash` with medium thinking. The prompt is: the rules, then the whole `knowledge.md` (about 237,000 characters), then up to six turns of history, then the question and hint ids. The stable part comes first so Google's automatic caching can apply. The writer returns `answerStatus` (`answered`, `not_covered`, `refused`), one to six segments (text plus claim ids) and `notShown`. Timeout 20 s (raised from 12 s on 11 Oct 2026 after live timeouts); the checker has 5 s and the browser waits 30 s. All three limits live in `src/lib/ai/timeouts.ts`.
4. **Checks in code** (`src/lib/ai/answer-checks.ts`), free and on every answer: claim ids exist; numbers appear in the cited claims; named projects, technologies and employers appear in the cited claims; a quote of his answer is word for word; at most one own-reading segment, with no numbers or names; every `notShown` term was written by the visitor; a segment naming a named gap cites the gap answer; no forbidden wording and no verdict wording. A segment that fails is dropped.
5. **Checker.** One call to `gemini-3.5-flash-lite` with the lowest thinking, on the surviving segments that are not verbatim quotes. It marks each segment supported, overstated or unsupported; flagged segments are dropped. If the checker fails or times out (5 s), the own-reading segment is dropped and the rest is served, marked `unchecked` in the trace.
6. **Assembly.** Code sets each segment's label from the claims it cites ("From the site", "From Mohamed's notes", "Mohamed's answer", "Assistant's reading"), writes the "the site doesn't show …" sentence from `notShown`, and adds actions (case study, résumé for the active role, email link). The model never writes labels.

**Two model calls per question, and no more.** The writer is never called twice. If the writer fails, nothing usable survives the checks, or the checker flags everything, the existing verified-facts fallback is served. There is no automatic failover to another model.

## Cost cap

Model-backed questions are counted per UTC day in the `CHAT_BUDGET` KV namespace (one key, `model-questions:YYYY-MM-DD`). Above `DAILY_MODEL_QUESTION_CAP` (default `20`, Mohamed's spending limit of 11 Oct 2026) the rest of the day is answered by the classic pipeline. KV is eventually consistent, so the count is approximate; that is acceptable for a cost guard. A missing or failing KV never blocks a question. The writer sends roughly 52,000 tokens per question; see `src/data/assistant-eval.json` for the measured numbers.

Every question logs one JSON line with token counts (input, cached, output, thinking), latency and the model ids. It never contains question or answer text.

## Variables and secrets

| Name                       | Kind     | Purpose                                                   |
| -------------------------- | -------- | --------------------------------------------------------- |
| `ASSISTANT_MODE`           | variable | `ledger` or `classic`                                     |
| `GEMINI_WRITER_MODEL`      | variable | writer model id (default `gemini-3.8-flash`)              |
| `GEMINI_CHECKER_MODEL`     | variable | checker model id (default `gemini-3.5-flash-lite`)        |
| `DAILY_MODEL_QUESTION_CAP` | variable | model-backed questions per UTC day (default `20`)         |
| `CHAT_BUDGET`              | KV       | the daily counter                                         |
| `GEMINI_API_KEY`           | secret   | `npx wrangler secret put GEMINI_API_KEY`; never committed |
| `TURNSTILE_SECRET_KEY`     | secret   | Turnstile verification                                    |
| `RATE_LIMIT_HASH_SECRET`   | secret   | hashes the session id for rate limiting                   |

Model ids live in configuration, never in code. Locally, the key goes in the git-ignored `.dev.vars`; `.dev.vars.example` holds a placeholder only. The key travels in the `x-goog-api-key` header and is never logged, committed or sent to a browser.

## Evaluating answers

`npm run answers:evaluate -- --only <case ids>` asks the named cases in `tests/fixtures/answer-evaluation.json` through the real models and scores them (it reads `GEMINI_API_KEY` from `.dev.vars` and is not part of `npm test`). Since 11 Oct 2026 it is a spending-limited tool: it exits at once unless the environment has `ALLOW_PAID_MODEL_CALLS=yes`, it takes case ids only, and it refuses more than 10 cases (`scripts/paid-guard.ts`). A full run cost about $3, so none is run now. Raw outputs go to `Claude outputs/eval/` (git-ignored). `src/data/assistant-eval.json` holds the numbers of the last full run (run 7, 11 Oct 2026). Required before a merge: every case passes in the refusal, personal-attribute, injection, named-gap and not-on-the-site groups, and at least 90% in each other group. Cases that need a pasted job description are marked for stage D and skipped until then. `npm run knowledge:evaluate` still scores keyword retrieval, which the hints and the fallback rely on.

## Fallback and failure

If the writer has a quota, capacity, timeout or format failure, or no segment passes the checks, chat returns a labeled extractive summary of the retrieved verified facts. In `classic` mode the same happens when Workers AI fails. Static pages remain usable if every dynamic binding fails.

## Changing a model or provider

1. Change `GEMINI_WRITER_MODEL` or `GEMINI_CHECKER_MODEL` in `wrangler.jsonc` only after reading Google's current model, thinking and pricing pages, and note the thinking levels the model allows.
2. Ask the owner how many paid questions the change may use, run `npm run answers:evaluate -- --only <case ids>` for those cases, and read every output before merging.
3. A paid plan or provider change needs the owner's approval. There is no automatic upgrade and no automatic failover.

## Cloudflare setup

Create a managed Turnstile widget for the production hostnames and save only its public sitekey as `PUBLIC_TURNSTILE_SITEKEY`. Set the secrets above with `wrangler secret put`; never commit them. `.dev.vars.example` contains Cloudflare's official dummy test pair for local development only. The rate-limit namespace ids and the `CHAT_BUDGET` KV id are in `wrangler.jsonc`.

Run `npm run deploy:dry` before any deployment and check the bundle size against the Worker limit.
