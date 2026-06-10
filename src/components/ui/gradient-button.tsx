import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { OrangeColors } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'danger';
}

export function GradientButton({ label, onPress, disabled, loading, style, variant = 'primary' }: Props) {
  const colors: [string, string] =
    variant === 'danger'
      ? ['#FF4444', '#CC0000']
      : [OrangeColors.light, OrangeColors.dark];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.pressable, { opacity: pressed || disabled ? 0.7 : 1 }, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.label}>{label}</Text>
        }
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { borderRadius: 12 },
  gradient: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
