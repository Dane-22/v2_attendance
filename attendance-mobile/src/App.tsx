import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { store } from './store';
import { useAppDispatch } from './hooks/useAppDispatch';
import { useAppSelector } from './hooks/useAppSelector';
import { authApi } from './api/authApi';
import ScannerKioskScreen from './screens/ScannerKioskScreen';
import HomeScreen from './screens/HomeScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { APP_COPY } from './constants/config';
import { hydrateAuth, logout, setAuth } from './store/authSlice';
import { destroySession, persistAuth, readStoredAuth } from './utils/authStorage';

type AdminTab = 'Home' | 'Attendance' | 'Notification' | 'Settings';

function AppShell() {
  const dispatch = useAppDispatch();
  const { isHydrated, isAuthenticated, userType, user } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('Home');

  useEffect(() => {
    readStoredAuth()
      .then((payload) => dispatch(hydrateAuth(payload)))
      .catch(() => dispatch(hydrateAuth(null)));
  }, [dispatch]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = await authApi.login(username.trim(), password);
      await persistAuth(payload);
      dispatch(setAuth(payload));
      setActiveTab('Home');
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.message || 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await destroySession();
    dispatch(logout());
    setUsername('');
    setPassword('');
    setActiveTab('Home');
  };

  const adminScreen = useMemo(() => {
    switch (activeTab) {
      case 'Attendance':
        return <AttendanceScreen />;
      case 'Notification':
        return <NotificationsScreen />;
      case 'Settings':
        return <SettingsScreen />;
      case 'Home':
      default:
        return <HomeScreen />;
    }
  }, [activeTab]);

  if (!isHydrated) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#7ef0d4" size="large" />
        <Text style={styles.loaderText}>Loading mobile workspace...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Mobile Login</Text>
          <Text style={styles.title}>{APP_COPY.name}</Text>
          <Text style={styles.subtitle}>
            Sign in with your normal backend credentials. Branch users go to the scanner. Admin and super admin users get the mobile dashboard tabs.
          </Text>

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Username"
            placeholderTextColor="rgba(230,238,255,0.45)"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />

          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="rgba(230,238,255,0.45)"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} disabled={loading} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>{loading ? 'Authenticating...' : 'Login'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (userType === 'branch') {
    return <ScannerKioskScreen user={user} onLogout={handleLogout} />;
  }

  return (
    <View style={styles.adminRoot}>
      <View style={styles.adminContent}>{adminScreen}</View>
      <View style={styles.tabBar}>
        {[
          { key: 'Home' as const, icon: activeTab === 'Home' ? 'home' : 'home-outline' },
          { key: 'Attendance' as const, icon: activeTab === 'Attendance' ? 'calendar' : 'calendar-outline' },
          { key: 'Notification' as const, icon: activeTab === 'Notification' ? 'notifications' : 'notifications-outline' },
          { key: 'Settings' as const, icon: activeTab === 'Settings' ? 'settings' : 'settings-outline' },
        ].map((item) => {
          const selected = activeTab === item.key;
          return (
            <TouchableOpacity key={item.key} style={styles.tabItem} onPress={() => setActiveTab(item.key)}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={selected ? '#7ef0d4' : '#9fb1c7'} />
              <Text style={[styles.tabLabel, { color: selected ? '#7ef0d4' : '#9fb1c7' }]}>{item.key}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <AppShell />
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07111f',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  loader: {
    flex: 1,
    backgroundColor: '#07111f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loaderText: {
    color: '#f7fbff',
    fontSize: 14,
    marginTop: 14,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(10,18,30,0.92)',
    padding: 22,
  },
  eyebrow: {
    color: '#7ef0d4',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    color: '#f7fbff',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(230,238,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  input: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#f7fbff',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  primaryButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#7ef0d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#07111f',
    fontSize: 15,
    fontWeight: '800',
  },
  adminRoot: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  adminContent: {
    flex: 1,
  },
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
