import { Notification, NotificationStats } from './types';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'ATTENDANCE',
    title: 'Late Arrival Alert',
    message: 'Cesar Abubo (E0002) arrived 25 minutes late today. Grace period exceeded.',
    timestamp: '2026-04-20T12:45:00Z',
    isRead: false,
    isUrgent: true,
    actionUrl: '/dashboard/attendance',
    actionLabel: 'View Attendance',
    metadata: { employeeId: 'E0002', employeeName: 'Cesar Abubo', minutesLate: 25 }
  },
  {
    id: 'notif-002',
    type: 'PAYROLL',
    title: 'Payroll Processing Complete',
    message: 'Bi-weekly payroll for April 1-15 has been successfully processed. Total payout: ₱185,000',
    timestamp: '2026-04-20T10:30:00Z',
    isRead: false,
    isUrgent: false,
    actionUrl: '/dashboard/payroll',
    actionLabel: 'View Payroll',
  },
  {
    id: 'notif-003',
    type: 'SECURITY',
    title: 'New Login Detected',
    message: 'A new login was detected from Chrome on Windows (IP: 192.168.1.105). If this wasn\'t you, please review your account security.',
    timestamp: '2026-04-20T09:15:00Z',
    isRead: true,
    isUrgent: false,
    actionUrl: '/dashboard/settings/security',
    actionLabel: 'Review Security',
  },
  {
    id: 'notif-004',
    type: 'PROJECT',
    title: 'Project Milestone Achieved',
    message: 'Manila Tower Construction has reached 75% completion. Milestone payment of ₱250,000 is now due.',
    timestamp: '2026-04-19T16:45:00Z',
    isRead: false,
    isUrgent: true,
    actionUrl: '/dashboard/finance',
    actionLabel: 'View Project',
    metadata: { projectId: 'proj-001', milestone: '75%', paymentDue: 250000 }
  },
  {
    id: 'notif-005',
    type: 'SYSTEM',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance will occur on April 25, 2026 from 2:00 AM to 4:00 AM. Some features may be unavailable.',
    timestamp: '2026-04-19T14:00:00Z',
    isRead: true,
    isUrgent: false,
  },
  {
    id: 'notif-006',
    type: 'ATTENDANCE',
    title: 'Overtime Request Pending',
    message: 'Gin Tyrone Aguino (E0089) has submitted an overtime request for April 19, 2026 (3 hours). Approval required.',
    timestamp: '2026-04-19T11:30:00Z',
    isRead: false,
    isUrgent: false,
    actionUrl: '/dashboard/attendance-audit',
    actionLabel: 'Review Request',
    metadata: { employeeId: 'E0089', hours: 3, date: '2026-04-19' }
  },
  {
    id: 'notif-007',
    type: 'PAYROLL',
    title: 'Low Balance Warning',
    message: 'Payroll account balance is below ₱100,000 threshold. Current balance: ₱87,500. Please add funds before next payroll.',
    timestamp: '2026-04-19T09:00:00Z',
    isRead: false,
    isUrgent: true,
    actionUrl: '/dashboard/finance',
    actionLabel: 'View Finances',
    metadata: { currentBalance: 87500, threshold: 100000 }
  },
  {
    id: 'notif-008',
    type: 'SYSTEM',
    title: 'New Feature Available',
    message: 'Finance Dashboard is now live! Track expenses, project costs, and payroll summaries in one place.',
    timestamp: '2026-04-18T13:00:00Z',
    isRead: true,
    isUrgent: false,
    actionUrl: '/dashboard/finance',
    actionLabel: 'Explore Finance',
  },
  {
    id: 'notif-009',
    type: 'ATTENDANCE',
    title: 'Multiple Absences Alert',
    message: 'Santi Abubo (E0072) has been absent for 3 consecutive days without notice. Follow-up required.',
    timestamp: '2026-04-18T10:00:00Z',
    isRead: false,
    isUrgent: true,
    actionUrl: '/dashboard/employees',
    actionLabel: 'Contact Employee',
    metadata: { employeeId: 'E0072', daysAbsent: 3 }
  },
  {
    id: 'notif-010',
    type: 'PROJECT',
    title: 'Budget Overrun Warning',
    message: 'Cebu Commercial Complex has exceeded its material budget by 15%. Review and adjust allocations.',
    timestamp: '2026-04-17T15:30:00Z',
    isRead: false,
    isUrgent: true,
    actionUrl: '/dashboard/finance',
    actionLabel: 'Review Budget',
    metadata: { projectId: 'proj-002', overrun: 15, category: 'Materials' }
  },
];

export const notificationStats: NotificationStats = {
  total: 10,
  unread: 6,
  urgent: 4,
  byType: {
    ATTENDANCE: 3,
    PAYROLL: 2,
    SECURITY: 1,
    SYSTEM: 2,
    PROJECT: 2,
  }
};

export const typeConfig: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  ATTENDANCE: { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Attendance', icon: 'Clock' },
  PAYROLL: { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Payroll', icon: 'DollarSign' },
  SECURITY: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Security', icon: 'Shield' },
  SYSTEM: { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'System', icon: 'Settings' },
  PROJECT: { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Project', icon: 'HardHat' },
};

export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
