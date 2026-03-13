import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';
import { useAuthStore } from '../src/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppInit() {
  const { isLoggedIn, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser().then(() => {
      const { isLoggedIn } = useAuthStore.getState();
      if (!isLoggedIn) router.replace('/auth/login');
    });
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style="light" backgroundColor="#040406" />
            <AppInit />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#040406' } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="auth/login"    options={{ animation: 'fade' }} />
              <Stack.Screen name="auth/register" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
