'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  Clock, 
  DollarSign, 
  Shield, 
  Settings, 
  HardHat,
  Wallet,
  Check,
  Trash2,
  Filter,
  AlertTriangle,
  CheckCheck,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { 
  notificationApi, 
  Notification, 
  NotificationStats, 
  NotificationFilter
} from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatRelativeTime } from './data';

const iconMap: Record<string, React.ElementType> = {
  Clock,
  DollarSign,
  Shield,
  Settings,
  HardHat,
  Wallet,
};

// Extended type config with FINANCE support
const typeConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  ATTENDANCE: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Attendance', icon: 'Clock' },
  PAYROLL: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Payroll', icon: 'DollarSign' },
  SECURITY: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Security', icon: 'Shield' },
  SYSTEM: { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'System', icon: 'Settings' },
  PROJECT: { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Project', icon: 'HardHat' },
  FINANCE: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Finance', icon: 'Wallet' },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');
  const [page, setPage] = useState(1);
  const { on } = useWebSocket();

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', activeFilter, page],
    queryFn: () => notificationApi.getNotifications({ 
      page, 
      limit: 50, 
      filter: activeFilter === 'ALL' ? undefined : activeFilter 
    }),
  });

  const notifications = notificationsData?.data?.data?.notifications || [];
  const stats: NotificationStats = notificationsData?.data?.data?.stats || {
    total: 0, unread: 0, urgent: 0, byType: { ATTENDANCE: 0, PAYROLL: 0, SYSTEM: 0, SECURITY: 0, PROJECT: 0, FINANCE: 0 }
  };
  const pagination = notificationsData?.data?.data?.pagination;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // Clear all mutation
  const clearAllMutation = useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // WebSocket: Listen for notification updates
  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('[WebSocket] Notification update received');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    };

    on('notification:update', handleNotificationUpdate);
  }, [queryClient, on]);

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearAllMutation.mutate();
    }
  };

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const filters: { value: NotificationFilter; label: string; count?: number }[] = [
    { value: 'ALL', label: 'All', count: stats.total },
    { value: 'UNREAD', label: 'Unread', count: stats.unread },
    { value: 'URGENT', label: 'Urgent', count: stats.urgent },
    { value: 'ATTENDANCE', label: 'Attendance', count: stats.byType.ATTENDANCE },
    { value: 'PAYROLL', label: 'Payroll', count: stats.byType.PAYROLL },
    { value: 'FINANCE', label: 'Finance', count: stats.byType.FINANCE },
    { value: 'SYSTEM', label: 'System', count: stats.byType.SYSTEM },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Notifications <span className="text-[#facc15]">& Alerts</span>
          </h1>
          <p className="text-gray-400 mt-1">
            You have {stats.unread} unread and {stats.urgent} urgent notifications
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || stats.unread === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white hover:border-[#404040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Mark All Read</span>
          </button>
          <button
            onClick={handleClearAll}
            disabled={clearAllMutation.isPending || stats.total === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearAllMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Bell, color: 'text-[#facc15]', bg: 'bg-[#facc15]/10' },
          { label: 'Unread', value: stats.unread, icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Urgent', value: stats.urgent, icon: Shield, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Attendance', value: stats.byType.ATTENDANCE, icon: Clock, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Payroll', value: stats.byType.PAYROLL, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Finance', value: stats.byType.FINANCE, icon: Wallet, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-[#141414] rounded-xl border border-[#262626] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} border border-current border-opacity-30 flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filter by:</span>
        </div>
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === filter.value
                ? 'bg-[#facc15] text-black'
                : 'bg-[#141414] border border-[#262626] text-gray-400 hover:text-white'
            }`}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                activeFilter === filter.value ? 'bg-black/20' : 'bg-[#262626]'
              }`}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-[#facc15] animate-spin" />
            <p className="text-gray-400">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Error loading notifications</h3>
            <p className="text-gray-400 text-sm">Please try again later</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#262626] flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
            <p className="text-gray-400 text-sm">You&apos;re all caught up!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#262626]">
              {notifications.map((notification: Notification) => {
                const typeInfo = typeConfig[notification.type] || typeConfig.SYSTEM;
                const Icon = iconMap[typeInfo.icon] || Bell;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-[#1a1a1a] transition-colors ${
                      notification.is_read 
                        ? 'opacity-60' 
                        : 'bg-[#facc15]/5'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl ${typeInfo.bg} border border-current border-opacity-30 flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-white font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h4>
                              {notification.is_urgent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-400/10 text-red-400 rounded text-xs font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  Urgent
                                </span>
                              )}
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-[#facc15]" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(notification.created_at)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {notification.link && (
                              <a
                                href={notification.link}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#facc15]/10 text-[#facc15] rounded-lg text-sm hover:bg-[#facc15]/20 transition-colors"
                              >
                                View
                                <ArrowRight className="w-4 h-4" />
                              </a>
                            )}
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={markAsReadMutation.isPending}
                                className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              disabled={deleteMutation.isPending}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Load More Button */}
            {pagination && page < pagination.totalPages && (
              <div className="p-4 border-t border-[#262626] text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-gray-400 hover:text-white hover:border-[#404040] transition-colors"
                >
                  Load More ({pagination.total - notifications.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Notifications persist until manually deleted. <button className="text-[#facc15] hover:text-yellow-400">View Notification Settings</button></p>
      </div>
    </div>
  );
}
