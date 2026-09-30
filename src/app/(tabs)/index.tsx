import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { addWater, addWeight, latestWeight, sumCalories, sumWater, workoutSummary } from '@/db/daily';
import { getActiveSession } from '@/db/queries';
import { parseWater, parseWeight, type Parsed } from '@/lib/daily';
import { dayRangeMs } from '@/lib/day';

type Today = {
  sets: number;
  exercises: number;
  water: number;
  kcal: number;
  weight: { kg: number; createdAt: number } | null;
  hasActive: boolean;
};

const EMPTY: Today = { sets: 0, exercises: 0, water: 0, kcal: 0, weight: null, hasActive: false };

export default function Home() {
  const db = useSQLiteContext();
  const [today, setToday] = useState<Today>(EMPTY);
  const [waterText, setWaterText] = useState('');
  const [weightText, setWeightText] = useState('');
  const [waterError, setWaterError] = useState('');
  const [weightError, setWeightError] = useState('');

  const load = useCallback(async () => {
    const [from, to] = dayRangeMs(new Date());
    const [summary, water, kcal, weight, active] = await Promise.all([
      workoutSummary(db, from, to),
      sumWater(db, from, to),
      sumCalories(db, from, to),
      latestWeight(db),
      getActiveSession(db),
    ]);
    setToday({ ...summary, water, kcal, weight, hasActive: active !== null });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => {
        console.warn(e);
        Alert.alert('Could not load', String(e));
      });
    }, [load])
  );

  async function save(action: () => Promise<unknown>) {
    try {
      await action();
      await load();
      return true;
    } catch (e) {
      console.warn(e);
      Alert.alert('Could not save', String(e));
      return false;
    }
  }

  async function onAddWater(parsed: Parsed<number>) {
    if (!parsed.ok) return setWaterError(parsed.error);
    setWaterError('');
    if (await save(() => addWater(db, parsed.value))) setWaterText('');
  }

  async function onLogWeight() {
    const parsed = parseWeight(weightText);
    if (!parsed.ok) return setWeightError(parsed.error);
    setWeightError('');
    if (await save(() => addWeight(db, parsed.value))) setWeightText('');
  }

  const [from, to] = dayRangeMs(new Date());
  const { weight } = today;
  const weightIsToday = weight !== null && weight.createdAt >= from && weight.createdAt < to;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.heading}>Workout today</Text>
        <Text style={styles.value}>
          {today.sets > 0 ? `${today.sets} sets · ${today.exercises} exercises` : 'No workout yet'}
        </Text>
        {/* The session row is created on the first logged set, not here. */}
        <Pressable style={styles.button} onPress={() => router.push('/workout')} accessibilityRole="button">
          <Text style={styles.buttonText}>{today.hasActive ? 'Resume workout' : 'Start workout'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Water</Text>
        <Text style={styles.value}>{today.water} ml</Text>
        <View style={styles.row}>
          {[250, 500].map((ml) => (
            <Pressable
              key={ml}
              style={[styles.button, styles.flex]}
              onPress={() => onAddWater({ ok: true, value: ml })}
              accessibilityRole="button">
              <Text style={styles.buttonText}>+{ml} ml</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="ml"
            keyboardType="number-pad"
            value={waterText}
            onChangeText={setWaterText}
            accessibilityLabel="Water in ml"
          />
          <Pressable
            style={styles.addButton}
            onPress={() => onAddWater(parseWater(waterText))}
            accessibilityRole="button">
            <Text style={styles.buttonText}>Add</Text>
          </Pressable>
        </View>
        {waterError ? <Text style={styles.error}>{waterError}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Calories</Text>
        <Text style={styles.value}>{Math.round(today.kcal)} kcal</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Weight</Text>
        <Text style={styles.value}>{weight ? `${weight.kg} kg` : '—'}</Text>
        {weight && !weightIsToday ? (
          <Text style={styles.caption}>{new Date(weight.createdAt).toLocaleDateString()}</Text>
        ) : null}
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="kg"
            keyboardType="decimal-pad"
            value={weightText}
            onChangeText={setWeightText}
            accessibilityLabel="Weight in kg"
          />
          <Pressable style={styles.addButton} onPress={onLogWeight} accessibilityRole="button">
            <Text style={styles.buttonText}>Log</Text>
          </Pressable>
        </View>
        {weightError ? <Text style={styles.error}>{weightError}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20 },
  section: { gap: 8 },
  heading: { fontSize: 13, fontWeight: '600', color: '#555', textTransform: 'uppercase' },
  value: { fontSize: 22, fontWeight: '600' },
  caption: { color: '#555' },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  button: { backgroundColor: '#216e39', padding: 14, borderRadius: 10, alignItems: 'center' },
  addButton: { backgroundColor: '#216e39', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  error: { color: '#c00' },
});
