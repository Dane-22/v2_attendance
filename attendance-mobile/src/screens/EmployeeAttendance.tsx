import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';

const EmployeeAttendance = () => {
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
          Attendance
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

      {/* Calendar View */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.calendarTitle, { color: theme.colors.onSurface }]}>
            April 2026
          </Text>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>SUN</Text>
          <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>MON</Text>
          <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>TUE</Text>
          <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>WED</Text>
          <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>THU</Text>
          <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>FRI</Text>
          <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant }]}>SAT</Text>
        </View>

        {/* Calendar Days */}
        <View style={styles.calendarGrid}>
          <DayCard day="20" status="present" hours="8h" theme={theme} />
          <DayCard day="21" status="present" hours="9h" theme={theme} />
          <DayCard day="22" status="late" hours="8h" theme={theme} />
          <DayCard day="23" status="present" hours="8h" theme={theme} />
          <DayCard day="24" status="present" hours="3h" theme={theme} />
          <DayCard day="25" status="absent" hours="--" theme={theme} />
          <DayCard day="26" status="present" hours="8h" theme={theme} />
          <DayCard day="27" status="present" hours="8h" theme={theme} />
          <DayCard day="28" status="present" hours="8h" theme={theme} />
          <DayCard day="29" status="present" hours="8h" theme={theme} />
        </View>
      </View>

      {/* Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
          SUMMARY (April)
        </Text>
        <View style={styles.summaryRow}>
          <SummaryItem label="Present" value="18" color={theme.colors.primary} theme={theme} />
          <SummaryItem label="Late" value="2" color={theme.colors.tertiary} theme={theme} />
          <SummaryItem label="Absent" value="3" color={theme.colors.error} theme={theme} />
          <SummaryItem label="Total" value="23" color={theme.colors.onSurfaceVariant} theme={theme} />
        </View>
      </View>

      <Text style={[styles.tapHint, { color: theme.colors.onSurfaceVariant }]}>
        Tap day for details
      </Text>
    </ScrollView>
  );
};

const DayCard = ({ day, status, hours, theme }: { day: string; status: string; hours: string; theme: any }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'present': return '#4ade80';
      case 'late': return '#facc15';
      case 'absent': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <View style={[styles.dayCard, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text style={[styles.dayNumber, { color: theme.colors.onSurface }]}>{day}</Text>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      <Text style={[styles.dayHours, { color: theme.colors.onSurfaceVariant }]}>{hours}</Text>
    </View>
  );
};

const SummaryItem = ({ label, value, color, theme }: { label: string; value: string; color: string; theme: any }) => (
  <View style={styles.summaryItem}>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCard: {
    width: '12%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dayHours: {
    fontSize: 10,
    marginTop: 2,
  },
  summaryCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tapHint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
});

export default EmployeeAttendance;
