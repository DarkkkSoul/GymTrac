import { useFocusEffect } from 'expo-router';
import { Dumbbell, Edit2, LogOut, Trophy, User, X, XCircle, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Skeleton } from '@/components/ui/skeleton';
import { OrangeColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editProteinGoal, setEditProteinGoal] = useState('');

  const [gymDaysThisMonth, setGymDaysThisMonth] = useState<number | null>(null);
  const [missedDaysThisMonth, setMissedDaysThisMonth] = useState<number | null>(null);
  const [avgProteinThisWeek, setAvgProteinThisWeek] = useState<number | null>(null);
  const [totalWorkoutsThisMonth, setTotalWorkoutsThisMonth] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    setProfile(data);
    setLoading(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [gymRes, missedRes, workoutsRes, proteinRes] = await Promise.all([
      supabase
        .from('gym_attendance').select('date')
        .eq('user_id', user.id).eq('attended', true)
        .gte('date', firstOfMonth).lte('date', lastOfMonth),
      supabase
        .from('gym_attendance').select('date')
        .eq('user_id', user.id).eq('attended', false)
        .gte('date', firstOfMonth).lte('date', lastOfMonth),
      supabase
        .from('workouts').select('id')
        .eq('user_id', user.id)
        .gte('logged_at', `${firstOfMonth}T00:00:00`)
        .lte('logged_at', `${lastOfMonth}T23:59:59`),
      supabase
        .from('protein_logs').select('protein_grams, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    ]);

    setGymDaysThisMonth(gymRes.data?.length ?? 0);
    setMissedDaysThisMonth(missedRes.data?.length ?? 0);
    setTotalWorkoutsThisMonth(workoutsRes.data?.length ?? 0);

    const proteinData = proteinRes.data ?? [];
    if (proteinData.length > 0) {
      const byDay: Record<string, number> = {};
      for (const log of proteinData) {
        const day = log.logged_at.split('T')[0];
        byDay[day] = (byDay[day] ?? 0) + log.protein_grams;
      }
      const days = Object.keys(byDay);
      setAvgProteinThisWeek(Math.round(days.reduce((s, d) => s + byDay[d], 0) / days.length));
    } else {
      setAvgProteinThisWeek(0);
    }
  }, [user]);

  // Re-fetch every time this tab is focused so data is always fresh
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchStats();
    }, [fetchProfile, fetchStats])
  );

  const startEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditAge(String(profile.age));
    setEditWeight(String(profile.weight));
    setEditProteinGoal(String(profile.protein_goal));
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setError(''); };

  const saveEdit = async () => {
    if (!editName.trim()) { setError('Name is required.'); return; }
    const age = parseInt(editAge);
    const weight = parseFloat(editWeight);
    const protein = parseInt(editProteinGoal);
    if (isNaN(age) || isNaN(weight) || isNaN(protein)) {
      setError('Age, weight, and protein goal must be numbers.');
      return;
    }
    setSaving(true);
    setError('');
    const { error } = await supabase
      .from('profiles')
      .update({ name: editName.trim(), age, weight, protein_goal: protein })
      .eq('user_id', user!.id);
    if (error) {
      setError(error.message);
    } else {
      setEditing(false);
      fetchProfile();
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <View style={styles.pageHeader}>
            <View style={styles.pageTitleRow}>
              <User color={OrangeColors.primary} size={26} />
              <Text style={styles.pageTitle}>Profile</Text>
            </View>
            {!editing && (
              <Pressable style={styles.editBtn} onPress={startEdit}>
                <Edit2 color={OrangeColors.primary} size={15} />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            )}
          </View>

          {loading ? (
            <Card style={styles.skeletonCard}>
              <Skeleton height={20} width="50%" />
              <Skeleton height={16} width="70%" />
              <Skeleton height={16} width="60%" />
              <Skeleton height={16} width="65%" />
            </Card>
          ) : editing ? (
            <Card>
              <Text style={styles.cardTitle}>Edit Profile</Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {[
                { label: 'Name', value: editName, setter: setEditName, keyboard: 'default' },
                { label: 'Age', value: editAge, setter: setEditAge, keyboard: 'numeric' },
                { label: 'Weight (kg)', value: editWeight, setter: setEditWeight, keyboard: 'decimal-pad' },
                { label: 'Daily Protein Goal (g)', value: editProteinGoal, setter: setEditProteinGoal, keyboard: 'numeric' },
              ].map(field => (
                <View key={field.label} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.setter}
                    keyboardType={field.keyboard as any}
                    placeholderTextColor="#666"
                  />
                </View>
              ))}
              <View style={styles.editActions}>
                <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
                  <X color="#fff" size={16} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <GradientButton label="Save" onPress={saveEdit} loading={saving} style={styles.saveBtn} />
              </View>
            </Card>
          ) : (
            <Card>
              <View style={styles.avatarRow}>
                <View style={styles.avatar}>
                  <User color={OrangeColors.primary} size={32} />
                </View>
                <View style={styles.avatarInfo}>
                  <Text style={styles.profileName}>{profile?.name}</Text>
                  <Text style={styles.profileEmail}>{user?.email}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              {[
                { label: 'Age', value: `${profile?.age} years` },
                { label: 'Weight', value: `${profile?.weight} kg` },
                { label: 'Daily Protein Goal', value: `${profile?.protein_goal}g` },
              ].map(item => (
                <View key={item.label} style={styles.statRow}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Stats — 2 rows of 2 to fit 4 boxes comfortably */}
          <Card>
            <Text style={styles.cardTitle}>Monthly Stats</Text>
            <View style={styles.statsGrid}>
              <StatBox
                label="Gym Days"
                sublabel="this month"
                value={gymDaysThisMonth}
                icon={<Trophy color={OrangeColors.primary} size={20} />}
              />
              <StatBox
                label="Days Missed"
                sublabel="this month"
                value={missedDaysThisMonth}
                icon={<XCircle color="#EF4444" size={20} />}
                valueColor="#EF4444"
              />
            </View>
            <View style={[styles.statsGrid, { marginTop: Spacing.two }]}>
              <StatBox
                label="Avg Protein"
                sublabel="this week"
                value={avgProteinThisWeek !== null ? `${avgProteinThisWeek}g` : null}
                icon={<Zap color={OrangeColors.primary} size={20} />}
              />
              <StatBox
                label="Workouts"
                sublabel="this month"
                value={totalWorkoutsThisMonth}
                icon={<Dumbbell color={OrangeColors.primary} size={20} />}
              />
            </View>
          </Card>

          <Pressable style={styles.logoutBtn} onPress={signOut}>
            <LogOut color="#FF4444" size={18} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatBox({
  label, sublabel, value, icon, valueColor,
}: {
  label: string;
  sublabel: string;
  value: string | number | null;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <View style={statStyles.box}>
      {icon}
      {value === null
        ? <ActivityIndicator color={OrangeColors.primary} size="small" />
        : <Text style={[statStyles.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
      }
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.sublabel}>{sublabel}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, backgroundColor: '#262626', borderRadius: 12, padding: 12, alignItems: 'center', gap: 3 },
  value: { color: OrangeColors.primary, fontSize: 22, fontWeight: '800' },
  label: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  sublabel: { color: '#666', fontSize: 11, textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageTitle: { color: '#fff', fontSize: 30, fontWeight: '800' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: OrangeColors.muted, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: OrangeColors.primary,
  },
  editBtnText: { color: OrangeColors.primary, fontSize: 13, fontWeight: '600' },
  skeletonCard: { gap: 10 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: Spacing.two },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatarInfo: { flex: 1 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: OrangeColors.muted, borderWidth: 2, borderColor: OrangeColors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileEmail: { color: '#9A9A9A', fontSize: 13, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#2A2A2A', marginVertical: Spacing.two },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#2A2A2A' },
  statLabel: { color: '#9A9A9A', fontSize: 14 },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: Spacing.two },
  field: { gap: 6, marginBottom: Spacing.two },
  fieldLabel: { color: '#9A9A9A', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#262626', color: '#fff', borderRadius: 10,
    padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#333',
  },
  error: { color: '#FF4444', fontSize: 13, marginBottom: Spacing.two },
  editActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#262626', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#333',
  },
  cancelBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  saveBtn: { flex: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,68,68,0.1)', borderRadius: 12, padding: Spacing.three,
    borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)',
  },
  logoutText: { color: '#FF4444', fontSize: 16, fontWeight: '600' },
});
