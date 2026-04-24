import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  generateQRCode,
  uploadProfileImage,
  uploadMiddleware,
  transferEmployee
} from '../controllers/employee.controller';

const router = Router();

router.get('/', authenticate, getAllEmployees);
router.post('/', authenticate, createEmployee);
router.get('/:id', authenticate, getEmployeeById);
router.put('/:id', authenticate, updateEmployee);
router.delete('/:id', authenticate, deleteEmployee);
router.get('/:id/qr', authenticate, generateQRCode);
router.post('/:id/upload-profile-image', authenticate, uploadMiddleware, uploadProfileImage);
router.patch('/:id/transfer', authenticate, transferEmployee);

export default router;
