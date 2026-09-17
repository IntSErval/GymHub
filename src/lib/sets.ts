export type SetInput = { kg: number; reps: number; rpe: number | null };
export type ParseResult = { ok: true; value: SetInput } | { ok: false; error: string };

const toNumber = (text: string) => Number(text.trim().replace(',', '.'));

export function parseSet(kgText: string, repsText: string, rpeText: string): ParseResult {
  if (kgText.trim() === '') return { ok: false, error: 'Enter kg' };
  const kg = toNumber(kgText);
  if (!Number.isFinite(kg) || kg < 0 || kg > 1000) return { ok: false, error: 'kg must be 0–1000' };

  const reps = repsText.trim() === '' ? NaN : toNumber(repsText);
  if (!Number.isInteger(reps) || reps < 1 || reps > 1000) {
    return { ok: false, error: 'Reps must be a whole number 1–1000' };
  }

  let rpe: number | null = null;
  if (rpeText.trim() !== '') {
    rpe = toNumber(rpeText);
    if (!Number.isInteger(rpe * 2) || rpe < 1 || rpe > 10) return { ok: false, error: 'RPE must be 1–10' };
  }

  return { ok: true, value: { kg, reps, rpe } };
}
