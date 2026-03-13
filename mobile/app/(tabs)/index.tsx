import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { useWellnessToday } from '../../src/hooks/useData';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { C } from '../../src/constants/colors';

// ─── Ring Component ───────────────────────────────────────────────────
function Ring({ value, size = 130, stroke = 10, color = C.green, children }: {
  value: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode;
}) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const arc  = (circ - circ * 0.22) * Math.min(value / 100, 1);
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '126deg' }] }}>
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.dim} strokeWidth={stroke}
          strokeDasharray={`${circ * 0.78} ${circ}`} strokeLinecap="round" />
        <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Mini Arc ─────────────────────────────────────────────────────────
function MiniArc({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const stroke = 5;
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const arc  = (circ * 0.78) * Math.min(value / 100, 1);
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '126deg' }] }}>
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.dim} strokeWidth={stroke}
        strokeDasharray={`${circ * 0.78} ${circ}`} strokeLinecap="round" />
      <Circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────
function WeekBars({ scores, days }: { scores: number[]; days: string[] }) {
  const max = Math.max(...scores, 1);
  return (
    <View style={{ flexDirection: 'row', gap: 5, height: 52, alignItems: 'flex-end' }}>
      {scores.map((v, i) => {
        const isToday = i === scores.length - 1;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={[s.bar, {
              height: (v / max) * 44,
              backgroundColor: isToday ? C.green : C.lift,
            }]} />
            <Text style={[s.barLabel, { color: isToday ? C.green : C.muted }]}>
              {days[i] || ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── SCREEN ───────────────────────────────────────────────────────────
export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuthStore();
  const { isRTL } = useSettingsStore();
  const { data, isLoading, refetch, isRefetching } = useWellnessToday();

  const wellness = data?.today;
  const history  = data?.history ?? [];
  const weeklyAvg = data?.weeklyAvg ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  const displayName = isAr ? (user?.fullNameAr || user?.fullName) : user?.fullName;

  const scoreColor = (s: number) => s >= 80 ? C.green : s >= 60 ? C.green : s >= 40 ? C.strain : C.red;
  const scoreLabel = (s: number) => s >= 80 ? t('optimal') : s >= 60 ? t('good') : s >= 40 ? t('moderate') : t('poor');

  const barScores = history.map((h: any) => h.overallScore);
  const barDays   = (t('days', { returnObjects: true }) as string[]) || [];

  if (isLoading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.green, fontSize: 16 }}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.green} />}
      >
        {/* Header */}
        <View style={[s.header, isRTL && { flexDirection: 'row-reverse' }]}>
          <View>
            <Text style={s.headerDate}>{new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            <Text style={s.headerName}>{greeting} {displayName} 👋</Text>
            <Text style={s.tagline}>{t('tagline')}</Text>
          </View>
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>{t('synced')}</Text>
          </View>
        </View>

        {/* Wellness Hero Card */}
        <View style={[s.card, { borderColor: C.borderG }]}>
          <View style={[s.row, { gap: 16 }, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{t('wellnessScore')}</Text>
              <View style={s.row}>
                <Text style={s.heroScore}>{wellness?.overallScore ?? '--'}</Text>
                <Text style={{ color: scoreColor(wellness?.overallScore ?? 0), fontSize: 14, fontWeight: '700', alignSelf: 'flex-end', marginBottom: 8 }}>/100</Text>
              </View>
              <View style={s.row}>
                <View style={[s.pill, { backgroundColor: scoreColor(wellness?.overallScore ?? 0) + '20', borderColor: scoreColor(wellness?.overallScore ?? 0) + '40' }]}>
                  <Text style={[s.pillText, { color: scoreColor(wellness?.overallScore ?? 0) }]}>
                    {scoreLabel(wellness?.overallScore ?? 0)}
                  </Text>
                </View>
              </View>
            </View>
            <Ring value={wellness?.overallScore ?? 0} size={100} stroke={9} color={scoreColor(wellness?.overallScore ?? 0)}>
              <Text style={{ color: C.white, fontSize: 26, fontWeight: '900' }}>{wellness?.overallScore ?? '--'}</Text>
              <Text style={{ color: C.muted, fontSize: 9, letterSpacing: 1 }}>BARQ</Text>
            </Ring>
          </View>
          {/* Insight */}
          {wellness?.recommendation && (
            <View style={s.insightBox}>
              <Text style={s.insightText}>⚡ {wellness.recommendation}</Text>
            </View>
          )}
        </View>

        {/* 3 Pillars */}
        <View style={[s.row, { gap: 10 }]}>
          {[
            { key: 'recovery', val: wellness?.recoveryScore ?? 0,  color: C.green,  icon: '⚡', label: t('recovery') },
            { key: 'strain',   val: Math.round((wellness?.strainScore ?? 0) / 21 * 100), color: C.strain, icon: '🔥', label: t('strain') },
            { key: 'sleep',    val: wellness?.sleepScore ?? 0, color: C.sleep,  icon: '🌙', label: t('sleep') },
          ].map((p) => (
            <View key={p.key} style={[s.card, s.pillarCard, { borderColor: p.color + '20' }]}>
              <MiniArc value={p.val} color={p.color} />
              <Text style={s.pillarScore}>{p.val}</Text>
              <Text style={s.pillarLabel}>{p.label}</Text>
              <View style={[s.pill, { backgroundColor: p.color + '18', borderColor: p.color + '30' }]}>
                <Text style={[s.pillText, { color: p.color }]}>{scoreLabel(p.val)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 7-Day Chart */}
        <View style={s.card}>
          <Text style={s.label}>{t('weeklyWellness')}</Text>
          {barScores.length > 0 && <WeekBars scores={barScores} days={barDays} />}
          <View style={[s.row, { marginTop: 10, justifyContent: 'space-between' }]}>
            <Text style={s.muted}>{t('weeklyAvg')}</Text>
            <Text style={{ color: C.white, fontSize: 12, fontWeight: '700' }}>
              {weeklyAvg} <Text style={{ color: C.green }}>↑</Text>
            </Text>
          </View>
        </View>

        {/* Recommended */}
        <View style={[s.card, { backgroundColor: '#0a120a', borderColor: C.borderG }]}>
          <Text style={s.label}>{t('recommended')}</Text>
          <Text style={{ color: C.white, fontSize: 14, fontWeight: '700', marginBottom: 12, lineHeight: 20 }}>
            {wellness?.recommendation || t('loading')}
          </Text>
          <TouchableOpacity style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>{t('logActivity')} →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.void },
  card:        { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },
  row:         { flexDirection: 'row', alignItems: 'center' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  headerDate:  { color: C.muted, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  headerName:  { color: C.white, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  tagline:     { color: C.green, fontSize: 11, fontWeight: '600', marginTop: 4 },
  liveChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.greenDim, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.borderG },
  liveDot:     { width: 5, height: 5, borderRadius: 3, backgroundColor: C.green },
  liveText:    { color: C.green, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  label:       { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  muted:       { color: C.muted, fontSize: 11 },
  heroScore:   { color: C.white, fontSize: 56, fontWeight: '900', letterSpacing: -2, lineHeight: 60 },
  pill:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  pillText:    { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  insightBox:  { backgroundColor: C.greenDim, borderRadius: 12, padding: 12, marginTop: 14, borderWidth: 1, borderColor: C.borderG },
  insightText: { color: C.white, fontSize: 12, lineHeight: 18 },
  pillarCard:  { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 8 },
  pillarScore: { color: C.white, fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  pillarLabel: { color: C.muted, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  bar:         { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel:    { fontSize: 8, fontWeight: '700' },
  ctaBtn:      { backgroundColor: C.green, borderRadius: 12, padding: 12, alignItems: 'center' },
  ctaBtnText:  { color: '#000', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});
