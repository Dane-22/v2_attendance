import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';
import { toggleTheme as toggleThemeAction } from '../store/themeSlice';

const EmployeeDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.user);
  const isDark = useSelector((state: any) => state.theme.isDark);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleThemeToggle = () => {
    dispatch(toggleThemeAction());
  };

  const handleClockIn = () => {
    // TODO: Implement clock in functionality
    console.log('Clock In');
  };

  const handleClockOut = () => {
    // TODO: Implement clock out functionality
    console.log('Clock Out');
  };

  const handleScanQR = () => {
    // TODO: Navigate to QR scanner
    console.log('Scan QR');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
            {user?.name || 'John Doe'}
          </Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: '#4ade80' }]} />
            <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
              Online
            </Text>
          </View>
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

      {/* Today's Status Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          TODAY'S STATUS
        </Text>
        <View style={styles.statusCard}>
          <Text style={[styles.statusText, { color: theme.colors.primary, fontSize: 32, fontWeight: 'bold' }]}>
            PRESENT
          </Text>
          <Text style={[styles.statusSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Clocked in at 8:00 AM
          </Text>
          <Text style={[styles.statusSubtext, { color: theme.colors.onSurfaceVariant }]}>
            Working: 3h 45m
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>18</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Present</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>2</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Absent</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.statValue, { color: theme.colors.tertiary }]}>1</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Late</Text>
        </View>
      </View>
      <Text style={[styles.statsSubtitle, { color: theme.colors.onSurfaceVariant }]}>
        This Month
      </Text>

      {/* Quick Actions */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          QUICK ACTIONS
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]} onPress={handleScanQR}>
            <Ionicons name="qr-code" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.onPrimaryContainer }]}>Scan QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4ade80' }]} onPress={handleClockIn}>
            <Ionicons name="log-in" size={24} color="#000" />
            <Text style={[styles.actionText, { color: '#000' }]}>Clock In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#f87171' }]} onPress={handleClockOut}>
            <Ionicons name="log-out" size={24} color="#000" />
            <Text style={[styles.actionText, { color: '#000' }]}>Clock Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          RECENT ACTIVITY
        </Text>
        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: '#4ade80' }]} />
          <View>
            <Text style={[styles.activityText, { color: theme.colors.onSurface }]}>
              Clocked in at 8:00 AM
            </Text>
            <Text style={[styles.activityTime, { color: theme.colors.onSurfaceVariant }]}>
              Today, 8:00 AM
            </Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={[styles.activityDot, { backgroundColor: theme.colors.tertiary }]} />
          <View>
            <Text style={[styles.activityText, { color: theme.colors.onSurface }]}>
              Notification: Late arrival
            </Text>
            <Text style={[styles.activityTime, { color: theme.colors.onSurfaceVariant }]}>
              Yesterday, 8:30 AM
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    marginBottom: 12,
  },
  statusCard: {
    alignItems: 'center',
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statsSubtitle: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 4,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  statusSubtext: {
    fontSize: 16,
    marginTop: 8,
  },
});

export default EmployeeDashboard;
