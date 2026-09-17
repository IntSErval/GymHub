import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ExercisePicker } from '@/components/ExercisePicker';
import {
  addSet,
  deleteSet,
  finishSession,
  getActiveSession,
  listSessionSets,
  type Exercise,
  type SessionSet,
} from '@/db/queries';
import { parseSet } from '@/lib/sets';

type Inputs = { kg: string; reps: string; rpe: string };
type Group = { exercise: Exercise; sets: SessionSet[] };

export default function Workout() {
  const db = useSQLiteContext();
  const [session, setSession] = useState<{ id: number; startedAt: number } | null>(null);
  const [sets, setSets] = useState<SessionSet[]>([]);
  // ponytail: unlogged exercises aren't persisted; add a session_exercises table if resume-with-empty-exercise matters
  const [extras, setExtras] = useState<Exercise[]>([]);
  const [inputs, setInputs] = useState<Record<number, Inputs>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const reload = useCallback(async (sessionId: number) => {
    setSets(await listSessionSets(db, sessionId));
  }, [db]);

  useEffect(() => {
    getActiveSession(db)
      .then(async (active) => {
        if (!active) return router.back();
        setSession(active);
        await reload(active.id);
      })
      .catch((e) => {
        console.warn(e);
        Alert.alert('Could not load workout', String(e));
      });
  }, [db, reload]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const groups: Group[] = [];
  for (const s of sets) {
    let group = groups.find((g) => g.exercise.id === s.exerciseId);
    if (!group) {
      group = { exercise: { id: s.exerciseId, name: s.exerciseName, muscles: s.muscles }, sets: [] };
      groups.push(group);
    }
    group.sets.push(s);
  }
  for (const e of extras) {
    if (!groups.some((g) => g.exercise.id === e.id)) groups.push({ exercise: e, sets: [] });
  }

  function inputsFor({ exercise, sets: groupSets }: Group): Inputs {
    const last = groupSets[groupSets.length - 1];
    return inputs[exercise.id] ?? { kg: last ? String(last.kg) : '', reps: last ? String(last.reps) : '', rpe: '' };
  }

  function setField(group: Group, field: keyof Inputs, value: string) {
    setInputs((cur) => ({ ...cur, [group.exercise.id]: { ...inputsFor(group), [field]: value } }));
  }

  async function onAdd(group: Group) {
    if (!session || saving) return;
    const current = inputsFor(group);
    const parsed = parseSet(current.kg, current.reps, current.rpe);
    const id = group.exercise.id;
    if (!parsed.ok) {
      setErrors((cur) => ({ ...cur, [id]: parsed.error }));
      return;
    }
    setSaving(true);
    try {
      await addSet(db, { sessionId: session.id, exerciseId: id, ...parsed.value });
      setErrors((cur) => ({ ...cur, [id]: '' }));
      setInputs((cur) => ({ ...cur, [id]: { ...current, rpe: '' } }));
      await reload(session.id);
    } catch (e) {
      console.warn(e);
      Alert.alert('Could not save', String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(setId: number) {
    if (!session) return;
    try {
      await deleteSet(db, setId);
      await reload(session.id);
    } catch (e) {
      console.warn(e);
      Alert.alert('Could not delete', String(e));
    }
  }

  async function onFinish() {
    if (!session) return;
    try {
      await finishSession(db, session.id);
      router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert('Could not finish', String(e));
    }
  }

  function onPick(exercise: Exercise) {
    setExtras((cur) => (cur.some((e) => e.id === exercise.id) ? cur : [...cur, exercise]));
    setPickerOpen(false);
  }

  const minutes = session ? Math.max(0, Math.floor((now - session.startedAt) / 60_000)) : 0;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: `Workout · ${minutes} min`,
          headerRight: () => (
            <Pressable onPress={onFinish} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>Finish</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {groups.map((group) => {
          const current = inputsFor(group);
          const id = group.exercise.id;
          return (
            <View key={id} style={styles.group}>
              <Text style={styles.name}>{group.exercise.name}</Text>
              <Text style={styles.muscles}>{group.exercise.muscles.join(' · ')}</Text>
              {group.sets.map((s, i) => (
                <View key={s.id} style={styles.setRow}>
                  <Text style={styles.setText}>
                    {i + 1}   {s.kg}kg × {s.reps}
                    {s.rpe !== null ? `   RPE ${s.rpe}` : ''}
                  </Text>
                  <Pressable
                    onPress={() => onDelete(s.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove set ${i + 1}`}
                    hitSlop={8}>
                    <Text style={styles.remove}>✕</Text>
                  </Pressable>
                </View>
              ))}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="kg"
                  keyboardType="decimal-pad"
                  value={current.kg}
                  onChangeText={(v) => setField(group, 'kg', v)}
                  accessibilityLabel="kg"
                />
                <TextInput
                  style={styles.input}
                  placeholder="reps"
                  keyboardType="number-pad"
                  value={current.reps}
                  onChangeText={(v) => setField(group, 'reps', v)}
                  accessibilityLabel="reps"
                />
                <TextInput
                  style={styles.input}
                  placeholder="rpe"
                  keyboardType="decimal-pad"
                  value={current.rpe}
                  onChangeText={(v) => setField(group, 'rpe', v)}
                  accessibilityLabel="RPE (optional)"
                />
                <Pressable
                  style={[styles.addButton, saving && styles.disabled]}
                  onPress={() => onAdd(group)}
                  disabled={saving}
                  accessibilityRole="button">
                  <Text style={styles.addText}>Add</Text>
                </Pressable>
              </View>
              {errors[id] ? <Text style={styles.error}>{errors[id]}</Text> : null}
            </View>
          );
        })}

        <Pressable style={styles.addExercise} onPress={() => setPickerOpen(true)} accessibilityRole="button">
          <Text style={styles.link}>+ Add exercise</Text>
        </Pressable>
      </ScrollView>

      <ExercisePicker visible={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onPick} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 16 },
  group: { gap: 6 },
  name: { fontSize: 17, fontWeight: '600' },
  muscles: { color: '#666' },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  setText: { fontSize: 15 },
  remove: { color: '#c00', fontSize: 16, paddingHorizontal: 8 },
  inputRow: { flexDirection: 'row', gap: 6 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  addButton: { backgroundColor: '#216e39', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  addText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  error: { color: '#c00' },
  addExercise: { padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#216e39', borderRadius: 8 },
  link: { color: '#216e39', fontWeight: '600', fontSize: 16 },
});
