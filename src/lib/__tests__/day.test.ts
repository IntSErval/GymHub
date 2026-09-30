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
});
