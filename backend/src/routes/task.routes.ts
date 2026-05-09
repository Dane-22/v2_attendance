import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllTasks,
  getAllTasksAdmin,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  startTimer,
  stopTimer,
  getTimerStatus,
} from '../controllers/task.controller';

const router = Router();

// Admin route - get all tasks (super admin only)
router.get('/admin/all', authenticate, getAllTasksAdmin);

// Task CRUD routes
router.get('/', authenticate, getAllTasks);
router.post('/', authenticate, createTask);
router.get('/:id', authenticate, getTaskById);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, deleteTask);

// Timer routes
router.post('/:id/timer/start', authenticate, startTimer);
router.post('/:id/timer/stop', authenticate, stopTimer);
router.get('/:id/timer/status', authenticate, getTimerStatus);

export default router;
