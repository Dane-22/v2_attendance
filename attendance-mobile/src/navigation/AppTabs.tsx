import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const AnimatedIcon = ({ focused, icon, label, color }: { focused: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) => {
  return (
    <View style={styles.tabItem}>
      <Animated.View style={{ transform: [{ scale: focused ? 1.06 : 1 }] }}>
        <Ionicons name={icon} size={22} color={color} />
      </Animated.View>
      <Text style={[styles.tabLabel, { color, opacity: focused ? 1 : 0.75 }]}>{label}</Text>
    </View>
  );
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#7ef0d4',
        tabBarInactiveTintColor: '#9fb1c7',
        sceneStyle: { backgroundColor: '#07111f' },
        tabBarIcon: ({ focused, color }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? 'home' : 'home-outline',
            Attendance: focused ? 'calendar' : 'calendar-outline',
            Notification: focused ? 'notifications' : 'notifications-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };

          return <AnimatedIcon focused={focused} icon={iconMap[route.name]} label={route.name} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Notification" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    height: 78,
    borderRadius: 26,
    backgroundColor: 'rgba(9,17,28,0.96)',
    borderTopWidth: 0,
    paddingBottom: 10,
    paddingTop: 10,
    paddingHorizontal: 8,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
