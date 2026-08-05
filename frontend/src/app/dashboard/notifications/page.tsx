'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Loader2,
  Timer,
  X,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Search,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { 
  notificationApi, 
  overtimeRequestApi,
  Notification, 
  NotificationStats, 
  NotificationFilter,
  ReviewOvertimeRequestInput
} from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTime } from './data';

const iconMap: Record<string, React.ElementType> = {
  Clock,
  DollarSign,
  Shield,
  Settings,
  HardHat,
  Wallet,
  Timer,
  Bell
};

// Extended type config with vibrant colors and icons
const typeConfig: Record<string, { color: string; bg: string; border: string; label: string; icon: string }> = {
  ATTENDANCE: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Attendance', icon: 'Clock' },
  PAYROLL: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Payroll', icon: 'DollarSign' },
  SECURITY: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', label: 'Security', icon: 'Shield' },
  SYSTEM: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'System', icon: 'Settings' },
  PROJECT: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'Project', icon: 'HardHat' },
  FINANCE: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', label: 'Finance', icon: 'Wallet' },
  OVERTIME_REQUEST: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Overtime Request', icon: 'Timer' },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { on } = useWebSocket();
  const { classes } = useTheme();

  // Review Modal State (Replaces native browser prompt)
  const [reviewModal, setReviewModal] = useState<{
    notification: Notification;
    action: 'approve' | 'reject';
  } | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState('');

  // Clear All Modal State
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Inline Toast Feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch notifications
  const { data: notificationsData, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: ['notifications', activeFilter, page],
    queryFn: () => notificationApi.getNotifications({ 
      page, 
      limit: 50, 
      filter: activeFilter === 'ALL' ? undefined : activeFilter 
    }),
  });

  const rawNotifications = notificationsData?.data?.data?.notifications || [];
  const stats: NotificationStats = notificationsData?.data?.data?.stats || {
    total: 0, unread: 0, urgent: 0, byType: { ATTENDANCE: 0, PAYROLL: 0, SYSTEM: 0, SECURITY: 0, PROJECT: 0, FINANCE: 0, OVERTIME_REQUEST: 0 }
  };
  const pagination = notificationsData?.data?.data?.pagination;

  // Filter notifications by local search query
  let notifications = rawNotifications.filter((n: Notification) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.message && n.message.toLowerCase().includes(q)) ||
      (n.type && n.type.toLowerCase().includes(q))
    );
  });

  // Deduplicate notifications based on title and message to fix UI duplication
  const seenNotifs = new Set();
  notifications = notifications.filter((n: Notification) => {
    const key = `${n.title}-${n.message}`;
    if (seenNotifs.has(key)) return false;
    seenNotifs.add(key);
    return true;
  });

  // Toast auto-clear timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // WebSocket: Listen for notification updates
  useEffect(() => {
    const handleNotificationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    };

    on('notification:update', handleNotificationUpdate);
  }, [queryClient, on]);

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      setToast({ type: 'success', message: 'All notifications marked as read' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      setToast({ type: 'success', message: 'Notification deleted' });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      setShowClearAllModal(false);
      setToast({ type: 'success', message: 'All notifications cleared' });
    },
  });

  // Overtime Approval / Rejection Mutations
  const approveOvertimeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewOvertimeRequestInput }) =>
      overtimeRequestApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      setReviewModal(null);
      setReviewNoteInput('');
      setToast({ type: 'success', message: 'Overtime request approved successfully!' });
    },
    onError: (err: any) => {
      console.error('Failed to approve overtime request:', err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to approve overtime request' });
    },
  });

  const rejectOvertimeMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewOvertimeRequestInput }) =>
      overtimeRequestApi.reject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
      setReviewModal(null);
      setReviewNoteInput('');
      setToast({ type: 'success', message: 'Overtime request rejected' });
    },
    onError: (err: any) => {
      console.error('Failed to reject overtime request:', err);
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to reject overtime request' });
    },
  });

  const handleOpenReviewModal = (notification: Notification, action: 'approve' | 'reject') => {
    setReviewModal({ notification, action });
    setReviewNoteInput('');
  };

  const handleConfirmReview = () => {
    if (!reviewModal) return;
    const { notification, action } = reviewModal;
    const overtimeRequestId = notification.link?.match(/overtimeRequestId=(\d+)/)?.[1];

    if (!overtimeRequestId) {
      setToast({ type: 'error', message: 'Could not extract overtime request ID from notification link.' });
      return;
    }

    const id = parseInt(overtimeRequestId, 10);
    if (action === 'approve') {
      approveOvertimeMutation.mutate({
        id,
        data: { reviewNote: reviewNoteInput || undefined }
      });
    } else {
      if (!reviewNoteInput.trim()) {
        setToast({ type: 'error', message: 'Rejection reason is required.' });
        return;
      }
      rejectOvertimeMutation.mutate({
        id,
        data: { reviewNote: reviewNoteInput }
      });
    }
  };

  const filters: { value: NotificationFilter; label: string; count?: number; icon: React.ElementType }[] = [
    { value: 'ALL', label: 'All Alerts', count: stats.total, icon: Bell },
    { value: 'UNREAD', label: 'Unread', count: stats.unread, icon: AlertTriangle },
    { value: 'OVERTIME_REQUEST', label: 'Overtime', count: stats.byType.OVERTIME_REQUEST, icon: Timer },
    { value: 'ATTENDANCE', label: 'Attendance', count: stats.byType.ATTENDANCE, icon: Clock },
    { value: 'PAYROLL', label: 'Payroll', count: stats.byType.PAYROLL, icon: DollarSign },
    { value: 'FINANCE', label: 'Finance', count: stats.byType.FINANCE, icon: Wallet },
    { value: 'SYSTEM', label: 'System', count: stats.byType.SYSTEM, icon: Settings },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Feedback */}
      {mounted && toast && createPortal(
        <div className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/90 border-rose-500/40 text-rose-300'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <h1 className={`text-3xl font-bold ${classes.text} flex items-center gap-3`}>
            <Bell className="w-8 h-8 text-[#facc15]" />
            Notifications & Alerts
          </h1>
          <p className={`${classes.textMuted} mt-1.5`}>
            Manage system alerts, overtime approvals, and attendance activity
          </p>
        </div>

        {/* Global Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className={`p-2.5 rounded-xl bg-[#141414] border border-[#262626] text-gray-300 hover:text-white hover:border-gray-600 transition-colors ${
              isRefetching ? 'animate-spin text-[#facc15]' : ''
            }`}
            title="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || stats.unread === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-gray-300 hover:text-white hover:border-[#facc15]/50 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#facc15]" />
            ) : (
              <CheckCheck className="w-4 h-4 text-[#facc15]" />
            )}
            <span>Mark All Read</span>
          </button>

          <button
            onClick={() => setShowClearAllModal(true)}
            disabled={clearAllMutation.isPending || stats.total === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => {
                  setActiveFilter(filter.value);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#facc15] text-black shadow-lg shadow-yellow-500/20'
                    : 'bg-[#141414] border border-[#262626] text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{filter.label}</span>
                {filter.count !== undefined && filter.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-black/20 text-black' : 'bg-[#262626] text-gray-300'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141414] border border-[#262626] text-white text-xs focus:outline-none focus:border-[#facc15] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications Container */}
      <div className="bg-[#121212] border border-[#262626] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-[#facc15] animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Error Loading Notifications</h3>
            <p className="text-gray-400 text-sm">Please refresh or try again later.</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Bell className="w-8 h-8 text-[#facc15]" />
            </div>
            <h3 className="text-lg font-semibold text-white">No Notifications Found</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              {searchQuery ? `No results matching "${searchQuery}"` : 'You have no pending notifications or alerts for this view.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e1e1e]">
            {notifications.map((notification: Notification) => {
              const typeInfo = typeConfig[notification.type] || typeConfig.SYSTEM;
              const Icon = iconMap[typeInfo.icon] || Bell;
              const isOvertimeRequest = notification.type === 'OVERTIME_REQUEST' && notification.title === 'New Overtime Request';

              return (
                <div
                  key={notification.id}
                  className={`p-5 transition-all hover:bg-[#181818] ${
                    !notification.is_read ? 'bg-[#facc15]/[0.03]' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl ${typeInfo.bg} ${typeInfo.border} border flex items-center justify-center flex-shrink-0 ${typeInfo.color} mt-0.5`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className={`text-base font-semibold ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                            {notification.title}
                          </h3>
                          
                          {/* Status / Category Badges */}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${typeInfo.bg} ${typeInfo.color} border ${typeInfo.border}`}>
                            {typeInfo.label}
                          </span>

                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#facc15] animate-pulse" />
                          )}
                        </div>

                        <p className="text-sm text-gray-300 leading-relaxed mb-2.5 whitespace-pre-line">
                          {notification.message}
                        </p>

                        <span className="text-xs text-gray-500 font-medium">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222]">
                      {/* Special Overtime Approval Buttons */}
                      {isOvertimeRequest && (
                        <div className="flex items-center gap-2 mr-2">
                          <button
                            onClick={() => handleOpenReviewModal(notification, 'approve')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => handleOpenReviewModal(notification, 'reject')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {!isOvertimeRequest && (
                        <>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              className="p-2 hover:bg-[#262626] text-gray-400 hover:text-white rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteMutation.mutate(notification.id)}
                            className="p-2 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && page < pagination.totalPages && (
          <div className="p-4 border-t border-[#1e1e1e] text-center">
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-gray-300 text-xs font-semibold hover:text-white hover:border-[#facc15] transition-colors disabled:opacity-50"
            >
              Load More ({pagination.total - notifications.length} remaining)
            </button>
          </div>
        )}
      </div>

      {/* OVERTIME REVIEW MODAL (Replaces crude prompt) */}
      {mounted && reviewModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#282828] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2.5">
                {reviewModal.action === 'approve' ? (
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                    <ThumbsDown className="w-5 h-5" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-white">
                  {reviewModal.action === 'approve' ? 'Approve Overtime Request' : 'Reject Overtime Request'}
                </h3>
              </div>
              <button onClick={() => setReviewModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-3.5 text-xs text-gray-300 space-y-1">
                <p className="font-semibold text-white">{reviewModal.notification.title}</p>
                <p className="text-gray-400">{reviewModal.notification.message}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  {reviewModal.action === 'approve' ? 'Approval Note (Optional):' : 'Rejection Reason (Required):'}
                </label>
                <textarea
                  value={reviewNoteInput}
                  onChange={(e) => setReviewNoteInput(e.target.value)}
                  placeholder={
                    reviewModal.action === 'approve'
                      ? 'Enter optional notes for employee/payroll...'
                      : 'Provide a clear reason for rejecting this request...'
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#facc15] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 text-sm font-medium hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={approveOvertimeMutation.isPending || rejectOvertimeMutation.isPending}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  reviewModal.action === 'approve'
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {(approveOvertimeMutation.isPending || rejectOvertimeMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : reviewModal.action === 'approve' ? (
                  'Confirm Approval'
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CLEAR ALL CONFIRMATION MODAL */}
      {mounted && showClearAllModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-[#282828] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white">Clear All Notifications?</h3>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Are you sure you want to permanently clear all notifications? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 text-sm font-medium hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
              >
                {clearAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
