import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { addFood, addMeal, findFoodByBarcode, searchFoods, type Food } from '@/db/nutrition';
import { kcalFor, parseFoodForm, parseGrams } from '@/lib/nutrition';

const EMPTY_FORM = { name: '', kcal: '', protein: '', carbs: '', fat: '', barcode: '' };
type Form = typeof EMPTY_FORM;

export default function FoodPicker() {
  const db = useSQLiteContext();
  // Set by the scan screen via dismissTo; t changes on every scan so a repeat code re-triggers.
  const { barcode, t } = useLocalSearchParams<{ barcode?: string; t?: string }>();
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState('');
  const [form, setForm] = useState<Form | null>(null); // non-null = custom form open
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true; // drop responses that arrive after a newer query
    searchFoods(db, query).then(
      (list) => live && setFoods(list),
      (e) => live && setError(String(e))
    );
    return () => {
      live = false;
    };
  }, [db, query, selected]); // selected: refresh after a food was created or scanned in

  useEffect(() => {
    if (!barcode) return;
    let live = true;
    findFoodByBarcode(db, barcode).then(
      (food) => {
        if (!live) return;
        setError('');
        setSelected(food);
        setGrams('');
        setForm(food ? null : { ...EMPTY_FORM, barcode });
      },
      (e) => live && setError(String(e))
    );
    return () => {
      live = false;
    };
  }, [db, barcode, t]);

  function pick(food: Food) {
    setSelected(food);
    setForm(null);
    setGrams('');
    setError('');
  }

  async function guarded(action: () => Promise<void>) {
    if (saving) return; // a double-tap would log twice / hit UNIQUE
    setSaving(true);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const saveFood = () =>
    guarded(async () => {
      if (!form) return;
      const parsed = parseFoodForm(form);
      if (!parsed.ok) return setError(parsed.error);
      const id = await addFood(db, parsed.value, 'custom');
      pick({ id, name: parsed.value.name, kcalPer100g: parsed.value.kcalPer100g, barcode: parsed.value.barcode });
    });

  const saveMeal = () =>
    guarded(async () => {
      if (!selected) return;
      const parsed = parseGrams(grams);
      if (!parsed.ok) return setError(parsed.error);
      await addMeal(db, selected.id, parsed.value);
      router.back();
    });

  const errorText = error ? (
    <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      {error}
    </Text>
  ) : null;

  if (selected) {
    const parsed = parseGrams(grams);
    return (
      <View style={styles.container}>
        <Text style={styles.name}>{selected.name}</Text>
        <Text style={styles.muted}>{Math.round(selected.kcalPer100g)} kcal / 100 g</Text>
        <TextInput
          style={styles.input}
          placeholder="Grams"
          keyboardType="decimal-pad"
          value={grams}
          onChangeText={setGrams}
          accessibilityLabel="Grams"
          autoFocus
        />
        <Text style={styles.name}>
          {parsed.ok ? `${Math.round(kcalFor(parsed.value, selected.kcalPer100g))} kcal` : '— kcal'}
        </Text>
        {errorText}
        <Button label="Add meal" onPress={saveMeal} disabled={saving} />
        <Pressable onPress={() => {
            setSelected(null);
            setError('');
          }} accessibilityRole="button">
          <Text style={styles.link}>Choose another food</Text>
        </Pressable>
      </View>
    );
  }

  if (form) {
    const field = (key: keyof Form, label: string, numeric = true) => (
      <TextInput
        style={styles.input}
        placeholder={label}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        value={form[key]}
        onChangeText={(v) => setForm({ ...form, [key]: v })}
        accessibilityLabel={label}
      />
    );
    return (
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.name}>New food (per 100 g)</Text>
        {field('name', 'Name', false)}
        {field('kcal', 'kcal per 100 g')}
        {field('protein', 'Protein g (optional)')}
        {field('carbs', 'Carbs g (optional)')}
        {field('fat', 'Fat g (optional)')}
        <TextInput
          style={styles.input}
          placeholder="Barcode (optional)"
          keyboardType="number-pad"
          value={form.barcode}
          onChangeText={(v) => setForm({ ...form, barcode: v })}
          accessibilityLabel="Barcode (optional)"
        />
        {errorText}
        <Button label="Save food" onPress={saveFood} disabled={saving} />
        <Pressable onPress={() => setForm(null)} accessibilityRole="button">
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search foods"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        accessibilityLabel="Search foods"
      />
      <FlatList
        style={styles.flex}
        data={foods}
        keyExtractor={(f) => String(f.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.muted}>No foods yet. Scan one or create a custom food.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => pick(item)} accessibilityRole="button">
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.muted}>{Math.round(item.kcalPer100g)} kcal / 100 g</Text>
          </Pressable>
        )}
      />
      {errorText}
      <Button label="Scan barcode" onPress={() => router.push('/scan')} />
      <Button
        label="Create custom food"
        onPress={() => {
          setError('');
          setForm({ ...EMPTY_FORM, name: query.trim() });
        }}
      />
    </View>
  );
}

function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button">
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  form: { padding: 16, gap: 8 },
  flex: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  name: { fontSize: 16, fontWeight: '600' },
  muted: { color: '#666' },
  link: { color: '#216e39', fontWeight: '600', padding: 8, textAlign: 'center' },
  error: { color: '#c00' },
  disabled: { opacity: 0.5 },
  button: { backgroundColor: '#216e39', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
