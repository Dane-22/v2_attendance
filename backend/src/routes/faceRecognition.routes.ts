import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  registerEmployeeFace,
  verifyEmployeeFace,
  getEmployeeFaceStatus,
  deleteEmployeeFace,
  getFaceLogs
} from '../controllers/faceRecognition.controller';

const router = Router();

// Register facial data for an employee (Admin only)
router.post('/register/:employeeId', authenticate, registerEmployeeFace);

// Verify facial data for an employee
router.post('/verify', verifyEmployeeFace);

// Get face registration status for an employee
router.get('/status/:employeeId', getEmployeeFaceStatus);

// Delete facial data for an employee (Admin only)
router.delete('/delete/:employeeId', authenticate, deleteEmployeeFace);

// Get face recognition logs for an employee
router.get('/logs/:employeeId', getFaceLogs);

export default router;
