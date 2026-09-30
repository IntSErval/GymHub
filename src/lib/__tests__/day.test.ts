import { describe, expect, it } from '@jest/globals';

import { dayRangeMs } from '../day';

describe('dayRangeMs', () => {
  it('spans local midnight to next local midnight', () => {
    const [from, to] = dayRangeMs(new Date(2026, 5, 15, 13, 45, 10));
    expect(from).toBe(new Date(2026, 5, 15).getTime());
    expect(to).toBe(new Date(2026, 5, 16).getTime());
  });

  it('rolls over month and year ends', () => {
    const [from, to] = dayRangeMs(new Date(2026, 11, 31, 23, 59));
    expect(from).toBe(new Date(2026, 11, 31).getTime());
    expect(to).toBe(new Date(2027, 0, 1).getTime());
  });

  it('includes midnight start and excludes next midnight', () => {
    const [from, to] = dayRangeMs(new Date(2026, 0, 2));
    expect(from).toBe(new Date(2026, 0, 2, 0, 0, 0, 0).getTime());
    expect(to - from).toBeGreaterThanOrEqual(23 * 3600_000);
    expect(to - from).toBeLessThanOrEqual(25 * 3600_000);
  });
});
