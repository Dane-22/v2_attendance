import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';

const Profile = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const isDark = useSelector((state: any) => state.theme.isDark);

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
          Profile
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

      {/* Avatar Section */}
      <View style={[styles.avatarSection, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
            {user?.name?.charAt(0) || 'J'}
          </Text>
        </View>
      </View>

      {/* User Info */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <InfoItem label="Name" value={user?.name || 'John Doe'} theme={theme} />
        <InfoItem label="Employee Code" value={user?.employee_code || 'W0001'} theme={theme} />
        <InfoItem label="Department" value={user?.department || 'Engineering'} theme={theme} />
        <InfoItem label="Position" value={user?.position || 'Developer'} theme={theme} />
        <InfoItem label="Branch" value={user?.branch || 'Main Office (E)'} theme={theme} />
      </View>

      {/* Personal QR Code */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          PERSONAL QR CODE
        </Text>
        <View style={[styles.qrPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons name="qr-code" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.qrText, { color: theme.colors.onSurfaceVariant }]}>
            Your QR Code
          </Text>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.buttonText}>View QR Code</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const InfoItem = ({ label, value, theme }: { label: string; value: string; theme: any }) => (
  <View style={[styles.infoItem, { borderBottomColor: theme.colors.outline }]}>
    <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{value}</Text>
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
  avatarSection: {
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrPlaceholder: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrText: {
    fontSize: 14,
    marginTop: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default Profile;
