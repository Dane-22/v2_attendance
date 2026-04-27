import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';

const Settings = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const isDark = useSelector((state: any) => state.theme.isDark);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Settings
        </Text>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
          <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
            Online
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleThemeToggle} style={styles.iconButton}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Appearance */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          APPEARANCE
        </Text>
        <SettingItem
          icon="moon"
          label="Dark Mode"
          value={isDark ? 'On' : 'Off'}
          theme={theme}
          control={<Switch value={isDark} onValueChange={handleThemeToggle} />}
        />
      </View>

      {/* Notifications */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          NOTIFICATIONS
        </Text>
        <SettingItem
          icon="notifications"
          label="Push Notifications"
          value={notificationsEnabled ? 'On' : 'Off'}
          theme={theme}
          control={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
        />
        <SettingItem
          icon="mail"
          label="Email Notifications"
          value="On"
          theme={theme}
          control={<Switch value={true} />}
        />
      </View>

      {/* Security */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          SECURITY
        </Text>
        <SettingItem
          icon="finger-print"
          label="Biometric Login"
          value={biometricEnabled ? 'On' : 'Off'}
          theme={theme}
          control={<Switch value={biometricEnabled} onValueChange={setBiometricEnabled} />}
        />
        <SettingItem
          icon="lock-closed"
          label="Change PIN"
          value=""
          theme={theme}
          showChevron
        />
      </View>

      {/* About */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          ABOUT
        </Text>
        <SettingItem
          icon="information-circle"
          label="App Version"
          value="1.0.0"
          theme={theme}
        />
        <SettingItem
          icon="help-circle"
          label="Help & Support"
          value=""
          theme={theme}
          showChevron
        />
        <SettingItem
          icon="document-text"
          label="Privacy Policy"
          value=""
          theme={theme}
          showChevron
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={[styles.logoutCard, { backgroundColor: theme.colors.errorContainer }]} onPress={handleLogout}>
        <Ionicons name="log-out" size={24} color={theme.colors.error} />
        <Text style={[styles.logoutCardText, { color: theme.colors.error }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const SettingItem = ({ icon, label, value, theme, control, showChevron }: any) => (
  <View style={[styles.settingItem, { borderBottomColor: theme.colors.outline }]}>
    <View style={styles.settingItemLeft}>
      <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
      <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>{label}</Text>
    </View>
    <View style={styles.settingItemRight}>
      {value && <Text style={[styles.settingValue, { color: theme.colors.onSurfaceVariant }]}>{value}</Text>}
      {control}
      {showChevron && <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
  },
  logoutCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutCardText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Settings;
