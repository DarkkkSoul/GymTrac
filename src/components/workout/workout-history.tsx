import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

import { Card } from '@/components/ui/card';
import { OrangeColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Workout } from '@/types/database';

export function WorkoutHistory() {
  const { user } = useAuth();
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayWorkouts, setDayWorkouts] = useState<Workout[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchMonthWorkouts = useCallback(async (year: number, month: number) => {
    if (!user) return;
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
    const { data } = await supabase
      .from('workouts')
      .select('logged_at')
      .eq('user_id', user.id)
      .gte('logged_at', `${firstDay}T00:00:00`)
      .lte('logged_at', `${lastDay}T23:59:59`);

    const marks: Record<string, any> = {};
    for (const w of data ?? []) {
      const date = w.logged_at.split('T')[0];
      marks[date] = { marked: true, dotColor: OrangeColors.primary };
    }
    setMarkedDates(marks);
  }, [user]);

  const fetchDayWorkouts = useCallback(async (date: string) => {
    if (!user) return;
    setLoadingDay(true);
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_sets(*)')
      .eq('user_id', user.id)
      .gte('logged_at', `${date}T00:00:00`)
      .lte('logged_at', `${date}T23:59:59`)
      .order('logged_at', { ascending: true });
    setDayWorkouts((data as Workout[]) ?? []);
    setLoadingDay(false);
  }, [user]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setExpanded(new Set());
    fetchDayWorkouts(day.dateString);
  };

  const handleMonthChange = (month: { year: number; month: number }) => {
    fetchMonthWorkouts(month.year, month.month);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const now = new Date();

  return (
    <Card>
      <Text style={styles.title}>Workout History</Text>
      <Calendar
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        markedDates={{
          ...markedDates,
          ...(selectedDate ? { [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: OrangeColors.primary } } : {}),
        }}
        initialDate={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`}
        theme={{
          backgroundColor: '#1A1A1A',
          calendarBackground: '#1A1A1A',
          textSectionTitleColor: '#9A9A9A',
          dayTextColor: '#fff',
          monthTextColor: '#fff',
          arrowColor: OrangeColors.primary,
          selectedDayBackgroundColor: OrangeColors.primary,
          todayTextColor: OrangeColors.primary,
          dotColor: OrangeColors.primary,
          textDisabledColor: '#444',
        }}
      />

      {selectedDate && (
        <View style={styles.dayDetail}>
          <Text style={styles.dayDetailTitle}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {loadingDay ? (
            <ActivityIndicator color={OrangeColors.primary} />
          ) : dayWorkouts.length === 0 ? (
            <Text style={styles.emptyText}>No workouts logged</Text>
          ) : (
            dayWorkouts.map(w => (
              <View key={w.id} style={styles.workoutItem}>
                <Pressable style={styles.workoutRow} onPress={() => toggleExpand(w.id)}>
                  <Text style={styles.workoutName}>{w.workout_name}</Text>
                  <View style={styles.rowRight}>
                    <Text style={styles.setCount}>{w.workout_sets?.length ?? 0} sets</Text>
                    {expanded.has(w.id)
                      ? <ChevronUp color="#9A9A9A" size={16} />
                      : <ChevronDown color="#9A9A9A" size={16} />
                    }
                  </View>
                </Pressable>
                {expanded.has(w.id) && (
                  <View style={styles.setsWrap}>
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
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: Spacing.two },
  dayDetail: { marginTop: Spacing.three, gap: Spacing.two },
  dayDetailTitle: { color: '#9A9A9A', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', paddingVertical: Spacing.two },
  workoutItem: { borderRadius: 10, backgroundColor: '#262626', overflow: 'hidden' },
  workoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  workoutName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setCount: { color: '#9A9A9A', fontSize: 13 },
  setsWrap: { paddingHorizontal: 12, paddingBottom: 12 },
  setsHeader: { flexDirection: 'row', marginBottom: 4 },
  setHeaderCell: { flex: 1, color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  setRow: { flexDirection: 'row', paddingVertical: 4, borderTopWidth: 1, borderColor: '#333' },
  setCell: { flex: 1, color: '#fff', fontSize: 14, textAlign: 'center' },
});
