import { Dumbbell } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TodayWorkouts } from '@/components/workout/today-workouts';
import { WorkoutForm } from '@/components/workout/workout-form';
import { WorkoutHistory } from '@/components/workout/workout-history';
import { OrangeColors, Spacing } from '@/constants/theme';

export default function WorkoutScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageTitleRow}>
          <Dumbbell color={OrangeColors.primary} size={26} />
          <Text style={styles.pageTitle}>Workout</Text>
        </View>
        <WorkoutForm onSaved={() => setRefreshKey(k => k + 1)} />
        <TodayWorkouts refreshKey={refreshKey} />
        <WorkoutHistory />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle: { color: '#fff', fontSize: 30, fontWeight: '800' },
});
