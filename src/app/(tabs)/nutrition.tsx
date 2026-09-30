import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { addWater, sumWater } from '@/db/daily';
import { deleteMeal, listMealsBetween, type Meal } from '@/db/nutrition';
import { dayRangeMs } from '@/lib/day';

export default function Nutrition() {
  const db = useSQLiteContext();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [water, setWater] = useState(0);

  const load = useCallback(async () => {
    const [from, to] = dayRangeMs(new Date());
    const [m, w] = await Promise.all([listMealsBetween(db, from, to), sumWater(db, from, to)]);
    setMeals(m);
    setWater(w);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => {
        console.warn(e);
        Alert.alert('Could not load', String(e));
      });
    }, [load])
  );

  async function run(action: () => Promise<unknown>, failTitle: string) {
    try {
      await action();
      await load();
    } catch (e) {
      console.warn(e);
      Alert.alert(failTitle, String(e));
    }
  }

  const total = meals.reduce((sum, m) => sum + m.kcal, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.total}>{Math.round(total)} kcal today</Text>

      <FlatList
        style={styles.flex}
        data={meals}
        keyExtractor={(m) => String(m.id)}
        ListEmptyComponent={<Text style={styles.muted}>No meals logged today.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.name}>{item.foodName}</Text>
              <Text style={styles.muted}>
                {item.grams} g · {Math.round(item.kcal)} kcal
              </Text>
            </View>
            <Pressable
              onPress={() => run(() => deleteMeal(db, item.id), 'Could not delete')}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.foodName}`}
              hitSlop={8}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable style={styles.button} onPress={() => router.push('/food-picker')} accessibilityRole="button">
        <Text style={styles.buttonText}>Add food</Text>
      </Pressable>

      <View style={styles.water}>
        <Text style={styles.name}>Water: {water} ml</Text>
        <View style={styles.waterButtons}>
          {[250, 500].map((ml) => (
            <Pressable
              key={ml}
              style={[styles.button, styles.flex]}
              onPress={() => run(() => addWater(db, ml), 'Could not add water')}
              accessibilityRole="button">
              <Text style={styles.buttonText}>+{ml} ml</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  flex: { flex: 1 },
  total: { fontSize: 24, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  name: { fontSize: 16, fontWeight: '600' },
  muted: { color: '#666' },
  remove: { color: '#c00', fontSize: 18, paddingHorizontal: 8 },
  water: { gap: 8, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 12 },
  waterButtons: { flexDirection: 'row', gap: 8 },
  button: { backgroundColor: '#216e39', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
