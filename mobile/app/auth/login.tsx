import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '../../src/stores/authStore';
import { C } from '../../src/constants/colors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace('/(tabs)');
    } catch {}
  };

  const handleBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return Alert.alert('Not supported', 'Biometric auth not available.');
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login to BARQ',
      fallbackLabel: 'Use password',
    });
    if (result.success) {
      // In real app: retrieve stored credentials from SecureStore
      await handleLogin();
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoArea}>
            <View style={s.logoBox}>
              <Text style={s.logoText}>⚡</Text>
            </View>
            <Text style={s.appName}>BARQ</Text>
            <Text style={s.tagline}>{t('tagline')}</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Text style={s.title}>{t('welcome')}</Text>

            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>{t('email')}</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(v) => { setEmail(v); clearError(); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                placeholderTextColor={C.muted}
                placeholder="you@example.com"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>{t('password')}</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(v) => { setPassword(v); clearError(); }}
                secureTextEntry
                autoComplete="password"
                placeholderTextColor={C.muted}
                placeholder="••••••••"
              />
            </View>

            <TouchableOpacity style={s.loginBtn} onPress={handleLogin} disabled={isLoading}>
              <Text style={s.loginBtnText}>{isLoading ? 'Loading...' : t('login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.biometricBtn} onPress={handleBiometric}>
              <Text style={s.biometricText}>🔒 {t('biometricLogin')}</Text>
            </TouchableOpacity>

            <View style={s.footer}>
              <Text style={{ color: C.muted, fontSize: 13 }}>{t('noAccount')} </Text>
              <TouchableOpacity onPress={() => router.push('/auth/register')}>
                <Text style={{ color: C.green, fontSize: 13, fontWeight: '700' }}>{t('signUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.void },
  container:     { flexGrow: 1, padding: 24, justifyContent: 'center', gap: 32 },
  logoArea:      { alignItems: 'center', gap: 8 },
  logoBox:       { width: 72, height: 72, borderRadius: 20, backgroundColor: C.greenDim, borderWidth: 1, borderColor: C.borderG, alignItems: 'center', justifyContent: 'center' },
  logoText:      { fontSize: 32 },
  appName:       { color: C.green, fontSize: 36, fontWeight: '900', letterSpacing: 4 },
  tagline:       { color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  form:          { gap: 16 },
  title:         { color: C.white, fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  inputGroup:    { gap: 6 },
  inputLabel:    { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  input:         { backgroundColor: C.card, borderRadius: 14, padding: 14, color: C.white, fontSize: 15, borderWidth: 1, borderColor: C.border },
  loginBtn:      { backgroundColor: C.green, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 4 },
  loginBtnText:  { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  biometricBtn:  { borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  biometricText: { color: C.ghost, fontSize: 13, fontWeight: '600' },
  footer:        { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  errorBox:      { backgroundColor: C.red + '15', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.red + '30' },
  errorText:     { color: C.red, fontSize: 13, fontWeight: '600' },
});
