import { Dumbbell } from 'lucide-react-native';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/ui/gradient-button';
import { OrangeColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name || !age || !weight || !proteinGoal) { setError('Please fill in all fields.'); return; }
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const proteinNum = parseInt(proteinGoal);
    if (isNaN(ageNum) || isNaN(weightNum) || isNaN(proteinNum)) {
      setError('Age, weight, and protein goal must be numbers.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.from('profiles').insert({
      user_id: user!.id,
      name,
      age: ageNum,
      weight: weightNum,
      protein_goal: proteinNum,
    });
    if (error) { setError(error.message); }
    else { onComplete(); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.iconRow}>
            <Dumbbell color={OrangeColors.primary} size={52} />
          </View>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>Personalise your GymTrac experience</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {[
            { label: 'Your Name', placeholder: 'e.g. Alex', value: name, setter: setName, keyboard: 'default' },
            { label: 'Age', placeholder: 'e.g. 25', value: age, setter: setAge, keyboard: 'numeric' },
            { label: 'Weight (kg)', placeholder: 'e.g. 75', value: weight, setter: setWeight, keyboard: 'decimal-pad' },
            { label: 'Daily Protein Goal (g)', placeholder: 'e.g. 160', value: proteinGoal, setter: setProteinGoal, keyboard: 'numeric' },
          ].map(field => (
            <View key={field.label} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor="#666"
                keyboardType={field.keyboard as any}
                value={field.value}
                onChangeText={field.setter}
              />
            </View>
          ))}

          <GradientButton label="Get Started" onPress={handleSubmit} loading={loading} style={styles.btn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D0D' },
  flex: { flex: 1 },
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  iconRow: { alignItems: 'center', marginTop: Spacing.four },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9A9A9A', textAlign: 'center' },
  error: {
    color: '#FF4444', fontSize: 14, textAlign: 'center',
    backgroundColor: 'rgba(255,68,68,0.1)', padding: Spacing.two, borderRadius: 8,
  },
  field: { gap: 8 },
  label: { color: '#9A9A9A', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1A1A1A', color: '#fff', borderRadius: 12,
    padding: Spacing.three, fontSize: 16, borderWidth: 1, borderColor: '#2A2A2A',
  },
  btn: { marginTop: Spacing.two },
});
