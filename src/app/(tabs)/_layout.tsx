import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, Search, FolderClosed } from 'lucide-react-native';
import { useThemeColors } from '../../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          height: 60,
          paddingBottom: insets.bottom > 0 ? 4 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconWrapper}>
              <Home size={20} color={focused ? colors.accent : colors.textSecondary} />
              {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconWrapper}>
              <Search size={20} color={focused ? colors.accent : colors.textSecondary} />
              {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="folders"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconWrapper}>
              <FolderClosed size={20} color={focused ? colors.accent : colors.textSecondary} />
              {focused && <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: 50,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    position: 'absolute',
    bottom: 8,
  },
});
