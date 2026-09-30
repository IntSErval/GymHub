import { describe, expect, it } from '@jest/globals';
import { parseWater, parseWeight } from '../daily';

describe('parseWater', () => {
  it('parses whole ml and trims', () => {
    expect(parseWater('250')).toEqual({ ok: true, value: 250 });
    expect(parseWater(' 5000 ')).toEqual({ ok: true, value: 5000 });
    expect(parseWater('1')).toEqual({ ok: true, value: 1 });
  });

  it('rejects empty', () => {
    expect(parseWater('')).toEqual({ ok: false, error: 'Enter ml' });
    expect(parseWater('  ')).toEqual({ ok: false, error: 'Enter ml' });
  });

  it('rejects decimals, non-numbers, and out of range', () => {
    for (const t of ['250.5', '2,5', 'abc', '0', '-1', '5001', '1,000']) {
      expect(parseWater(t)).toEqual({ ok: false, error: 'ml must be a whole number 1–5000' });
    }
  });
});

describe('parseWeight', () => {
  it('parses decimals and comma decimals', () => {
    expect(parseWeight('72.5')).toEqual({ ok: true, value: 72.5 });
    expect(parseWeight('72,5')).toEqual({ ok: true, value: 72.5 });
    expect(parseWeight(' 80 ')).toEqual({ ok: true, value: 80 });
  });

  it('rejects empty', () => {
    expect(parseWeight('')).toEqual({ ok: false, error: 'Enter kg' });
  });

  it('rejects out of range and non-numbers', () => {
    for (const t of ['19.9', '501', '0', '-70', 'abc', '1,000']) {
      expect(parseWeight(t)).toEqual({ ok: false, error: 'kg must be 20–500' });
    }
  });
});
