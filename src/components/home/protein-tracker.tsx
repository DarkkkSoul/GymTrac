import { ChevronDown, ChevronUp, Flame, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { BottomSheetModal } from '@/components/ui/bottom-sheet-modal';
import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrangeColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { ProteinLog } from '@/types/database';

interface Props {
  proteinGoal: number;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDateLabel(dateStr: string) {
  const today = todayISO();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function ProteinTracker({ proteinGoal }: Props) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ProteinLog[]>([]);
  const [allLogs, setAllLogs] = useState<ProteinLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [mealName, setMealName] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTodayLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('protein_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${todayISO()}T00:00:00`)
      .lte('logged_at', `${todayISO()}T23:59:59`)
      .order('logged_at', { ascending: false });
    setLogs(data ?? []);
    setLoading(false);
  }, [user]);

  const fetchPastLogs = useCallback(async () => {
    if (!user) return;
    // All logs excluding today
    const { data } = await supabase
      .from('protein_logs')
      .select('*')
      .eq('user_id', user.id)
      .lt('logged_at', `${todayISO()}T00:00:00`)
      .order('logged_at', { ascending: false });
    setAllLogs(data ?? []);
  }, [user]);

  useEffect(() => { fetchTodayLogs(); }, [fetchTodayLogs]);
  useEffect(() => { if (showHistory) fetchPastLogs(); }, [showHistory, fetchPastLogs]);

  const totalToday = logs.reduce((sum, l) => sum + l.protein_grams, 0);
  const progress = Math.min(totalToday / (proteinGoal || 1), 1);

  const openModal = () => {
    setMealName('');
    setProteinGrams('');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!mealName.trim()) { setFormError('Meal name is required.'); return; }
    const grams = parseFloat(proteinGrams);
    if (isNaN(grams) || grams <= 0) { setFormError('Enter a valid protein amount.'); return; }
    setSaving(true);
    setFormError('');
    const { error } = await supabase.from('protein_logs').insert({
      user_id: user!.id,
      meal_name: mealName.trim(),
      protein_grams: grams,
      logged_at: new Date().toISOString(),
    });
    if (error) { setFormError(error.message); }
    else {
      setModalOpen(false);
      fetchTodayLogs();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from('protein_logs').delete().eq('id', id);
    setLogs(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  };

  // Group past logs by date
  const groupedPastLogs = useMemo(() => {
    const groups: Record<string, ProteinLog[]> = {};
    for (const log of allLogs) {
      const date = log.logged_at.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [allLogs]);

  return (
    <>
      <Card style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Flame color={OrangeColors.primary} size={20} />
            <Text style={styles.sectionTitle}>Protein Tracker</Text>
          </View>
          <Pressable style={styles.logBtn} onPress={openModal}>
            <Plus color={OrangeColors.primary} size={14} />
            <Text style={styles.logBtnText}>Log</Text>
          </Pressable>
        </View>

        {/* Progress */}
        {loading ? (
          <View style={styles.skeletonWrap}>
            <Skeleton height={36} width="50%" borderRadius={8} />
            <Skeleton height={10} width="100%" />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <Text style={styles.proteinAmount}>{totalToday}g</Text>
              <Text style={styles.proteinGoal}>/ {proteinGoal}g goal</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>{Math.round(progress * 100)}% of daily goal</Text>
          </>
        )}

        {/* Today's logs — always visible */}
        {!loading && (
          <View style={styles.todaySection}>
            <Text style={styles.todayLabel}>Today</Text>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No meals logged today.</Text>
            ) : (
              logs.map(entry => (
                <View key={entry.id} style={styles.mealRow}>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{entry.meal_name}</Text>
                    <Text style={styles.mealProtein}>{entry.protein_grams}g</Text>
                  </View>
                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                  >
                    {deletingId === entry.id
                      ? <ActivityIndicator size="small" color="#EF4444" />
                      : <Trash2 color="#EF4444" size={15} />
                    }
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        {/* History toggle */}
        <Pressable style={styles.showMore} onPress={() => setShowHistory(v => !v)}>
          {showHistory
            ? <ChevronUp color={OrangeColors.primary} size={16} />
            : <ChevronDown color={OrangeColors.primary} size={16} />
          }
          <Text style={styles.showMoreText}>{showHistory ? 'Hide history' : 'Show history'}</Text>
        </Pressable>

        {/* Past logs grouped by date — no delete allowed */}
        {showHistory && (
          <View style={styles.historyContainer}>
            {groupedPastLogs.length === 0 ? (
              <Text style={styles.emptyText}>No past meals.</Text>
            ) : (
              groupedPastLogs.map(([date, entries]) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateLabel}>{formatDateLabel(date)}</Text>
                  {entries.map(entry => (
                    <View key={entry.id} style={styles.mealRowHistory}>
                      <Text style={styles.mealName}>{entry.meal_name}</Text>
                      <Text style={styles.mealProtein}>{entry.protein_grams}g</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </Card>

      {/* Half-screen log modal */}
      <BottomSheetModal visible={modalOpen} onClose={() => setModalOpen(false)}>
        <ScrollView
          contentContainerStyle={styles.sheetBody}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sheetTitle}>Log Protein</Text>

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Text style={styles.fieldLabel}>Meal Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chicken Breast"
            placeholderTextColor="#666"
            value={mealName}
            onChangeText={setMealName}
            autoFocus
          />

          <Text style={styles.fieldLabel}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 35"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={proteinGrams}
            onChangeText={setProteinGrams}
          />

          <GradientButton label="Save Entry" onPress={handleSubmit} loading={saving} />
        </ScrollView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: OrangeColors.muted, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: OrangeColors.primary,
  },
  logBtnText: { color: OrangeColors.primary, fontWeight: '700', fontSize: 13 },
  skeletonWrap: { gap: 10, marginTop: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  proteinAmount: { fontSize: 40, fontWeight: '800', color: OrangeColors.primary },
  proteinGoal: { fontSize: 16, color: '#9A9A9A' },
  progressBg: { height: 10, backgroundColor: '#2A2A2A', borderRadius: 5, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: OrangeColors.primary, borderRadius: 5 },
  progressLabel: { color: '#9A9A9A', fontSize: 12, marginTop: 4 },
  // Today's section
  todaySection: { marginTop: Spacing.two, gap: 6 },
  todayLabel: {
    color: '#9A9A9A', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  mealRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, borderBottomWidth: 1, borderColor: '#2A2A2A',
  },
  mealInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealName: { color: '#fff', fontSize: 14, flex: 1 },
  mealProtein: { color: OrangeColors.light, fontSize: 14, fontWeight: '600', marginRight: 10 },
  deleteBtn: { padding: 4 },
  // History section
  showMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: Spacing.two },
  showMoreText: { color: OrangeColors.primary, fontSize: 13, fontWeight: '600' },
  historyContainer: { marginTop: Spacing.two, gap: Spacing.three },
  dateGroup: { gap: 6 },
  dateLabel: {
    color: '#9A9A9A', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  mealRowHistory: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderColor: '#2A2A2A',
  },
  emptyText: { color: '#666', fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  // Sheet styles
  sheetBody: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.four, gap: Spacing.two },
  sheetTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: Spacing.two },
  formError: {
    color: '#FF4444', fontSize: 13,
    backgroundColor: 'rgba(255,68,68,0.1)', padding: 10, borderRadius: 8,
  },
  fieldLabel: {
    color: '#9A9A9A', fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  input: {
    backgroundColor: '#262626', color: '#fff', borderRadius: 12,
    padding: Spacing.three, fontSize: 16, borderWidth: 1, borderColor: '#333',
    marginBottom: Spacing.two,
  },
});
