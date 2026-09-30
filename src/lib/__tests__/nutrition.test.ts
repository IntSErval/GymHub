import { describe, expect, it } from '@jest/globals';
import { fromOpenFoodFacts, kcalFor, parseFoodForm, parseGrams } from '../nutrition';

describe('kcalFor', () => {
  it('scales per-100g kcal by grams', () => {
    expect(kcalFor(150, 200)).toBe(300);
    expect(kcalFor(50, 0)).toBe(0);
  });
});

describe('parseGrams', () => {
  it('parses plain, decimal and comma-decimal grams', () => {
    expect(parseGrams('150')).toEqual({ ok: true, value: 150 });
    expect(parseGrams(' 12.5 ')).toEqual({ ok: true, value: 12.5 });
    expect(parseGrams('12,5')).toEqual({ ok: true, value: 12.5 });
  });

  it('rejects empty, out-of-range and junk', () => {
    expect(parseGrams('')).toEqual({ ok: false, error: 'Enter grams' });
    for (const g of ['0', '0.5', '5001', '-1', 'abc', '1,000']) {
      expect(parseGrams(g).ok).toBe(false);
    }
  });
});

describe('parseFoodForm', () => {
  const base = { name: ' Oats ', kcal: '389', protein: '16,9', carbs: '', fat: '6.9' };

  it('parses a full form with blank macros as null', () => {
    expect(parseFoodForm({ ...base, barcode: ' 123 ' })).toEqual({
      ok: true,
      value: { name: 'Oats', kcalPer100g: 389, proteinG: 16.9, carbsG: null, fatG: 6.9, barcode: '123' },
    });
  });

  it('treats missing or blank barcode as null', () => {
    expect(parseFoodForm(base)).toMatchObject({ ok: true, value: { barcode: null } });
    expect(parseFoodForm({ ...base, barcode: '  ' })).toMatchObject({ ok: true, value: { barcode: null } });
  });

  it('returns the first error', () => {
    expect(parseFoodForm({ ...base, name: ' ' })).toEqual({ ok: false, error: 'Enter a name' });
    expect(parseFoodForm({ ...base, kcal: '' })).toEqual({ ok: false, error: 'Enter kcal per 100 g' });
    expect(parseFoodForm({ ...base, kcal: '901' }).ok).toBe(false);
    expect(parseFoodForm({ ...base, protein: '101' }).ok).toBe(false);
    expect(parseFoodForm({ ...base, fat: '-1' }).ok).toBe(false);
    expect(parseFoodForm({ ...base, carbs: 'x' }).ok).toBe(false);
  });
});

describe('fromOpenFoodFacts', () => {
  const found = {
    code: '3017620422003',
    status: 1,
    product: {
      product_name: 'Nutella',
      nutriments: { 'energy-kcal_100g': 539, proteins_100g: 6.3, carbohydrates_100g: 57.5, fat_100g: 30.9 },
    },
  };

  it('maps a found product', () => {
    expect(fromOpenFoodFacts(found, '3017620422003')).toEqual({
      name: 'Nutella',
      kcalPer100g: 539,
      proteinG: 6.3,
      carbsG: 57.5,
      fatG: 30.9,
      barcode: '3017620422003',
    });
  });

  it('nulls missing macros', () => {
    const json = { status: 1, product: { product_name: 'Water', nutriments: { 'energy-kcal_100g': 0 } } };
    expect(fromOpenFoodFacts(json, '1')).toMatchObject({ kcalPer100g: 0, proteinG: null, carbsG: null, fatG: null });
  });

  it('returns null for not-found, missing name or missing kcal', () => {
    expect(fromOpenFoodFacts({ code: '0', status: 0, status_verbose: 'product not found' }, '0')).toBeNull();
    expect(fromOpenFoodFacts({ status: 1 }, '1')).toBeNull();
    expect(fromOpenFoodFacts({ status: 1, product: { ...found.product, product_name: ' ' } }, '1')).toBeNull();
    expect(fromOpenFoodFacts({ status: 1, product: { product_name: 'X', nutriments: { fat_100g: 1 } } }, '1')).toBeNull();
    expect(fromOpenFoodFacts({ status: 1, product: { product_name: 'X', nutriments: { 'energy-kcal_100g': '5' } } }, '1')).toBeNull();
    expect(fromOpenFoodFacts(null, '1')).toBeNull();
  });
});
