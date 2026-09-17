import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { addExercise, listExercises, type Exercise } from '@/db/queries';
import { MUSCLES, type Muscle } from '@/lib/muscles';

type Props = { visible: boolean; onClose: () => void; onPick: (exercise: Exercise) => void };

export function ExercisePicker({ visible, onClose, onPick }: Props) {
  const db = useSQLiteContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newMuscles, setNewMuscles] = useState<Muscle[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) listExercises(db).then(setExercises, (e) => setError(String(e)));
  }, [db, visible]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? exercises.filter((e) => e.name.toLowerCase().includes(q) || e.muscles.some((m) => m.includes(q)))
    : exercises;

  function toggleMuscle(m: Muscle) {
    setNewMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  }

  async function onSave() {
    try {
      const id = await addExercise(db, newName, newMuscles);
      onPick({ id, name: newName.trim(), muscles: newMuscles });
      setNewName('');
      setNewMuscles([]);
      setError('');
    } catch (e) {
      setError(String(e).includes('UNIQUE') ? 'Exercise already exists' : e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="Search name or muscle"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text style={styles.link}>Close</Text>
          </Pressable>
        </View>

        <FlatList
          style={styles.flex}
          data={filtered}
          keyExtractor={(e) => String(e.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => onPick(item)} accessibilityRole="button">
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.muscles}>{item.muscles.join(' · ')}</Text>
            </Pressable>
          )}
        />

        <View style={styles.newSection}>
          <Text style={styles.name}>New exercise</Text>
          <TextInput style={styles.input} placeholder="Name" value={newName} onChangeText={setNewName} />
          <View style={styles.chips}>
            {MUSCLES.map((m) => {
              const on = newMuscles.includes(m);
              return (
                <Pressable
                  key={m}
                  onPress={() => toggleMuscle(m)}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}>
                  <Text style={on ? styles.chipTextOn : undefined}>{m}</Text>
                </Pressable>
              );
            })}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} onPress={onSave} accessibilityRole="button">
            <Text style={styles.buttonText}>Save & add</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, gap: 8 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  close: { padding: 8 },
  link: { color: '#216e39', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  name: { fontSize: 16, fontWeight: '600' },
  muscles: { color: '#666' },
  newSection: { gap: 8, borderTopWidth: 1, borderColor: '#ddd', paddingTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  chipOn: { backgroundColor: '#216e39', borderColor: '#216e39' },
  chipTextOn: { color: '#fff' },
  error: { color: '#c00' },
  button: { backgroundColor: '#216e39', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
