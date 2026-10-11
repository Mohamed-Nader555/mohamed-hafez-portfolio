// The assistant's time limits in one place. The browser's request timer must
// outlast a slow writer plus the checker, or it gives up on an answer that is
// still on its way; tests/unit/timeouts.test.ts keeps that true.

/** The writer model's limit. Raised from 12 s on 11 Oct 2026 after live timeouts. */
export const WRITER_TIMEOUT_MS = 20_000;
export const CHECKER_TIMEOUT_MS = 5_000;
/** The browser stops waiting this long after the human check has passed. */
export const CHAT_REQUEST_TIMEOUT_MS = 30_000;
