export interface Notification {
  id: string;
  type: 'ATTENDANCE' | 'PAYROLL' | 'SYSTEM' | 'SECURITY' | 'PROJECT';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isUrgent: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: Record<string, number>;
}

export type NotificationFilter = 'ALL' | 'UNREAD' | 'URGENT' | 'ATTENDANCE' | 'PAYROLL' | 'SYSTEM';
