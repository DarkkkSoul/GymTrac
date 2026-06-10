import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Workout } from '@/types/database';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

interface Props {
  refreshKey: number;
}

export function TodayWorkouts({ refreshKey }: Props) {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_sets(*)')
      .eq('user_id', user.id)
      .gte('logged_at', `${todayISO()}T00:00:00`)
      .lte('logged_at', `${todayISO()}T23:59:59`)
      .order('logged_at', { ascending: false });
    setWorkouts((data as Workout[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts, refreshKey]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (workoutId: string) => {
    setDeletingId(workoutId);
    // workout_sets are cascade-deleted via FK
    await supabase.from('workouts').delete().eq('id', workoutId);
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
    setExpanded(prev => {
      const next = new Set(prev);
      next.delete(workoutId);
      return next;
    });
    setDeletingId(null);
  };

  return (
    <Card>
      <Text style={styles.title}>Today's Workouts</Text>
      {loading ? (
        <View style={styles.skeletonWrap}>
          <Skeleton height={48} borderRadius={10} />
          <Skeleton height={48} borderRadius={10} />
        </View>
      ) : workouts.length === 0 ? (
        <Text style={styles.empty}>No workouts logged today. Get after it!</Text>
      ) : (
        workouts.map(w => (
          <View key={w.id} style={styles.workoutItem}>
            {/* Row: expand toggle + delete */}
            <View style={styles.workoutRow}>
              <Pressable style={styles.expandArea} onPress={() => toggleExpand(w.id)}>
                <Text style={styles.workoutName}>{w.workout_name}</Text>
                <View style={styles.rowMeta}>
                  <Text style={styles.setCount}>{w.workout_sets?.length ?? 0} sets</Text>
                  {expanded.has(w.id)
                    ? <ChevronUp color="#9A9A9A" size={16} />
                    : <ChevronDown color="#9A9A9A" size={16} />
                  }
                </View>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(w.id)}
                disabled={deletingId === w.id}
              >
                {deletingId === w.id
                  ? <ActivityIndicator size="small" color="#EF4444" />
                  : <Trash2 color="#EF4444" size={16} />
                }
              </Pressable>
            </View>

            {/* Expanded sets */}
            {expanded.has(w.id) && (
              <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                  <Text style={styles.setHeaderCell}>Set</Text>
                  <Text style={styles.setHeaderCell}>Weight</Text>
                  <Text style={styles.setHeaderCell}>Reps</Text>
                </View>
                {(w.workout_sets ?? [])
                  .sort((a, b) => a.set_number - b.set_number)
                  .map(s => (
                    <View key={s.id} style={styles.setRow}>
                      <Text style={styles.setCell}>{s.set_number}</Text>
                      <Text style={styles.setCell}>{s.weight} kg</Text>
                      <Text style={styles.setCell}>{s.reps}</Text>
                    </View>
                  ))
                }
              </View>
            )}
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: Spacing.two },
  skeletonWrap: { gap: 8 },
  empty: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: Spacing.three },
  workoutItem: {
    borderRadius: 10,
    backgroundColor: '#262626',
    marginBottom: 8,
    overflow: 'hidden',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  workoutName: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setCount: { color: '#9A9A9A', fontSize: 13 },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderColor: '#333',
  },
  setsContainer: { paddingHorizontal: 12, paddingBottom: 12 },
  setsHeader: { flexDirection: 'row', marginBottom: 4 },
  setHeaderCell: {
    flex: 1, color: '#666', fontSize: 11,
    fontWeight: '700', textTransform: 'uppercase', textAlign: 'center',
  },
  setRow: { flexDirection: 'row', paddingVertical: 4, borderTopWidth: 1, borderColor: '#333' },
  setCell: { flex: 1, color: '#fff', fontSize: 14, textAlign: 'center' },
});
