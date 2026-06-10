import { Redirect } from 'expo-router';
import { useState } from 'react';

import { LoginScreen } from '@/components/auth/login-screen';
import { SignupScreen } from '@/components/auth/signup-screen';
import { useAuth } from '@/context/auth-context';

export default function AuthPage() {
  const { session } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  if (session) return <Redirect href="/(tabs)" />;

  if (mode === 'login') return <LoginScreen onSwitch={() => setMode('signup')} />;
  return <SignupScreen onSwitch={() => setMode('login')} />;
}
