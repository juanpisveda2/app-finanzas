import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initDb } from '../data/db/sqlite';
import { useSettingsStore } from '../state/settingsStore';
import { AppThemeProvider } from '../ui/theme/AppThemeProvider';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { load, loading, pinVerified } = useSettingsStore();

  useEffect(() => {
    void initDb();
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) {
      return;
    }
    const inAuth = segments[0] === '(auth)';
    if (!pinVerified && !inAuth) {
      router.replace('/(auth)/pin');
      return;
    }
    if (pinVerified && inAuth) {
      router.replace('/(drawer)/(tabs)/dashboard');
    }
  }, [loading, pinVerified, router, segments]);

  if (loading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
