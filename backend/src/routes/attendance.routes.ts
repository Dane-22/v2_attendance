import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import {
  clock,
  clockIn,
  clockOut,
  manualClockIn,
  manualClockOut,
  getAttendanceRecords,
  getMyAttendance,
  getAttendanceStats,
  getTodayAttendance,
  getAttendanceAudit
} from '../controllers/attendance.controller';

const router = Router();

router.post('/clock', optionalAuth, clock);
router.post('/clock-in', optionalAuth, clockIn);
router.post('/clock-out', optionalAuth, clockOut);
router.post('/manual-clock-in', authenticate, manualClockIn);
router.post('/manual-clock-out', authenticate, manualClockOut);
router.get('/audit', authenticate, getAttendanceAudit);
router.get('/today', authenticate, getTodayAttendance);
router.get('/stats', authenticate, getAttendanceStats);
router.get('/my', authenticate, getMyAttendance);
router.get('/', authenticate, getAttendanceRecords);

export default router;
