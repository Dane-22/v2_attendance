import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getSettings,
  updateSettings
} from '../controllers/settings.controller';

const router = Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);

export default router;
