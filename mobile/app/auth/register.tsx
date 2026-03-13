import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { C } from '../../src/constants/colors';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [fullName,    setFullName]    = useState('');
  const [fullNameAr,  setFullNameAr]  = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) return;
    try {
      await register({ fullName, fullNameAr, email: email.trim().toLowerCase(), password });
      router.replace('/(tabs)');
    } catch {}
  };

  const fields = [
    { label: 'Full Name (EN)',  val: fullName,   set: setFullName,   kType: 'default',       secure: false, ph: 'Ahmed Mohamed' },
    { label: 'Full Name (AR)',  val: fullNameAr, set: setFullNameAr, kType: 'default',       secure: false, ph: 'أحمد محمد' },
    { label: t('email'),        val: email,      set: setEmail,      kType: 'email-address', secure: false, ph: 'you@example.com' },
    { label: t('password'),     val: password,   set: setPassword,   kType: 'default',       secure: true,  ph: 'Min. 8 characters' },
  ];

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Text style={{ color: C.green, fontSize: 16 }}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={s.title}>{t('register')}</Text>
            <Text style={{ color: C.muted, fontSize: 13 }}>Create your BARQ account</Text>
          </View>

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <View style={{ gap: 14 }}>
            {fields.map(f => (
              <View key={f.label} style={s.inputGroup}>
                <Text style={s.inputLabel}>{f.label}</Text>
                <TextInput
                  style={s.input}
                  value={f.val}
                  onChangeText={(v) => { f.set(v); clearError(); }}
                  keyboardType={f.kType as any}
                  autoCapitalize={f.kType === 'email-address' ? 'none' : 'words'}
                  secureTextEntry={f.secure}
                  placeholderTextColor={C.muted}
                  placeholder={f.ph}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={isLoading}>
            <Text style={s.btnText}>{isLoading ? 'Creating account...' : t('register')}</Text>
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={{ color: C.muted, fontSize: 13 }}>{t('hasAccount')} </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: C.green, fontSize: 13, fontWeight: '700' }}>{t('login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.void },
  container:  { flexGrow: 1, padding: 24, gap: 20 },
  header:     { gap: 6, marginBottom: 4 },
  backBtn:    { marginBottom: 8 },
  title:      { color: C.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  inputGroup: { gap: 6 },
  inputLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  input:      { backgroundColor: C.card, borderRadius: 14, padding: 14, color: C.white, fontSize: 15, borderWidth: 1, borderColor: C.border },
  btn:        { backgroundColor: C.green, borderRadius: 14, padding: 15, alignItems: 'center' },
  btnText:    { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  footer:     { flexDirection: 'row', justifyContent: 'center' },
  errorBox:   { backgroundColor: C.red + '15', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.red + '30' },
  errorText:  { color: C.red, fontSize: 13, fontWeight: '600' },
});
