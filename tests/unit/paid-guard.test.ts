import { describe, expect, it } from 'vitest';
import {
  MAX_PAID_CASES,
  checkPaidRun,
  checkPaidSwitch,
  parseCaseIds,
} from '../../scripts/paid-guard';

const known = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
const allowed = { ALLOW_PAID_MODEL_CALLS: 'yes' };

describe('checkPaidSwitch', () => {
  it('refuses unless the switch is exactly "yes"', () => {
    for (const env of [
      {},
      { ALLOW_PAID_MODEL_CALLS: '' },
      { ALLOW_PAID_MODEL_CALLS: 'true' },
      { ALLOW_PAID_MODEL_CALLS: '1' },
      { ALLOW_PAID_MODEL_CALLS: 'YES' },
    ]) {
      const result = checkPaidSwitch(env);
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.message).toContain('ALLOW_PAID_MODEL_CALLS');
    }
  });

  it('allows the run when the switch is "yes"', () => {
    expect(checkPaidSwitch(allowed)).toEqual({ ok: true });
  });
});

describe('parseCaseIds', () => {
  it('reads --only lists and bare ids, ignoring --stage and its value', () => {
    expect(parseCaseIds(['--only', 'a,b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(parseCaseIds(['--stage', 'D', 'a'])).toEqual(['a']);
    expect(parseCaseIds([])).toEqual([]);
  });

  it('drops empty entries and repeats', () => {
    expect(parseCaseIds(['a,,b,a', ' b '])).toEqual(['a', 'b']);
  });
});

describe('checkPaidRun', () => {
  it('exits before anything else when the switch is missing', () => {
    const result = checkPaidRun({
      env: {},
      requestedIds: ['zzz'],
      knownIds: known,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('ALLOW_PAID_MODEL_CALLS');
  });

  it('refuses a run with no case ids (no full runs)', () => {
    const result = checkPaidRun({
      env: allowed,
      requestedIds: [],
      knownIds: known,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/case ids/i);
  });

  it('refuses ids that are not in the evaluation set and names them', () => {
    const result = checkPaidRun({
      env: allowed,
      requestedIds: ['a', 'nope'],
      knownIds: known,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('nope');
  });

  it('refuses more than the maximum number of cases', () => {
    expect(MAX_PAID_CASES).toBe(10);
    const result = checkPaidRun({
      env: allowed,
      requestedIds: known.slice(0, 11),
      knownIds: known,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('10');
  });

  it('accepts up to the maximum and returns the ids to run', () => {
    const result = checkPaidRun({
      env: allowed,
      requestedIds: known.slice(0, 10),
      knownIds: known,
    });
    expect(result).toEqual({ ok: true, ids: known.slice(0, 10) });
  });
});
