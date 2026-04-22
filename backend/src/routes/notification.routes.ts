import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll,
  createTestNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Get notifications list with pagination and filtering
router.get('/', authenticate, getNotifications);

// Get unread count for bell icon
router.get('/unread-count', authenticate, getUnreadCount);

// Mark single notification as read
router.put('/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticate, markAllAsRead);

// Delete single notification
router.delete('/:id', authenticate, deleteNotification);

// Clear all notifications
router.delete('/clear-all', authenticate, clearAll);

// Create test notification (for admin testing)
router.post('/test', authenticate, createTestNotification);

export default router;
