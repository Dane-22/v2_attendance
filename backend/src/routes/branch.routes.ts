import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getBranches,
  getBranchEmployees
} from '../controllers/branch.controller';

const router = Router();

router.get('/', authenticate, getBranches);
router.get('/:branchCode/employees', authenticate, getBranchEmployees);

export default router;
