import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllPayroll,
  getMyPayroll,
  getPayrollById,
  calculatePayroll,
  processPayroll,
  updatePayrollStatus
} from '../controllers/payroll.controller';

const router = Router();

router.get('/', authenticate, getAllPayroll);
router.get('/my', authenticate, getMyPayroll);
router.post('/calculate', authenticate, calculatePayroll);
router.get('/:id', authenticate, getPayrollById);
router.post('/:id/process', authenticate, processPayroll);
router.patch('/:id/status', authenticate, updatePayrollStatus);

export default router;
