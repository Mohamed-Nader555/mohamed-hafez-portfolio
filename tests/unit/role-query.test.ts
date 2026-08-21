import { describe, expect, it } from 'vitest';

import { roleFromSearchParams, roleHref } from '@/lib/content/role-query';

describe('role query navigation', () => {
  it('uses the AI/ML view when the query is absent or unsupported', () => {
    expect(roleFromSearchParams(new URLSearchParams())).toBe('aiml');
    expect(roleFromSearchParams(new URLSearchParams('role=unknown'))).toBe(
      'aiml',
    );
  });

  it('resolves supported professional views from the query', () => {
    expect(roleFromSearchParams(new URLSearchParams('role=software'))).toBe(
      'software',
    );
    expect(roleFromSearchParams(new URLSearchParams('role=android'))).toBe(
      'android',
    );
    expect(roleFromSearchParams(new URLSearchParams('role=teaching'))).toBe(
      'teaching',
    );
  });

  it('creates canonical same-page role URLs', () => {
    expect(roleHref('aiml')).toBe('/?role=aiml');
    expect(roleHref('android')).toBe('/?role=android');
  });
});
