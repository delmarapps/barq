import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useGoals, useNotifications } from '../../src/hooks/useData';
import { C } from '../../src/constants/colors';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useSettingsStore();
  const { data: goalsData } = useGoals();
  const { data: notifsData } = useNotifications();
  const isAr = language === 'ar';

  const displayName = isAr ? (user?.fullNameAr || user?.fullName) : user?.fullName;
  const initial = displayName?.[0]?.toUpperCase() ?? 'A';

  const unread = notifsData?.unread ?? 0;
  const activeGoals = goalsData?.length ?? 0;

  const handleLogout = () => {
    Alert.alert(t('logout'), 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/auth/login');
      }},
    ]);
  };

  const stats = [
    { label: t('memberSince'), val: user ? new Date().getFullYear().toString() : '--' },
    { label: t('band'),        val: 'BARQ Pro' },
    { label: t('avgRecovery'), val: '71%' },
    { label: t('avgSleep'),    val: '7h 18m' },
    { label: t('streak'),      val: '12 🔥' },
    { label: t('workouts'),    val: '38' },
  ];

  const settingItems = [
    { icon: '⌚', label: t('connectedDevice'), val: 'BARQ Pro S2', color: C.green },
    { icon: '🎯', label: t('goals'),           val: `${activeGoals} active`, color: C.ghost },
    { icon: '🔔', label: t('notifications'),   val: unread > 0 ? `${unread} unread` : t('on'), color: C.ghost },
    { icon: '🔒', label: t('privacy'),         val: '',           color: C.ghost },
    { icon: '❓', label: t('support'),          val: '',           color: C.ghost },
  ];

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}>

        {/* Identity Card */}
        <View style={[s.card, { gap: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{displayName}</Text>
              <Text style={s.email}>{user?.email}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <View style={[s.pill, { backgroundColor: C.green + '18', borderColor: C.green + '40' }]}>
                  <Text style={[s.pillText, { color: C.green }]}>{t('proMember')}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {stats.map(st => (
              <View key={st.label} style={s.statChip}>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Language Toggle */}
        <View style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 18, width: 28, textAlign: 'center' }}>🌐</Text>
            <Text style={{ color: C.white, fontSize: 14 }}>{t('language')}</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: C.lift, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: C.border }}>
            {(['en', 'ar'] as const).map(l => (
              <TouchableOpacity key={l} onPress={() => setLanguage(l)}
                style={[s.langBtn, language === l && { backgroundColor: C.green }]}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: language === l ? '#000' : C.muted }}>
                  {l.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <Text style={s.sectionLabel}>{t('account')}</Text>
        <View style={{ gap: 2 }}>
          {settingItems.map((item, i) => (
            <TouchableOpacity key={item.label} style={[s.settingRow,
              i === 0 && { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
              i === settingItems.length - 1 && { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.icon}</Text>
                <Text style={{ color: C.white, fontSize: 14 }}>{item.label}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.val ? <Text style={{ color: item.color, fontSize: 12 }}>{item.val}</Text> : null}
                <Text style={{ color: C.muted, fontSize: 16 }}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>⬡ {t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.void },
  card:        { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },
  avatar:      { width: 60, height: 60, borderRadius: 30, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:{ fontSize: 24, fontWeight: '900', color: '#000' },
  name:        { color: C.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  email:       { color: C.muted, fontSize: 12, marginTop: 2 },
  pill:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  pillText:    { fontSize: 10, fontWeight: '700' },
  statChip:    { backgroundColor: C.lift, borderRadius: 12, padding: 10, alignItems: 'center', width: '30%' },
  statVal:     { color: C.white, fontSize: 13, fontWeight: '800', marginBottom: 2 },
  statLabel:   { color: C.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  sectionLabel:{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  settingRow:  { backgroundColor: C.card, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 1 },
  langBtn:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  logoutBtn:   { borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.red + '40', backgroundColor: C.red + '10' },
  logoutText:  { color: C.red, fontSize: 14, fontWeight: '700' },
});
