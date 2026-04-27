import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllBranchUsers,
  createBranchUser,
  updateBranchUser,
  deleteBranchUser
} from '../controllers/branch-user.controller';

const router = Router();

router.get('/', authenticate, getAllBranchUsers);
router.post('/', authenticate, createBranchUser);
router.put('/:id', authenticate, updateBranchUser);
router.delete('/:id', authenticate, deleteBranchUser);

export default router;
