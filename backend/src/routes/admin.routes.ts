import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  uploadProfileImage,
  uploadMiddleware
} from '../controllers/admin.controller';

const router = Router();

router.get('/', authenticate, getAllAdmins);
router.post('/', authenticate, createAdmin);
router.put('/:id', authenticate, updateAdmin);
router.delete('/:id', authenticate, deleteAdmin);
router.post('/:id/upload-profile-image', authenticate, uploadMiddleware, uploadProfileImage);

export default router;
