import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { useLatestRecovery, useRecoveryHistory } from '../../src/hooks/useData';
import { C } from '../../src/constants/colors';

function Ring({ value, size = 156, stroke = 11, color = C.green, children }: any) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const arc = (circ * 0.78) * Math.min(value / 100, 1);
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

export default function RecoveryScreen() {
  const { t } = useTranslation();
  const { data: latest, isLoading, refetch, isRefetching } = useLatestRecovery();
  const { data: histData } = useRecoveryHistory(7);

  const score   = latest?.recoveryScore ?? 0;
  const history = histData?.metrics ?? [];
  const trendScores = history.map((m: any) => m.recoveryScore);

  const metrics = [
    { label: t('hrv'),        val: latest?.hrvMs?.toFixed(1) ?? '--', unit: 'ms',  vs: latest?.avg30DayHrv, better: 'higher' },
    { label: t('rhr'),        val: latest?.restingHrBpm ?? '--',      unit: 'bpm', vs: latest?.avg30DayRhr, better: 'lower' },
    { label: t('bloodOxygen'),val: latest?.bloodOxygenPct?.toFixed(0) ?? '--', unit: '%', vs: null, better: 'higher' },
    { label: t('skinTemp'),   val: latest?.skinTempDeviation != null ? `${latest.skinTempDeviation >= 0 ? '+' : ''}${latest.skinTempDeviation.toFixed(1)}` : '--', unit: '°C', vs: null, better: null },
  ];

  if (isLoading) return (
    <SafeAreaView style={s.root}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.green }}>{t('loading')}</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.green} />}>

        <View style={{ paddingVertical: 8 }}>
          <Text style={s.screenLabel}>{t('recovery').toUpperCase()}</Text>
          <Text style={s.screenTitle}>{t('recoveryTitle')}</Text>
        </View>

        {/* Main Ring */}
        <View style={[s.card, { borderColor: C.borderG, alignItems: 'center', gap: 16, paddingVertical: 28 }]}>
          <Ring value={score} size={160} stroke={12} color={score >= 70 ? C.green : score >= 50 ? C.strain : C.red}>
            <Text style={{ color: C.white, fontSize: 44, fontWeight: '900', letterSpacing: -2 }}>{score}</Text>
            <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{t('recovery')}</Text>
          </Ring>
          <View style={[s.insightBox, { width: '100%' }]}>
            <Text style={s.insightText}>⚡ {
              score >= 70 ? t('pushHard') :
              score >= 50 ? t('moderateSession') :
              score >= 30 ? t('lightActivity') : t('restDay')
            }</Text>
          </View>
        </View>

        {/* 7-Day Trend */}
        {trendScores.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>{t('recoveryTrend')}</Text>
            <View style={{ flexDirection: 'row', gap: 5, height: 60, alignItems: 'flex-end', marginTop: 8 }}>
              {trendScores.map((v: number, i: number) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={[s.bar, { height: (v / 100) * 52, backgroundColor: i === trendScores.length - 1 ? C.green : C.greenD + '55' }]} />
                  <Text style={{ color: C.muted, fontSize: 8 }}>{i + 1}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recovery Signals */}
        <Text style={s.sectionLabel}>{t('recoverySignals')}</Text>
        {metrics.map(m => {
          let trendText = '';
          let trendColor = C.muted;
          if (m.vs && m.better) {
            const diff = Number(m.val) - Number(m.vs);
            const pct  = Math.abs(diff / Number(m.vs) * 100).toFixed(0);
            if (m.better === 'higher') {
              trendText  = diff >= 0 ? `↑ +${pct}%` : `↓ ${pct}%`;
              trendColor = diff >= 0 ? C.green : C.red;
            } else {
              trendText  = diff <= 0 ? `↓ ${pct}%` : `↑ +${pct}%`;
              trendColor = diff <= 0 ? C.green : C.red;
            }
          }
          return (
            <View key={m.label} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View>
                <Text style={s.label}>{m.label}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={s.metricVal}>{m.val}</Text>
                  <Text style={s.metricUnit}>{m.unit}</Text>
                </View>
              </View>
              {trendText ? (
                <View style={[s.pill, { backgroundColor: trendColor + '18', borderColor: trendColor + '40' }]}>
                  <Text style={[s.pillText, { color: trendColor }]}>{trendText}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.void },
  card:         { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },
  screenLabel:  { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  screenTitle:  { color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  label:        { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  sectionLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  insightBox:   { backgroundColor: C.greenDim, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.borderG },
  insightText:  { color: C.white, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  bar:          { width: '100%', borderRadius: 4, minHeight: 4 },
  metricVal:    { color: C.white, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  metricUnit:   { color: C.muted, fontSize: 12 },
  pill:         { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  pillText:     { fontSize: 10, fontWeight: '700' },
});
