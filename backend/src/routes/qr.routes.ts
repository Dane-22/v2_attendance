import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  decodeQRCode,
  generateEmployeeQR,
  verifyQRCode
} from '../controllers/qr.controller';

const router = Router();

router.post('/decode', decodeQRCode);
router.get('/generate/:employeeId', authenticate, generateEmployeeQR);
router.post('/verify', verifyQRCode);

export default router;
