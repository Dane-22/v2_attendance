import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { notificationApi } from '../api/notificationApi';
import { AppHeader } from '../components/AppHeader';
import { GlassCard } from '../components/GlassCard';
import { GradientBackdrop } from '../components/GradientBackdrop';
import { useScreenReveal } from '../hooks/useScreenReveal';
import { NotificationItem, NotificationsPayload } from '../types';

const FILTERS = ['ALL', 'UNREAD', 'URGENT', 'ATTENDANCE', 'PAYROLL', 'FINANCE', 'SYSTEM'] as const;

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [payload, setPayload] = useState<NotificationsPayload | null>(null);
  const reveal = useScreenReveal(8);

  const loadNotifications = async (filter = activeFilter) => {
    const nextPayload = await notificationApi.getAll({
      page: 1,
      limit: 20,
      filter: filter === 'ALL' ? undefined : filter,
    });
    setPayload(nextPayload);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    loadNotifications(activeFilter).catch(() => setLoading(false));
  }, [activeFilter]);

  const notifications = payload?.notifications || [];
  const stats = payload?.stats;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications(activeFilter);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (item: NotificationItem) => {
    try {
      await notificationApi.markAsRead(item.id);
      await loadNotifications(activeFilter);
    } catch {
      Alert.alert('Unable to update', 'Failed to mark notification as read.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead();
      await loadNotifications(activeFilter);
    } catch {
      Alert.alert('Unable to update', 'Failed to mark all notifications as read.');
    }
  };

  const handleDelete = async (item: NotificationItem) => {
    try {
      await notificationApi.deleteOne(item.id);
      await loadNotifications(activeFilter);
    } catch {
      Alert.alert('Unable to delete', 'Failed to remove the notification.');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationApi.clearAll();
      await loadNotifications(activeFilter);
    } catch {
      Alert.alert('Unable to clear', 'Failed to clear notifications.');
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationApi.createTestNotification('SYSTEM');
      await loadNotifications(activeFilter);
      Alert.alert('Sent', 'A test notification was created from the mobile app.');
    } catch {
      Alert.alert('Unable to send', 'Failed to create a test notification.');
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
          <AppHeader title="Notifications" subtitle="Same `/api/notifications` feed as the web dashboard" />

          <Animated.View style={reveal.itemStyle(0)}>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.primaryAction} onPress={handleMarkAll}>
                <Text style={styles.primaryActionText}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryAction} onPress={handleClearAll}>
                <Text style={styles.secondaryActionText}>Clear all</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={reveal.itemStyle(1)}>
            <View style={styles.statsRow}>
              {[
                { label: 'Total', value: stats?.total ?? 0 },
                { label: 'Unread', value: stats?.unread ?? 0 },
                { label: 'Urgent', value: stats?.urgent ?? 0 },
              ].map((item) => (
                <GlassCard key={item.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={reveal.itemStyle(2)}>
            <GlassCard>
              <Text style={styles.sectionTitle}>Filters</Text>
              <View style={styles.filterWrap}>
                {FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View style={reveal.itemStyle(3)}>
            <GlassCard>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Live feed</Text>
                <TouchableOpacity onPress={handleTestNotification}>
                  <Text style={styles.linkText}>Send test</Text>
                </TouchableOpacity>
              </View>
              {loading ? <ActivityIndicator color="#7ef0d4" /> : null}
              {!loading && notifications.length === 0 ? <Text style={styles.emptyText}>No notifications for this filter.</Text> : null}
              {!loading &&
                notifications.map((item, index) => (
                  <Animated.View key={item.id} style={[styles.notificationItem, reveal.itemStyle(Math.min(index + 4, 7))]}>
                    <TouchableOpacity style={styles.notificationMain} onPress={() => handleMarkAsRead(item)}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationMeta}>
                        {item.type} • {new Date(item.created_at).toLocaleString()}
                      </Text>
                      <Text style={styles.notificationBody}>{item.message}</Text>
                      {!item.is_read ? <Text style={styles.unreadPill}>Unread</Text> : null}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
            </GlassCard>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 120, gap: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  primaryAction: { flex: 1, backgroundColor: '#7ef0d4', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  primaryActionText: { color: '#07111f', fontWeight: '800', fontSize: 13 },
  secondaryAction: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryActionText: { color: '#dce6f8', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1 },
  statValue: { color: '#ffb86c', fontSize: 26, fontWeight: '800' },
  statLabel: { color: 'rgba(230,238,255,0.72)', fontSize: 12, marginTop: 8 },
  sectionTitle: { color: '#f7fbff', fontSize: 18, fontWeight: '700' },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  filterChip: { borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8 },
  filterChipActive: { backgroundColor: 'rgba(126,240,212,0.2)' },
  filterChipText: { color: '#dce6f8', fontSize: 11, fontWeight: '700' },
  filterChipTextActive: { color: '#7ef0d4' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkText: { color: '#7ef0d4', fontWeight: '700', fontSize: 12 },
  emptyText: { color: 'rgba(230,238,255,0.72)', marginTop: 16 },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  notificationMain: { flex: 1 },
  notificationTitle: { color: '#f7fbff', fontSize: 14, fontWeight: '700' },
  notificationMeta: { color: '#7ef0d4', fontSize: 11, marginTop: 6, fontWeight: '700' },
  notificationBody: { color: 'rgba(230,238,255,0.76)', fontSize: 13, lineHeight: 20, marginTop: 8 },
  unreadPill: { color: '#ffb86c', fontSize: 12, marginTop: 8, fontWeight: '700' },
  deleteText: { color: '#ff7b7b', fontWeight: '700', fontSize: 12, marginTop: 4 },
});
