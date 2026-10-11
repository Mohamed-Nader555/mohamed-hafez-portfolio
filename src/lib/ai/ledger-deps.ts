import knowledge from '@/generated/knowledge.md?raw';
import ledgerJson from '@/generated/ledger.json';
import type { LedgerEntry } from '@/lib/rag/ledger';
import { assistantConfig, type AssistantEnv } from './assistant-runtime';
import { createGeminiProvider } from './gemini-provider';
import type { LedgerDeps } from './ledger-answer';

const claims = ledgerJson as LedgerEntry[];

/** Builds the writer and checker clients from the Worker's variables and secret. */
export function createLedgerDeps(
  env: AssistantEnv,
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>,
): LedgerDeps {
  const config = assistantConfig(env);
  const apiKey = env.GEMINI_API_KEY ?? '';
  return {
    writer: createGeminiProvider({
      apiKey,
      model: config.writerModel,
      fetcher,
    }),
    checker: createGeminiProvider({
      apiKey,
      model: config.checkerModel,
      fetcher,
    }),
    writerModel: config.writerModel,
    checkerModel: config.checkerModel,
    writerThinking: config.writerThinking,
    claims,
    knowledge,
  };
}
