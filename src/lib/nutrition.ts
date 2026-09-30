import { toNumber } from './sets';

export type FoodInput = {
  name: string;
  kcalPer100g: number;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  barcode: string | null;
};
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const kcalFor = (grams: number, kcalPer100g: number) => (grams * kcalPer100g) / 100;

export function parseGrams(text: string): Result<number> {
  if (text.trim() === '') return { ok: false, error: 'Enter grams' };
  const grams = toNumber(text);
  if (!Number.isFinite(grams) || grams < 1 || grams > 5000) return { ok: false, error: 'Grams must be 1–5000' };
  return { ok: true, value: grams };
}

/** Blank → null; otherwise must be 0–100 g per 100 g. */
function parseMacro(text: string, label: string): Result<number | null> {
  if (text.trim() === '') return { ok: true, value: null };
  const g = toNumber(text);
  if (!Number.isFinite(g) || g < 0 || g > 100) return { ok: false, error: `${label} must be 0–100 g` };
  return { ok: true, value: g };
}

export function parseFoodForm(form: {
  name: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  barcode?: string;
}): Result<FoodInput> {
  const name = form.name.trim();
  if (!name) return { ok: false, error: 'Enter a name' };

  if (form.kcal.trim() === '') return { ok: false, error: 'Enter kcal per 100 g' };
  const kcalPer100g = toNumber(form.kcal);
  if (!Number.isFinite(kcalPer100g) || kcalPer100g < 0 || kcalPer100g > 900) {
    return { ok: false, error: 'kcal must be 0–900 per 100 g' };
  }

  const protein = parseMacro(form.protein, 'Protein');
  if (!protein.ok) return protein;
  const carbs = parseMacro(form.carbs, 'Carbs');
  if (!carbs.ok) return carbs;
  const fat = parseMacro(form.fat, 'Fat');
  if (!fat.ok) return fat;

  const barcode = form.barcode?.trim() || null;
  return {
    ok: true,
    value: { name, kcalPer100g, proteinG: protein.value, carbsG: carbs.value, fatG: fat.value, barcode },
  };
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Maps an Open Food Facts v2 product response; null when there's nothing usable to log. */
export function fromOpenFoodFacts(json: unknown, barcode: string): FoodInput | null {
  const res = json as { status?: unknown; product?: { product_name?: unknown; nutriments?: Record<string, unknown> } };
  if (res?.status !== 1 || !res.product) return null;
  const name = typeof res.product.product_name === 'string' ? res.product.product_name.trim() : '';
  const n = res.product.nutriments ?? {};
  const kcal = num(n['energy-kcal_100g']);
  // Negative kcal would violate the table CHECK; treat it as unusable like a missing value.
  if (!name || kcal === null || kcal < 0) return null;
  return {
    name,
    kcalPer100g: kcal,
    proteinG: num(n.proteins_100g),
    carbsG: num(n.carbohydrates_100g),
    fatG: num(n.fat_100g),
    barcode,
  };
}
