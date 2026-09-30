/** [local midnight of `date`, local midnight of the next day). Uses d + 1, not +24h, so DST days are right. */
export function dayRangeMs(date: Date): [number, number] {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return [new Date(y, m, d).getTime(), new Date(y, m, d + 1).getTime()];
}
