'use client';

import { useState, useMemo } from 'react';
import { Notification, NotificationFilter } from './types';
import { mockNotifications, notificationStats, typeConfig, formatRelativeTime } from './data';
import { 
  Bell, 
  Clock, 
  DollarSign, 
  Shield, 
  Settings, 
  HardHat,
  Check,
  Trash2,
  Filter,
  AlertTriangle,
  MoreHorizontal,
  CheckCheck,
  ArrowRight
} from 'lucide-react';

const filters: { value: NotificationFilter; label: string; count?: number }[] = [
  { value: 'ALL', label: 'All', count: notificationStats.total },
  { value: 'UNREAD', label: 'Unread', count: notificationStats.unread },
  { value: 'URGENT', label: 'Urgent', count: notificationStats.urgent },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'PAYROLL', label: 'Payroll' },
  { value: 'SYSTEM', label: 'System' },
];

const iconMap: Record<string, React.ElementType> = {
  Clock,
  DollarSign,
  Shield,
  Settings,
  HardHat,
};

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      switch (activeFilter) {
        case 'UNREAD':
          return !notif.isRead;
        case 'URGENT':
          return notif.isUrgent;
        case 'ATTENDANCE':
        case 'PAYROLL':
        case 'SYSTEM':
          return notif.type === activeFilter;
        default:
          return true;
      }
    });
  }, [notifications, activeFilter]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Notifications <span className="text-[#facc15]">& Alerts</span>
          </h1>
          <p className="text-gray-400 mt-1">
            You have {notificationStats.unread} unread and {notificationStats.urgent} urgent notifications
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white hover:border-[#404040] transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Mark All Read</span>
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: notificationStats.total, icon: Bell, color: 'text-[#facc15]', bg: 'bg-[#facc15]/10' },
          { label: 'Unread', value: notificationStats.unread, icon: AlertTriangle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Urgent', value: notificationStats.urgent, icon: Shield, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Attendance', value: notificationStats.byType.ATTENDANCE, icon: Clock, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Payroll', value: notificationStats.byType.PAYROLL, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-400/10' },
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
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#262626] flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
            <p className="text-gray-400 text-sm">You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {filteredNotifications.map((notification) => {
              const typeInfo = typeConfig[notification.type];
              const Icon = iconMap[typeInfo.icon] || Bell;
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-[#1a1a1a] transition-colors ${
                    !notification.isRead ? 'bg-[#facc15]/5' : ''
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
                            <h4 className={`text-white font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {notification.isUrgent && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-400/10 text-red-400 rounded text-xs font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Urgent
                              </span>
                            )}
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#facc15]" />
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(notification.timestamp)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${typeInfo.bg} ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#facc15]/10 text-[#facc15] rounded-lg text-sm hover:bg-[#facc15]/20 transition-colors"
                            >
                              {notification.actionLabel}
                              <ArrowRight className="w-4 h-4" />
                            </a>
                          )}
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
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
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Notifications are kept for 30 days. <button className="text-[#facc15] hover:text-yellow-400">View Notification Settings</button></p>
      </div>
    </div>
  );
}
