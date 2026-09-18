import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Heatmap } from '@/components/Heatmap';
import { getActiveSession, listSetTimestamps } from '@/db/queries';
import { buildHeatmap, daysTrained, heatmapStartMs, type HeatCell } from '@/lib/heatmap';

export default function GymHub() {
  const db = useSQLiteContext();
  const [cells, setCells] = useState<HeatCell[][]>(() => buildHeatmap([], new Date()));
  const [hasActive, setHasActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const today = new Date();
      Promise.all([listSetTimestamps(db, heatmapStartMs(today)), getActiveSession(db)])
        .then(([timestamps, active]) => {
          setCells(buildHeatmap(timestamps, today));
          setHasActive(active !== null);
        })
        .catch((e) => {
          console.warn(e);
          Alert.alert('Could not load', String(e));
        });
    }, [db])
  );

  const days = daysTrained(cells);

  return (
    <View style={styles.container}>
      <Heatmap cells={cells} />
      <Text style={styles.caption}>
        {days} {days === 1 ? 'day' : 'days'} trained
      </Text>
      {/* The session row is created on the first logged set, not here. */}
      <Pressable style={styles.button} onPress={() => router.push('/workout')} accessibilityRole="button">
        <Text style={styles.buttonText}>{hasActive ? 'Resume workout' : 'Start workout'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  caption: { color: '#555' },
  button: { backgroundColor: '#216e39', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
