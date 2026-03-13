import { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { useTodayActivities, useStartActivity, useEndActivity } from '../../src/hooks/useData';
import { C } from '../../src/constants/colors';

function Ring({ value, max = 21, size = 96, stroke = 9, color = C.strain, children }: any) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const arc = (circ * 0.78) * Math.min(value / max, 1);
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

function fmt(s: number) {
  return `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

export default function StrainScreen() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, isRefetching } = useTodayActivities();
  const startMutation = useStartActivity();
  const endMutation   = useEndActivity();

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSession = data?.activeSession;

  useEffect(() => {
    if (activeSession) {
      const started = new Date(activeSession.startedAt).getTime();
      setElapsed(Math.round((Date.now() - started) / 1000));
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSession?.id]);

  const handleToggle = async () => {
    if (activeSession) {
      const calories = Math.round(elapsed * 0.25);
      await endMutation.mutateAsync({ id: activeSession.id, data: { caloriesBurned: calories, avgHrBpm: 125 } });
    } else {
      await startMutation.mutateAsync('walking');
    }
  };

  const totalStrain = data?.totalStrain ?? 0;
  const activities  = data?.sessions?.filter((s: any) => !s.isActive) ?? [];

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.strain} />}>

        <View style={{ paddingVertical: 8 }}>
          <Text style={s.screenLabel}>{t('strain').toUpperCase()}</Text>
          <Text style={s.screenTitle}>{t('strainTitle')}</Text>
        </View>

        {/* Strain Hero */}
        <View style={[s.card, { borderColor: C.strain + '20' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>{t('strainScore')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={s.heroScore}>{totalStrain.toFixed(1)}</Text>
                <Text style={{ color: C.strain, fontSize: 14, fontWeight: '700' }}>/21</Text>
              </View>
              <View style={[s.pill, { backgroundColor: C.strain + '18', borderColor: C.strain + '30', alignSelf: 'flex-start', marginTop: 6 }]}>
                <Text style={[s.pillText, { color: C.strain }]}>{t('moderate')}</Text>
              </View>
            </View>
            <Ring value={totalStrain} max={21} size={100} stroke={9} color={C.strain}>
              <Text style={{ color: C.white, fontSize: 22, fontWeight: '900' }}>{totalStrain.toFixed(1)}</Text>
              <Text style={{ color: C.muted, fontSize: 8, letterSpacing: 1 }}>BARQ</Text>
            </Ring>
          </View>
          {/* Zone bar */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', height: 7, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
              {[{c:'#4a9eff',p:15},{c:'#00d68f',p:25},{c:C.green,p:20},{c:'#ffaa00',p:25},{c:C.strain,p:15}]
                .map((z,i) => (
                  <View key={i} style={{ flex: z.p, backgroundColor: z.c, opacity: totalStrain > (i*4) ? 1 : 0.2 }} />
                ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ color: C.muted, fontSize: 9 }}>Rest</Text>
              <Text style={{ color: C.muted, fontSize: 9 }}>All Out</Text>
            </View>
          </View>
        </View>

        {/* Live Session */}
        <View style={[s.card, activeSession && { backgroundColor: '#180c07', borderColor: C.strain + '30' }]}>
          <Text style={s.label}>{t('liveActivity')}</Text>
          <Text style={[s.timer, { color: activeSession ? C.strain : C.muted }]}>{fmt(elapsed)}</Text>
          <Text style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginBottom: 14 }}>
            {activeSession ? t('pauseSession').replace('⏸  ','') : t('startNewActivity')}
          </Text>

          {activeSession && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Heart Rate', val: '128', unit: 'bpm' },
                { label: 'Calories',   val: String(Math.round(elapsed * 0.25)), unit: 'cal' },
                { label: 'Duration',   val: String(Math.floor(elapsed/60)), unit: 'min' },
              ].map(m => (
                <View key={m.label} style={{ flex: 1, backgroundColor: C.lift, borderRadius: 12, padding: 10, alignItems: 'center' }}>
                  <Text style={{ color: C.white, fontSize: 18, fontWeight: '800' }}>{m.val}</Text>
                  <Text style={{ color: C.muted, fontSize: 9, textTransform: 'uppercase' }}>{m.unit}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: activeSession ? C.strain : C.green }]}
            onPress={handleToggle}
            disabled={startMutation.isPending || endMutation.isPending}>
            <Text style={[s.ctaBtnText, { color: activeSession ? C.white : '#000' }]}>
              {activeSession ? t('pauseSession') : t('startActivity')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Activities */}
        {activities.length > 0 && (
          <>
            <Text style={s.sectionLabel}>{t('todayActivities')}</Text>
            {activities.map((a: any) => (
              <View key={a.id} style={[s.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View>
                  <Text style={{ color: C.white, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>
                    {a.activityType.charAt(0).toUpperCase() + a.activityType.slice(1)}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 11 }}>
                    ⏱ {a.durationMinutes}m  🔥 {a.caloriesBurned ?? '--'} cal
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: C.strain, fontSize: 22, fontWeight: '900' }}>
                    {a.strainPoints?.toFixed(1) ?? '--'}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 9 }}>STRAIN</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.void },
  card:        { backgroundColor: C.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.border },
  screenLabel: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  screenTitle: { color: C.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  label:       { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  sectionLabel:{ color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  heroScore:   { color: C.white, fontSize: 50, fontWeight: '900', letterSpacing: -2, lineHeight: 52 },
  timer:       { fontSize: 42, fontWeight: '900', fontVariant: ['tabular-nums'], textAlign: 'center', letterSpacing: 2, marginBottom: 6 },
  pill:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  pillText:    { fontSize: 10, fontWeight: '700' },
  ctaBtn:      { borderRadius: 14, padding: 13, alignItems: 'center' },
  ctaBtnText:  { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});
