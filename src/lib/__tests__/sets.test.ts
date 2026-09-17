import { describe, expect, it } from '@jest/globals';
import { parseSet } from '../sets';

describe('parseSet', () => {
  it('parses a full set', () => {
    expect(parseSet('60', '8', '7.5')).toEqual({ ok: true, value: { kg: 60, reps: 8, rpe: 7.5 } });
  });

  it('treats empty rpe as null', () => {
    expect(parseSet('60', '8', '')).toEqual({ ok: true, value: { kg: 60, reps: 8, rpe: null } });
  });

  it('accepts comma decimals and bodyweight 0kg', () => {
    expect(parseSet('62,5', '5', '')).toEqual({ ok: true, value: { kg: 62.5, reps: 5, rpe: null } });
    expect(parseSet('0', '12', '')).toEqual({ ok: true, value: { kg: 0, reps: 12, rpe: null } });
  });

  it('trims whitespace', () => {
    expect(parseSet(' 60 ', ' 8 ', ' ')).toEqual({ ok: true, value: { kg: 60, reps: 8, rpe: null } });
  });

  it('rejects bad kg', () => {
    expect(parseSet('', '8', '')).toEqual({ ok: false, error: 'Enter kg' });
    expect(parseSet('-5', '8', '').ok).toBe(false);
    expect(parseSet('1001', '8', '').ok).toBe(false);
    expect(parseSet('abc', '8', '').ok).toBe(false);
  });

  it('rejects bad reps', () => {
    expect(parseSet('60', '8.5', '').ok).toBe(false);
    expect(parseSet('60', '0', '').ok).toBe(false);
    expect(parseSet('60', '', '').ok).toBe(false);
  });

  it('rejects bad rpe', () => {
    for (const rpe of ['11', '0', '7.3', 'x']) {
      expect(parseSet('60', '8', rpe)).toEqual({ ok: false, error: 'RPE must be 1–10' });
    }
  });
});
