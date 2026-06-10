import { Calendar as CalendarIcon, CheckCircle2, XCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { BottomSheetModal } from '@/components/ui/bottom-sheet-modal';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrangeColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { GymAttendance } from '@/types/database';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function GymAttendanceTracker() {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allAttendance, setAllAttendance] = useState<GymAttendance[]>([]);
  const [calLoading, setCalLoading] = useState(false);

  const fetchToday = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('gym_attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayISO())
      .single();
    setTodayAttendance(data?.attended ?? null);
    setLoading(false);
  }, [user]);

  const fetchMonthAttendance = useCallback(async () => {
    if (!user) return;
    setCalLoading(true);
    const now = new Date();
    const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data } = await supabase
      .from('gym_attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay);
    setAllAttendance(data ?? []);
    setCalLoading(false);
  }, [user]);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const handleAttendance = async (attended: boolean) => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from('gym_attendance')
      .upsert({ user_id: user.id, date: todayISO(), attended }, { onConflict: 'user_id,date' });
    setTodayAttendance(attended);
    setSaving(false);
  };

  const markedDates = allAttendance.reduce<Record<string, any>>((acc, record) => {
    acc[record.date] = { marked: true, dotColor: record.attended ? '#22C55E' : '#EF4444' };
    return acc;
  }, {});

  const handleOpenCalendar = () => {
    setShowCalendar(true);
    fetchMonthAttendance();
  };

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <CalendarIcon color={OrangeColors.primary} size={20} />
            <Text style={styles.sectionTitle}>Gym Attendance</Text>
          </View>
          <Pressable style={styles.calBtn} onPress={handleOpenCalendar}>
            <CalendarIcon color={OrangeColors.primary} size={14} />
            <Text style={styles.calBtnText}>Calendar</Text>
          </Pressable>
        </View>

        {loading ? (
          <Skeleton height={60} borderRadius={12} />
        ) : (
          <>
            <Text style={styles.prompt}>Did you go to the gym today?</Text>
            {saving && <ActivityIndicator color={OrangeColors.primary} style={{ marginVertical: 4 }} />}
            <View style={styles.radioRow}>
              <Pressable
                style={[styles.radioBtn, todayAttendance === true && styles.radioBtnActiveGreen]}
                onPress={() => handleAttendance(true)}
                disabled={saving}
              >
                <CheckCircle2 color={todayAttendance === true ? '#22C55E' : '#666'} size={18} />
                <Text style={[styles.radioText, todayAttendance === true && styles.radioTextGreen]}>Yes</Text>
              </Pressable>
              <Pressable
                style={[styles.radioBtn, todayAttendance === false && styles.radioBtnActiveRed]}
                onPress={() => handleAttendance(false)}
                disabled={saving}
              >
                <XCircle color={todayAttendance === false ? '#EF4444' : '#666'} size={18} />
                <Text style={[styles.radioText, todayAttendance === false && styles.radioTextRed]}>No</Text>
              </Pressable>
            </View>
          </>
        )}
      </Card>

      {/* Half-screen calendar bottom sheet */}
      <BottomSheetModal visible={showCalendar} onClose={() => setShowCalendar(false)}>
        <ScrollView contentContainerStyle={styles.sheetBody}>
          <Text style={styles.sheetTitle}>Gym Attendance</Text>

          {calLoading ? (
            <ActivityIndicator color={OrangeColors.primary} style={{ marginTop: 20 }} />
          ) : (
            <Calendar
              markedDates={markedDates}
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
          )}

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>Went to gym</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Skipped</Text>
            </View>
          </View>
        </ScrollView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  calBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: OrangeColors.muted, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: OrangeColors.primary,
  },
  calBtnText: { color: OrangeColors.primary, fontWeight: '700', fontSize: 13 },
  prompt: { color: '#9A9A9A', fontSize: 14 },
  radioRow: { flexDirection: 'row', gap: Spacing.two, marginTop: 4 },
  radioBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#333', backgroundColor: '#262626',
  },
  radioBtnActiveGreen: { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)' },
  radioBtnActiveRed: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' },
  radioText: { color: '#9A9A9A', fontWeight: '600', fontSize: 15 },
  radioTextGreen: { color: '#22C55E' },
  radioTextRed: { color: '#EF4444' },
  // Sheet
  sheetBody: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  sheetTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: Spacing.two },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.four, marginTop: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#9A9A9A', fontSize: 13 },
});
