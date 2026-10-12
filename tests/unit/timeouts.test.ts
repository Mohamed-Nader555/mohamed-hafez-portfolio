import { describe, expect, it } from 'vitest';
import { CHECKER_TIMEOUT_MS } from '@/lib/ai/checker';
import {
  CHAT_REQUEST_TIMEOUT_MS,
  FIT_WRITER_TIMEOUT_MS,
  CHECKER_TIMEOUT_MS as CHECKER_LIMIT,
  WRITER_TIMEOUT_MS as WRITER_LIMIT,
} from '@/lib/ai/timeouts';
import { WRITER_TIMEOUT_MS } from '@/lib/ai/writer';

describe('time limits', () => {
  it('gives the writer 20 seconds and the checker 5', () => {
    expect(WRITER_LIMIT).toBe(20_000);
    expect(CHECKER_LIMIT).toBe(5_000);
  });

  it('is the same limit the writer and checker modules use', () => {
    expect(WRITER_TIMEOUT_MS).toBe(WRITER_LIMIT);
    expect(CHECKER_TIMEOUT_MS).toBe(CHECKER_LIMIT);
  });

  it('gives the job-description writer, which thinks longer, 25 seconds', () => {
    expect(FIT_WRITER_TIMEOUT_MS).toBe(25_000);
    expect(FIT_WRITER_TIMEOUT_MS).toBeGreaterThan(WRITER_LIMIT);
  });

  it('keeps the browser waiting longer than the slowest writer plus the checker', () => {
    expect(CHAT_REQUEST_TIMEOUT_MS).toBe(35_000);
    expect(CHAT_REQUEST_TIMEOUT_MS).toBeGreaterThan(
      Math.max(WRITER_LIMIT, FIT_WRITER_TIMEOUT_MS) + CHECKER_LIMIT,
    );
  });
});
