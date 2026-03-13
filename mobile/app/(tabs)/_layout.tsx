import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { C } from '../../src/constants/colors';

const TABS = [
  { name: 'index',    icon: '◉', tkey: 'today',    color: C.green  },
  { name: 'recovery', icon: '⚡', tkey: 'recovery', color: C.green  },
  { name: 'strain',   icon: '🔥', tkey: 'strain',   color: C.strain },
  { name: 'sleep',    icon: '🌙', tkey: 'sleep',    color: C.sleep  },
  { name: 'profile',  icon: '◎', tkey: 'profile',  color: C.green  },
] as const;

function TabIcon({ icon, label, focused, color }: {
  icon: string; label: string; focused: boolean; color: string;
}) {
  return (
    <View style={[s.tab, focused && { backgroundColor: color + '1a', borderRadius: 12 }]}>
      <Text style={[s.icon, { opacity: focused ? 1 : 0.3 }]}>{icon}</Text>
      <Text style={[s.label, { color: focused ? color : C.muted }]}>{label}</Text>
      {focused && <View style={[s.dot, { backgroundColor: color }]} />}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t }  = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.ink,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarShowLabel: false,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={tab.icon}
                label={t(tab.tkey)}
                focused={focused}
                color={tab.color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const s = StyleSheet.create({
  tab:   { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 2 },
  icon:  { fontSize: 18 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  dot:   { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
