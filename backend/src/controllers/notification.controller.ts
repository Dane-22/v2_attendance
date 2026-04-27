import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { emitNotificationUpdate } from '../routes/websocket.routes';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  admin?: {
    id: number;
    role: string | null;
  };
}

// Notification filter type
type NotificationFilter = 'ALL' | 'UNREAD' | 'URGENT' | 'ATTENDANCE' | 'PAYROLL' | 'SYSTEM' | 'FINANCE' | 'PROJECT' | 'SECURITY';

/**
 * Get notifications for the logged-in user
 * Supports pagination, filtering, and returns stats
 */
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.admin?.id;
    const userRole = req.admin?.role || undefined;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const filter = (req.query.filter as NotificationFilter) || 'ALL';

    // Build recipient filter (user-specific + role-based)
    const recipientConditions: any[] = [
      { recipient_type: 'admin', recipient_id: userId },
    ];

    // Add role-based conditions
    if (userRole === 'super_admin' || userRole === 'admin') {
      recipientConditions.push({ recipient_type: 'role_admin' });
    }
    if (userRole === 'branch') {
      recipientConditions.push({ recipient_type: 'role_branch' });
    }

    // Build where clause based on filter
    let whereClause: any = {
      OR: recipientConditions,
    };

    switch (filter) {
      case 'UNREAD':
        whereClause = {
          ...whereClause,
          is_read: false,
        };
        break;
      case 'URGENT':
        whereClause = {
          ...whereClause,
          is_urgent: true,
        };
        break;
      case 'ATTENDANCE':
      case 'PAYROLL':
      case 'SYSTEM':
      case 'FINANCE':
      case 'PROJECT':
      case 'SECURITY':
        whereClause = {
          ...whereClause,
          type: filter,
        };
        break;
    }

    // Fetch notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      prisma.notifications.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notifications.count({ where: whereClause }),
    ]);

    // Calculate stats
    const stats = await getNotificationStats(userId, userRole);

    res.json({
      success: true,
      data: {
        notifications,
        stats,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count for bell icon
 */
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.admin?.id;
    const userRole = req.admin?.role || undefined;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Build recipient conditions
    const recipientConditions: any[] = [
      { recipient_type: 'admin', recipient_id: userId },
    ];

    if (userRole === 'super_admin' || userRole === 'admin') {
      recipientConditions.push({ recipient_type: 'role_admin' });
    }
    if (userRole === 'branch') {
      recipientConditions.push({ recipient_type: 'role_branch' });
    }

    const unreadCount = await prisma.notifications.count({
      where: {
        OR: recipientConditions,
        is_read: false,
      },
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark single notification as read
 */
export const markAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.admin?.id;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const notification = await prisma.notifications.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    // Verify user has access to this notification
    const hasAccess = await verifyNotificationAccess(userId, req.admin?.role || undefined, notification);
    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    const updatedNotification = await prisma.notifications.update({
      where: { id: parseInt(id) },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    // Emit WebSocket event for real-time sync
    if (global.io) {
      emitNotificationUpdate(global.io, {
        recipientType: notification.recipient_type,
        recipientId: notification.recipient_id,
        notificationId: notification.id,
        action: 'update',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.admin?.id;
    const userRole = req.admin?.role || undefined;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Build recipient conditions
    const recipientConditions: any[] = [
      { recipient_type: 'admin', recipient_id: userId },
    ];

    if (userRole === 'super_admin' || userRole === 'admin') {
      recipientConditions.push({ recipient_type: 'role_admin' });
    }
    if (userRole === 'branch') {
      recipientConditions.push({ recipient_type: 'role_branch' });
    }

    const { count } = await prisma.notifications.updateMany({
      where: {
        OR: recipientConditions,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    // Emit WebSocket event for real-time sync
    if (global.io) {
      emitNotificationUpdate(global.io, {
        recipientType: 'admin',
        recipientId: userId,
        action: 'mark_all_read',
      });
    }

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      data: { markedCount: count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete single notification
 */
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.admin?.id;
    const { id } = req.params;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const notification = await prisma.notifications.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    // Verify user has access to this notification
    const hasAccess = await verifyNotificationAccess(userId, req.admin?.role || undefined, notification);
    if (!hasAccess) {
      throw new AppError('Unauthorized', 403);
    }

    await prisma.notifications.delete({
      where: { id: parseInt(id) },
    });

    // Emit WebSocket event for real-time sync
    if (global.io) {
      emitNotificationUpdate(global.io, {
        recipientType: notification.recipient_type,
        recipientId: notification.recipient_id,
        notificationId: notification.id,
        action: 'delete',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all notifications for user
 */
export const clearAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.admin?.id;
    const userRole = req.admin?.role || undefined;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    // Build recipient conditions
    const recipientConditions: any[] = [
      { recipient_type: 'admin', recipient_id: userId },
    ];

    if (userRole === 'super_admin' || userRole === 'admin') {
      recipientConditions.push({ recipient_type: 'role_admin' });
    }
    if (userRole === 'branch') {
      recipientConditions.push({ recipient_type: 'role_branch' });
    }

    const { count } = await prisma.notifications.deleteMany({
      where: {
        OR: recipientConditions,
      },
    });

    // Emit WebSocket event for real-time sync
    if (global.io) {
      emitNotificationUpdate(global.io, {
        recipientType: 'admin',
        recipientId: userId,
        action: 'clear_all',
      });
    }

    res.json({
      success: true,
      message: `${count} notifications cleared`,
      data: { clearedCount: count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create test notification (for admin testing)
 */
export const createTestNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.admin?.id;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { type, isUrgent = false } = req.body;

    const typeConfig: Record<string, { title: string; message: string }> = {
      ATTENDANCE: {
        title: 'Test Attendance Notification',
        message: 'This is a test notification for attendance-related events.',
      },
      PAYROLL: {
        title: 'Test Payroll Notification',
        message: 'This is a test notification for payroll-related events.',
      },
      FINANCE: {
        title: 'Test Finance Notification',
        message: 'This is a test notification for finance-related events.',
      },
      SYSTEM: {
        title: 'Test System Notification',
        message: 'This is a test notification for system-related events.',
      },
      SECURITY: {
        title: 'Test Security Notification',
        message: 'This is a test notification for security-related events.',
      },
      PROJECT: {
        title: 'Test Project Notification',
        message: 'This is a test notification for project-related events.',
      },
    };

    const config = typeConfig[type] || typeConfig.SYSTEM;

    const notification = await prisma.notifications.create({
      data: {
        recipient_type: 'admin',
        recipient_id: userId,
        type: type || 'SYSTEM',
        title: config.title,
        message: config.message,
        link: '/dashboard/notifications',
      },
    });

    // Emit WebSocket event for real-time sync
    if (global.io) {
      emitNotificationUpdate(global.io, {
        recipientType: 'admin',
        recipientId: userId,
        notificationId: notification.id,
        action: 'create',
      });
    }

    res.json({
      success: true,
      message: 'Test notification created',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get notification stats
async function getNotificationStats(userId: number, userRole?: string) {
  // Build recipient conditions
  const recipientConditions: any[] = [
    { recipient_type: 'admin', recipient_id: userId },
  ];

  if (userRole === 'super_admin' || userRole === 'admin') {
    recipientConditions.push({ recipient_type: 'role_admin' });
  }
  if (userRole === 'branch') {
    recipientConditions.push({ recipient_type: 'role_branch' });
  }

  const baseWhere = { OR: recipientConditions };

  const [total, unread, byType] = await Promise.all([
    prisma.notifications.count({ where: baseWhere }),
    prisma.notifications.count({ where: { ...baseWhere, is_read: false } }),
    prisma.notifications.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { type: true },
    }),
  ]);

  const byTypeMap: Record<string, number> = {};
  byType.forEach((item) => {
    byTypeMap[item.type] = item._count.type;
  });

  return {
    total,
    unread,
    urgent: 0,
    byType: {
      ATTENDANCE: byTypeMap.ATTENDANCE || 0,
      PAYROLL: byTypeMap.PAYROLL || 0,
      SYSTEM: byTypeMap.SYSTEM || 0,
      SECURITY: byTypeMap.SECURITY || 0,
      PROJECT: byTypeMap.PROJECT || 0,
      FINANCE: byTypeMap.FINANCE || 0,
    },
  };
}

// Helper function to verify notification access
async function verifyNotificationAccess(
  userId: number,
  userRole: string | undefined,
  notification: any
): Promise<boolean> {
  // User-specific notification
  if (notification.recipient_type === 'admin' && notification.recipient_id === userId) {
    return true;
  }

  // Role-based notification
  if (notification.recipient_type === 'role_admin' && (userRole === 'super_admin' || userRole === 'admin')) {
    return true;
  }
  if (notification.recipient_type === 'role_branch' && userRole === 'branch') {
    return true;
  }

  return false;
}
