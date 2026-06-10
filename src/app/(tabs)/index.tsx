import { useFocusEffect } from 'expo-router';
import { Hand } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingScreen } from '@/components/auth/onboarding-screen';
import { GymAttendanceTracker } from '@/components/home/gym-attendance';
import { ProteinTracker } from '@/components/home/protein-tracker';
import { Skeleton } from '@/components/ui/skeleton';
import { OrangeColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoadingProfile(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (!data) {
      setNeedsOnboarding(true);
    } else {
      setProfile(data);
      setNeedsOnboarding(false);
    }
    setLoadingProfile(false);
  }, [user]);

  // Re-fetch profile every time this tab comes into focus
  // so edits made in the Profile tab are reflected immediately.
  // Must be a sync callback wrapping the async call — per expo-router docs.
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  if (needsOnboarding) {
    return <OnboardingScreen onComplete={fetchProfile} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {loadingProfile ? (
            <Skeleton width={200} height={34} borderRadius={8} />
          ) : (
            <View style={styles.greetingRow}>
              <Hand color={OrangeColors.primary} size={28} />
              <Text style={styles.greeting}>
                Hey {profile?.name?.split(' ')[0]}
              </Text>
            </View>
          )}
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {loadingProfile ? (
          <Skeleton height={120} borderRadius={16} />
        ) : (
          <ProteinTracker proteinGoal={profile?.protein_goal ?? 150} />
        )}

        <GymAttendanceTracker />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  header: { gap: 6 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { color: '#fff', fontSize: 30, fontWeight: '800' },
  date: { color: '#9A9A9A', fontSize: 14 },
});
