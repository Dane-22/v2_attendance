import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { logRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  getLogs,
  createLog,
  deleteLog
} from '../controllers/logs.controller';

const router = Router();

// Apply rate limiter to all log endpoints
router.use(...logRateLimiter);

router.get('/', authenticate, getLogs);
router.post('/', authenticate, createLog);
router.delete('/:id', authenticate, deleteLog);

export default router;
