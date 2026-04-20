import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAttendanceReport,
  getPayrollReport,
  getEmployeeSummary,
  exportReport
} from '../controllers/report.controller';

const router = Router();

router.get('/attendance', authenticate, getAttendanceReport);
router.get('/payroll', authenticate, getPayrollReport);
router.get('/summary', authenticate, getEmployeeSummary);
router.get('/export/:type', authenticate, exportReport);

export default router;
