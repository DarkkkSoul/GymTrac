import { Dumbbell, Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { OrangeColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

interface SetInput {
  weight: string;
  reps: string;
}

interface Props {
  onSaved: () => void;
}

export function WorkoutForm({ onSaved }: Props) {
  const { user } = useAuth();
  const [workoutName, setWorkoutName] = useState('');
  const [numSets, setNumSets] = useState(3);
  const [sets, setSets] = useState<SetInput[]>([
    { weight: '', reps: '' },
    { weight: '', reps: '' },
    { weight: '', reps: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateNumSets = (n: number) => {
    const clamped = Math.max(1, Math.min(10, n));
    setNumSets(clamped);
    setSets(prev => {
      const next = [...prev];
      while (next.length < clamped) next.push({ weight: '', reps: '' });
      return next.slice(0, clamped);
    });
  };

  const updateSet = (index: number, field: keyof SetInput, value: string) => {
    setSets(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!workoutName.trim()) { setError('Workout name is required.'); return; }
    for (const [i, s] of sets.entries()) {
      if (!s.weight || !s.reps) { setError(`Fill in weight and reps for set ${i + 1}.`); return; }
    }
    setSaving(true);
    setError('');

    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .insert({ user_id: user!.id, workout_name: workoutName.trim(), logged_at: new Date().toISOString() })
      .select()
      .single();

    if (wErr || !workout) { setError(wErr?.message ?? 'Failed to save workout.'); setSaving(false); return; }

    const { error: sErr } = await supabase.from('workout_sets').insert(
      sets.map((s, i) => ({
        workout_id: workout.id,
        set_number: i + 1,
        weight: parseFloat(s.weight),
        reps: parseInt(s.reps),
      }))
    );

    if (sErr) { setError(sErr.message); setSaving(false); return; }

    setWorkoutName('');
    setNumSets(3);
    setSets([{ weight: '', reps: '' }, { weight: '', reps: '' }, { weight: '', reps: '' }]);
    onSaved();
    setSaving(false);
  };

  return (
    <Card>
      <View style={styles.titleRow}>
        <Dumbbell color={OrangeColors.primary} size={20} />
        <Text style={styles.title}>Log Workout</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Workout name (e.g. Bench Press)"
        placeholderTextColor="#666"
        value={workoutName}
        onChangeText={setWorkoutName}
      />

      <View style={styles.setsRow}>
        <Text style={styles.label}>Number of Sets</Text>
        <View style={styles.counter}>
          <Pressable onPress={() => updateNumSets(numSets - 1)} style={styles.counterBtn}>
            <Minus color="#fff" size={16} />
          </Pressable>
          <Text style={styles.counterVal}>{numSets}</Text>
          <Pressable onPress={() => updateNumSets(numSets + 1)} style={styles.counterBtn}>
            <Plus color="#fff" size={16} />
          </Pressable>
        </View>
      </View>

      <View style={styles.setsHeader}>
        <Text style={[styles.setCol, { flex: 0.5 }]}>Set</Text>
        <Text style={[styles.setCol, { flex: 1 }]}>Weight</Text>
        <Text style={[styles.setCol, { flex: 1 }]}>Reps</Text>
      </View>

      {sets.map((s, i) => (
        <View key={i} style={styles.setRow}>
          <Text style={[styles.setNum, { flex: 0.5 }]}>{i + 1}</Text>
          <TextInput
            style={[styles.setInput, { flex: 1 }]}
            placeholder="kg"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={s.weight}
            onChangeText={v => updateSet(i, 'weight', v)}
          />
          <TextInput
            style={[styles.setInput, { flex: 1 }]}
            placeholder="reps"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={s.reps}
            onChangeText={v => updateSet(i, 'reps', v)}
          />
        </View>
      ))}

      <GradientButton label="Add Workout" onPress={handleSave} loading={saving} style={styles.btn} />
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.two },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  error: { color: '#FF4444', fontSize: 13, marginBottom: Spacing.two },
  input: {
    backgroundColor: '#262626', color: '#fff', borderRadius: 10,
    padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#333', marginBottom: Spacing.two,
  },
  label: { color: '#9A9A9A', fontSize: 14, fontWeight: '600' },
  setsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { backgroundColor: '#262626', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#333' },
  counterVal: { color: '#fff', fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  setsHeader: { flexDirection: 'row', marginBottom: 4 },
  setCol: { color: '#9A9A9A', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  setRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  setNum: { color: '#9A9A9A', textAlign: 'center', fontSize: 14 },
  setInput: {
    backgroundColor: '#262626', color: '#fff', borderRadius: 8,
    padding: 10, fontSize: 14, borderWidth: 1, borderColor: '#333', textAlign: 'center',
  },
  btn: { marginTop: Spacing.two },
});
