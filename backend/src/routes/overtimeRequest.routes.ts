import { Router, Request, Response } from 'express';
import { OvertimeRequestController } from '../controllers/overtimeRequest.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// POST /api/overtime-requests - Create overtime request
router.post('/', async (req: Request, res: Response) => {
  const result = await OvertimeRequestController.createOvertimeRequest(req, req.body);
  res.json(result);
});

// POST /api/overtime-requests/batch - Create batch overtime requests
router.post('/batch', async (req: Request, res: Response) => {
  const result = await OvertimeRequestController.createBatchOvertimeRequests(req, req.body);
  res.json(result);
});

// GET /api/overtime-requests - List overtime requests with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  const result = await OvertimeRequestController.getOvertimeRequests(req, req.query);
  res.json(result);
});

// GET /api/overtime-requests/:id - Get overtime request by ID
router.get('/:id', async (req: Request, res: Response) => {
  const result = await OvertimeRequestController.getOvertimeRequestById(req, parseInt(req.params.id));
  res.json(result);
});

// PATCH /api/overtime-requests/:id/approve - Approve overtime request
router.patch('/:id/approve', async (req: Request, res: Response) => {
  const result = await OvertimeRequestController.approveOvertimeRequest(req, parseInt(req.params.id), req.body);
  res.json(result);
});

// PATCH /api/overtime-requests/:id/reject - Reject overtime request
router.patch('/:id/reject', async (req: Request, res: Response) => {
  const result = await OvertimeRequestController.rejectOvertimeRequest(req, parseInt(req.params.id), req.body);
  res.json(result);
});

export default router;
