import { toNumber } from './sets';

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseWater(text: string): Parsed<number> {
  if (text.trim() === '') return { ok: false, error: 'Enter ml' };
  const ml = toNumber(text);
  if (!Number.isInteger(ml) || ml < 1 || ml > 5000) {
    return { ok: false, error: 'ml must be a whole number 1–5000' };
  }
  return { ok: true, value: ml };
}

export function parseWeight(text: string): Parsed<number> {
  if (text.trim() === '') return { ok: false, error: 'Enter kg' };
  const kg = toNumber(text);
  if (!Number.isFinite(kg) || kg < 20 || kg > 500) return { ok: false, error: 'kg must be 20–500' };
  return { ok: true, value: kg };
}
