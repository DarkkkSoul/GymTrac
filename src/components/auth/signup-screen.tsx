import { Dumbbell, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/ui/gradient-button';
import { OrangeColors, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface Props {
  onSwitch: () => void;
}

export function SignupScreen({ onSwitch }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.inner}>
          <View style={styles.logoRow}>
            <Dumbbell color={OrangeColors.primary} size={48} />
          </View>
          <Text style={styles.title}>GymTrac</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.inputWrapper}>
            <Mail color="#666" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock color="#666" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <GradientButton label="Create Account" onPress={handleSignup} loading={loading} style={styles.btn} />

          <Pressable onPress={onSwitch}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchLink}>Log In</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.four, gap: Spacing.three },
  logoRow: { alignItems: 'center' },
  title: { fontSize: 38, fontWeight: '800', color: OrangeColors.primary, textAlign: 'center' },
  subtitle: { fontSize: 17, color: '#9A9A9A', textAlign: 'center' },
  error: {
    color: '#FF4444', fontSize: 14, textAlign: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)', padding: Spacing.two, borderRadius: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: Spacing.three },
  btn: { marginTop: Spacing.one },
  switchText: { color: '#9A9A9A', textAlign: 'center', fontSize: 14 },
  switchLink: { color: OrangeColors.primary, fontWeight: '600' },
});
