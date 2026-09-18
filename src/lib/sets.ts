export type SetInput = { kg: number; reps: number; rpe: number | null };
export type ParseResult = { ok: true; value: SetInput } | { ok: false; error: string };

const toNumber = (text: string) => {
  const trimmed = text.trim();
  // A comma is a decimal separator ("62,5"). Grouped input like "1,000" is rejected, not read as 1.
  const normalized = /^\d+,\d{1,2}$/.test(trimmed) ? trimmed.replace(',', '.') : trimmed;
  return normalized.includes(',') ? NaN : Number(normalized);
};

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
    if (!Number.isInteger(rpe * 2) || rpe < 1 || rpe > 10) {
      return { ok: false, error: 'RPE must be 1–10 in steps of 0.5' };
    }
  }

  return { ok: true, value: { kg, reps, rpe } };
}
