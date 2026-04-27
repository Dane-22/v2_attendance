import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin
} from '../controllers/admin.controller';

const router = Router();

router.get('/', authenticate, getAllAdmins);
router.post('/', authenticate, createAdmin);
router.put('/:id', authenticate, updateAdmin);
router.delete('/:id', authenticate, deleteAdmin);

export default router;
