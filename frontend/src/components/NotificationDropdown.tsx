'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
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
  AlertTriangle,
  CheckCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { notificationApi, Notification } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatRelativeTime } from '@/app/dashboard/notifications/data';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Clock,
  DollarSign,
  Shield,
  Settings,
  HardHat,
  Wallet,
};

const typeConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  ATTENDANCE: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Attendance', icon: 'Clock' },
  PAYROLL: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Payroll', icon: 'DollarSign' },
  SECURITY: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Security', icon: 'Shield' },
  SYSTEM: { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'System', icon: 'Settings' },
  PROJECT: { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Project', icon: 'HardHat' },
  FINANCE: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Finance', icon: 'Wallet' },
};

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { on } = useWebSocket();

  // Fetch recent notifications (last 5)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recentNotifications'],
    queryFn: async () => {
      const response = await notificationApi.getNotifications({ page: 1, limit: 5 });
      return response.data?.data;
    },
    enabled: isOpen,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.stats?.unread || 0;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // WebSocket listener
  useEffect(() => {
    const handleNotificationUpdate = () => {
      if (isOpen) {
        refetch();
      }
    };

    on('notification:update', handleNotificationUpdate);
  }, [on, refetch, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAsRead = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#facc15]" />
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={markAllAsReadMutation.isPending || unreadCount === 0}
          className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 mx-auto mb-2 text-[#facc15] animate-spin" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {notifications.map((notification: Notification) => {
              const typeInfo = typeConfig[notification.type] || typeConfig.SYSTEM;
              const Icon = iconMap[typeInfo.icon] || Bell;

              return (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-[#1a1a1a] transition-colors ${
                    notification.is_read ? 'opacity-60' : 'bg-[#facc15]/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className={`text-sm font-medium text-white ${!notification.is_read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {notification.is_urgent && (
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                            )}
                            {!notification.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{notification.message}</p>
                          <span className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="p-1.5 hover:bg-[#262626] rounded transition-colors text-gray-400 hover:text-white"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-gray-400 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      <div className="px-4 py-2 border-t border-[#262626] bg-[#0a0a0a]">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-2 text-sm text-[#facc15] hover:text-yellow-400 transition-colors"
        >
          View All Notifications
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
