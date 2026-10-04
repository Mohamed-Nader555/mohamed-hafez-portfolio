import type { RoleId } from '@/types/content';

/**
 * Starter questions shown in the chat panel, three per focus. Each one must be
 * answerable from the published record: `tests/unit/assistant-suggestions`
 * runs every question through retrieval.
 */
export const starterSuggestions: Record<RoleId, string[]> = {
  aiml: [
    'What is ASC-PIE?',
    'How was Northstar built?',
    'How does SPRINT-PP avoid storing raw PII?',
  ],
  software: [
    'What backend and enterprise work has Mohamed done?',
    'How is the assistant on this site built?',
    'Which projects use Firebase?',
  ],
  android: [
    'Which Android apps has Mohamed shipped?',
    'How does Mind’s Eye talk to its wearable?',
    'What did he build in Dostava?',
  ],
  teaching: [
    'What has Mohamed taught?',
    'What did he do as a teaching assistant at York University?',
    'What teaching materials has he created?',
  ],
};
