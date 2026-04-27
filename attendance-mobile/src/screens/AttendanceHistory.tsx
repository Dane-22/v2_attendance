import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';

const AttendanceHistory = () => {
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
          Attendance History
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

      {/* Filters */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Filter:</Text>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.filterText, { color: theme.colors.onPrimaryContainer }]}>This Month</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.onPrimaryContainer} />
          </TouchableOpacity>
        </View>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Status:</Text>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.filterText, { color: theme.colors.onPrimaryContainer }]}>All</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.onPrimaryContainer} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Attendance Records */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <HistoryItem
          date="Apr 24, 2026"
          timeIn="8:00 AM"
          timeOut="--"
          status="present"
          hours="3h 45m"
          theme={theme}
        />
        <HistoryItem
          date="Apr 23, 2026"
          timeIn="8:00 AM"
          timeOut="5:00 PM"
          status="present"
          hours="9h 00m"
          theme={theme}
        />
        <HistoryItem
          date="Apr 22, 2026"
          timeIn="8:30 AM"
          timeOut="5:00 PM"
          status="late"
          hours="8h 30m"
          theme={theme}
        />
        <HistoryItem
          date="Apr 21, 2026"
          timeIn="8:00 AM"
          timeOut="5:00 PM"
          status="present"
          hours="9h 00m"
          theme={theme}
        />
        <HistoryItem
          date="Apr 20, 2026"
          timeIn="8:00 AM"
          timeOut="5:00 PM"
          status="present"
          hours="9h 00m"
          theme={theme}
        />
      </View>
    </ScrollView>
  );
};

const HistoryItem = ({ date, timeIn, timeOut, status, hours, theme }: any) => {
  const getStatusColor = () => {
    switch (status) {
      case 'present': return '#4ade80';
      case 'late': return '#facc15';
      case 'absent': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <View style={[styles.historyItem, { borderBottomColor: theme.colors.outline }]}>
      <View style={styles.historyItemMain}>
        <Text style={[styles.historyDate, { color: theme.colors.onSurface }]}>{date}</Text>
        <View style={styles.timeRow}>
          <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>In:</Text>
          <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>{timeIn}</Text>
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.timeLabel, { color: theme.colors.onSurfaceVariant }]}>Out:</Text>
          <Text style={[styles.timeValue, { color: theme.colors.onSurface }]}>{timeOut}</Text>
        </View>
      </View>
      <View style={styles.historyItemSide}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(), textTransform: 'capitalize' }]}>
            {status}
          </Text>
        </View>
        <Text style={[styles.hoursText, { color: theme.colors.onSurfaceVariant }]}>{hours}</Text>
      </View>
    </View>
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
  headerTitle: {
    fontSize: 18,
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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  historyItemMain: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    marginRight: 4,
    width: 30,
  },
  timeValue: {
    fontSize: 14,
  },
  historyItemSide: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  hoursText: {
    fontSize: 12,
  },
});

export default AttendanceHistory;
