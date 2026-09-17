export type HeatLevel = 0 | 1 | 2 | 3 | 4;
export type HeatCell = { date: string; count: number; level: HeatLevel; future: boolean };

const pad = (n: number) => String(n).padStart(2, '0');

/** Local-time YYYY-MM-DD (not UTC). */
export function localDayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function heatLevel(count: number): HeatLevel {
  if (count <= 0) return 0;
  if (count <= 5) return 1;
  if (count <= 12) return 2;
  if (count <= 20) return 3;
  return 4;
}

/** Local midnight of the first cell: the Sunday `weeks - 1` weeks before this week's Sunday. */
function startDate(today: Date, weeks: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - (weeks - 1) * 7);
}

export function heatmapStartMs(today: Date, weeks = 17): number {
  return startDate(today, weeks).getTime();
}

/** Columns of weeks (Sun..Sat); the last column contains today. */
export function buildHeatmap(timestamps: number[], today: Date, weeks = 17): HeatCell[][] {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = localDayKey(ts);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayKey = localDayKey(today.getTime());
  const day = startDate(today, weeks);
  let pastToday = false;
  const columns: HeatCell[][] = [];

  for (let w = 0; w < weeks; w++) {
    const column: HeatCell[] = [];
    for (let i = 0; i < 7; i++) {
      const date = localDayKey(day.getTime());
      const count = pastToday ? 0 : (counts.get(date) ?? 0);
      column.push({ date, count, level: heatLevel(count), future: pastToday });
      if (date === todayKey) pastToday = true;
      day.setDate(day.getDate() + 1); // setDate, not +86400000: DST-safe
    }
    columns.push(column);
  }
  return columns;
}

export function daysTrained(cells: HeatCell[][]): number {
  return cells.flat().filter((c) => c.count > 0).length;
}
