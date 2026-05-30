import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { attendanceApi } from '../api/attendanceApi';
import { AppHeader } from '../components/AppHeader';
import { GlassCard } from '../components/GlassCard';
import { GradientBackdrop } from '../components/GradientBackdrop';
import { useAppSelector } from '../hooks/useAppSelector';
import { useScreenReveal } from '../hooks/useScreenReveal';

export default function HomeScreen() {
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayStatus, setTodayStatus] = useState<string>('No record');
  const [todayMeta, setTodayMeta] = useState<string>('No active attendance session yet');
  const [stats, setStats] = useState({ presentDays: 0, lateDays: 0, totalHours: 0 });
  const reveal = useScreenReveal(4);

  const loadData = async () => {
    if (!user?.employeeId) {
      setTodayStatus(user?.role === 'admin' || user?.role === 'super_admin' ? 'Administrator session' : 'Scanner session');
      setTodayMeta(user?.branch_name || user?.branch_code || 'No branch metadata');
      setLoading(false);
      return;
    }

    const [today, summary] = await Promise.all([
      attendanceApi.getToday(user.employeeId),
      attendanceApi.getStats(user.employeeId),
    ]);

    setTodayStatus(today?.status ? today.status.toUpperCase() : 'No record');
    setTodayMeta(
      today?.check_in
        ? `Checked in ${new Date(today.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'No attendance record for today'
    );
    setStats({
      presentDays: summary.stats.presentDays,
      lateDays: summary.stats.lateDays,
      totalHours: summary.stats.totalHours,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <GradientBackdrop>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7ef0d4" />}
      >
        <Animated.View style={reveal.containerStyle}>
          <AppHeader
            title={`Welcome, ${user?.name?.split(' ')[0] || 'User'}`}
            subtitle={user?.branch_name || user?.branch_code || 'Mobile attendance workspace'}
          />

          {loading ? (
            <ActivityIndicator color="#7ef0d4" size="large" />
          ) : (
            <>
              <Animated.View style={reveal.itemStyle(0)}>
                <GlassCard style={styles.heroCard}>
                  <Text style={styles.heroLabel}>Live status</Text>
                  <Text style={styles.heroValue}>{todayStatus}</Text>
                  <Text style={styles.heroMeta}>{todayMeta}</Text>
                </GlassCard>
              </Animated.View>

              <Animated.View style={reveal.itemStyle(1)}>
                <View style={styles.statsRow}>
                  <GlassCard style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.presentDays}</Text>
                    <Text style={styles.statLabel}>Present days</Text>
                  </GlassCard>
                  <GlassCard style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.lateDays}</Text>
                    <Text style={styles.statLabel}>Late days</Text>
                  </GlassCard>
                </View>
              </Animated.View>

              <Animated.View style={reveal.itemStyle(2)}>
                <GlassCard>
                  <Text style={styles.sectionTitle}>Hours this period</Text>
                  <Text style={styles.bigNumeric}>{stats.totalHours.toFixed(2)}</Text>
                  <Text style={styles.caption}>Derived from `/api/attendance/stats`</Text>
                </GlassCard>
              </Animated.View>

              <Animated.View style={reveal.itemStyle(3)}>
                <GlassCard>
                  <Text style={styles.sectionTitle}>Role sync</Text>
                  <Text style={styles.caption}>User type: {user?.role}</Text>
                  <Text style={styles.caption}>JWT branch scope: {user?.branch_code || 'global'}</Text>
                </GlassCard>
              </Animated.View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: { minHeight: 180, justifyContent: 'flex-end' },
  heroLabel: {
    color: '#7ef0d4',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '700',
    fontSize: 12,
  },
  heroValue: {
    color: '#f7fbff',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 10,
  },
  heroMeta: {
    color: 'rgba(230,238,255,0.76)',
    marginTop: 8,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statCard: { flex: 1 },
  statValue: {
    color: '#f7fbff',
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(230,238,255,0.74)',
    fontSize: 13,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#f7fbff',
    fontSize: 18,
    fontWeight: '700',
  },
  bigNumeric: {
    color: '#ffb86c',
    fontSize: 42,
    fontWeight: '800',
    marginTop: 12,
  },
  caption: {
    color: 'rgba(230,238,255,0.72)',
    fontSize: 13,
    marginTop: 8,
  },
});
