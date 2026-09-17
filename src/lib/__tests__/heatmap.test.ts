import { describe, expect, it } from '@jest/globals';
import { buildHeatmap, daysTrained, heatLevel, heatmapStartMs, localDayKey } from '../heatmap';

// Wed 2026-01-14, local noon
const today = new Date(2026, 0, 14, 12);

describe('heatLevel', () => {
  it('buckets counts', () => {
    expect([0, 1, 5, 6, 12, 13, 20, 21].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4]);
  });
});

describe('localDayKey', () => {
  it('uses local date, not UTC', () => {
    expect(localDayKey(new Date(2026, 0, 15, 23, 30).getTime())).toBe('2026-01-15');
    expect(localDayKey(new Date(2026, 0, 15, 0, 30).getTime())).toBe('2026-01-15');
  });
});

describe('buildHeatmap', () => {
  it('returns 17 week columns of 7 empty days', () => {
    const cells = buildHeatmap([], today);
    expect(cells).toHaveLength(17);
    cells.forEach((col) => expect(col).toHaveLength(7));
    expect(daysTrained(cells)).toBe(0);
  });

  it('starts on a Sunday and puts today in the last column; later days are future', () => {
    const cells = buildHeatmap([], today);
    expect(new Date(heatmapStartMs(today)).getDay()).toBe(0);
    expect(cells[0][0].date).toBe(localDayKey(heatmapStartMs(today)));
    const last = cells[16];
    expect(last[3]).toMatchObject({ date: '2026-01-14', future: false });
    expect(last.slice(0, 4).every((c) => !c.future)).toBe(true);
    expect(last.slice(4).every((c) => c.future)).toBe(true);
  });

  it('counts sets on the same local day', () => {
    const ts = [9, 10, 18].map((h) => new Date(2026, 0, 12, h).getTime());
    const cells = buildHeatmap(ts, today);
    expect(cells[16][1]).toMatchObject({ date: '2026-01-12', count: 3, level: 1 });
    expect(daysTrained(cells)).toBe(1);
  });

  it('ignores timestamps outside the window', () => {
    const ts = [new Date(2020, 0, 1).getTime(), new Date(2026, 0, 13).getTime(), new Date(2026, 0, 20).getTime()];
    expect(daysTrained(buildHeatmap(ts, today))).toBe(1);
  });

  it('counts two distinct days', () => {
    const ts = [new Date(2026, 0, 5, 8).getTime(), new Date(2026, 0, 7, 8).getTime()];
    expect(daysTrained(buildHeatmap(ts, today))).toBe(2);
  });
});
