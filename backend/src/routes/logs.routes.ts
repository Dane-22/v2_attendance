import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getLogs,
  createLog,
  deleteLog
} from '../controllers/logs.controller';

const router = Router();

router.get('/', authenticate, getLogs);
router.post('/', authenticate, createLog);
router.delete('/:id', authenticate, deleteLog);

export default router;
