import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AdminAttendance') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'AdminEmployees') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'AdminHistory') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'AdminSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#facc15',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.background,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="AdminHome" component={() => <View />} />
      <Tab.Screen name="AdminAttendance" component={() => <View />} />
      <Tab.Screen name="AdminEmployees" component={() => <View />} />
      <Tab.Screen name="AdminHistory" component={() => <View />} />
      <Tab.Screen name="AdminSettings" component={() => <View />} />
    </Tab.Navigator>
  );
}
