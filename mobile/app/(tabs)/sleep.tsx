import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import { useLastNightSleep } from '../../src/hooks/useData';
import { C } from '../../src/constants/colors';
import { format } from 'date-fns';

function Ring({ value, size = 100, stroke = 9, color = C.sleep, children }: any) {
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

function SleepStageBar({ session }: { session: any }) {
  const total = session.totalMinutes || 1;
  const stages = [
    { label: 'Awake', mins: session.awakeMinutes, color: C.lift },
    { label: 'Light', mins: session.lightMinutes, color: C.sleep + '55' },
    { label: 'Deep',  mins: session.deepMinutes,  color: C.sleep },
    { label: 'REM',   mins: session.remMinutes,   color: C.green + 'aa' },
  ];
  return (
    <View>
      <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 1, marginBottom: 12 }}>
        {stages.map((st, i) => (
          <View key={i} style={{ flex: st.mins / total, backgroundColor: st.color,
            borderTopLeftRadius: i===0?5:0, borderBottomLeftRadius: i===0?5:0,
            borderTopRightRadius: i===stages.length-1?5:0, borderBottomRightRadius: i===stages.length-1?5:0 }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {stages.map(st => (
          <View key={st.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: st.color }} />
            <Text style={{ color: C.muted, fontSize: 10 }}>{st.label} </Text>
            <Text style={{ color: C.white, fontSize: 10, fontWeight: '700' }}>
              {Math.floor(st.mins/60)}h {st.mins%60}m
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function SleepScreen() {
  const { t } = useTranslation();
  const { data, isLoading, refetch, isRefetching } = useLastNightSleep();
  const session = data?.session;
  const trend   = data?.trend ?? [];

  const score = session?.sleepScore ?? 0;

  if (isLoading) return (
    <SafeAreaView style={s.root}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.sleep }}>{t('loading')}</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.sleep} />}>

        <View style={{ paddingVertical: 8 }}>
          <Text style={s.screenLabel}>{t('sleep').toUpperCase()}</Text>
          <Text style={s.screenTitle}>{t('sleepTitle')}</Text>
        </View>

        {!session ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🌙</Text>
            <Text style={{ color: C.ghost, fontSize: 14, textAlign: 'center' }}>No sleep data yet.\nSync your BARQ band.</Text>
          </View>
        ) : (
          <>
            {/* Score + Stages */}
            <View style={[s.card, { borderColor: C.sleep + '20', gap: 18 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{t('sleepScore')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={[s.heroScore, { color: C.white }]}>{score}</Text>
                    <Text style={{ color: C.sleep, fontSize: 14, fontWeight: '700' }}>/100</Text>
                  </View>
                  <View style={[s.pill, { backgroundColor: C.sleep + '18', borderColor: C.sleep + '40', alignSelf: 'flex-start', marginTop: 6 }]}>
                    <Text style={[s.pillText, { color: C.sleep }]}>{t('wellRested')}</Text>
                  </View>
                </View>
                <Ring value={score} size={100} stroke={9} color={C.sleep}>
                  <Text style={{ color: C.white, fontSize: 22, fontWeight: '900' }}>{score}</Text>
                  <Text style={{ color: C.muted, fontSize: 8, letterSpacing: 1 }}>BARQ</Text>
                </Ring>
              </View>
              <SleepStageBar session={session} />
            </View>

            {/* Bedtime + Wake */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { label: t('bedtime'),  val: format(new Date(session.sleepStart), 'HH:mm'), sub: 'PM' },
                { label: t('wakeUp'),   val: format(new Date(session.sleepEnd),   'HH:mm'), sub: 'AM' },
              ].map(item => (
                <View key={item.label} style={[s.card, { flex: 1, alignItems: 'center', gap: 4 }]}>
                  <Text style={s.label}>{item.label}</Text>
                  <Text style={s.bigTime}>{item.val}</Text>
                  <Text style={{ color: C.muted, fontSize: 11 }}>{item.sub}</Text>
                </View>
              ))}
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { label: t('sleepPerformance'), val: `${Math.round((session.sleepPerformancePct ?? 0))}%`, color: C.green },
                { label: t('timeInBed'),        val: `${Math.floor(session.totalMinutes/60)}h ${session.totalMinutes%60}m`, color: C.ghost },
                { label: 'Deep Sleep',           val: `${Math.floor(session.deepMinutes/60)}h ${session.deepMinutes%60}m`, color: C.sleep },
                { label: 'REM Sleep',            val: `${Math.floor(session.remMinutes/60)}h ${session.remMinutes%60}m`,  color: C.green + 'cc' },
              ].map(st => (
                <View key={st.label} style={[s.card, { width: '47%' }]}>
                  <Text style={s.label}>{st.label}</Text>
                  <Text style={{ color: C.white, fontSize: 18, fontWeight: '800' }}>{st.val}</Text>
                </View>
              ))}
            </View>

            {/* Sleep Coach */}
            <View style={[s.card, { backgroundColor: '#0e0a20', borderColor: C.sleep + '28' }]}>
              <Text style={s.label}>{t('sleepCoach')}</Text>
              <Text style={{ color: C.white, fontSize: 13, lineHeight: 20, fontWeight: '600' }}>
                🌙 {t('deepSleepAboveAvg')}
              </Text>
              <Text style={{ color: C.ghost, fontSize: 11, marginTop: 6, lineHeight: 18 }}>
                {t('keepWorkoutBefore7')}
              </Text>
            </View>
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
  label:       { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroScore:   { fontSize: 50, fontWeight: '900', letterSpacing: -2, lineHeight: 52 },
  bigTime:     { color: C.white, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  pill:        { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  pillText:    { fontSize: 10, fontWeight: '700' },
});
