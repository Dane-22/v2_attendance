import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logUpdate } from '../services/activityLogger.service';

const router = Router();
const prisma = new PrismaClient();

// POST /api/webhooks/drag-and-drop-sync
router.post('/drag-and-drop-sync', async (req, res) => {
  try {
    const { employeeId, branchCode, date } = req.body;

    if (!employeeId || !branchCode || !date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if the date is exactly today's date in local time
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // YYYY-MM-DD
    if (date !== todayStr) {
      // We only sync transfers for the current day to avoid changing current branch for future allocations
      return res.json({ success: true, message: 'Date is not today, skipping employee transfer.' });
    }

    // Find the employee
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // If employee is already in this branch, do nothing
    if (employee.branchCode === branchCode) {
      return res.json({ success: true, message: 'Employee already in the target branch.' });
    }

    // Check if destination branch exists
    const destinationBranch = await prisma.branches.findUnique({
      where: { branch_code: branchCode }
    });

    if (!destinationBranch) {
      return res.status(404).json({ success: false, message: 'Destination branch not found' });
    }

    // Check if employee has active clock-in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: today,
          lt: tomorrow
        },
        check_in: { not: null },
        check_out: null
      }
    });

    if (activeAttendance) {
      return res.status(400).json({ success: false, message: 'Cannot transfer employee with active clock-in.' });
    }

    const previousBranch = employee.branchCode;

    // Update employee branch
    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(employeeId) },
      data: {
        branchCode,
        branchName: destinationBranch.branch_name,
        branchId: destinationBranch.id
      }
    });

    // Log employee transfer using a System identifier
    await logUpdate({
      userId: 0,
      userName: 'System (Drag&Drop)',
      userRole: 'system',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Transferred employee ${employee.employeeCode} - ${employee.firstName} ${employee.lastName} from ${previousBranch} to ${branchCode} via Drag & Drop UI`,
      detailsBefore: { branchCode: previousBranch, branchName: employee.branchName },
      detailsAfter: { branchCode, branchName: destinationBranch.branch_name },
      changes: ['branchCode', 'branchName'],
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'system',
      branchId: employee.branchId || undefined,
      metadata: { previousBranch, newBranch: branchCode, source: 'drag-and-drop' }
    });

    res.json({ success: true, message: 'Employee synced successfully from drag & drop' });
  } catch (error: any) {
    console.error('Error in drag-and-drop-sync webhook:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
