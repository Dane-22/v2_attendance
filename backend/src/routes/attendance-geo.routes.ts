import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { decodeQRCodeData, extractEmployeeCode } from '../services/qr.service';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { SiteAllocationService } from '../services/siteAllocation.service';

const prisma = new PrismaClient();
const router = Router();

// Get Philippines date as YYYY-MM-DD string using Intl.DateTimeFormat
const getPhilippinesDateString = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const getPhilippinesDateRange = (): { start: Date; end: Date } => {
  const todayStr = getPhilippinesDateString();
  const [year, month, day] = todayStr.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 16, 0, 0));
  return { start, end };
};

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';

const determineStatus = (checkInTime: Date): AttendanceStatus => {
  const hour = checkInTime.getHours();
  const minute = checkInTime.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const workStartMinutes = 8 * 60; // 8:00 AM
  
  if (totalMinutes > workStartMinutes + 15) {
    return 'late';
  }
  return 'present';
};

const resolveAttendanceBranchCode = async (employee: { branchCode: string | null; branchId: number | null }, adminBranchCode?: string | null): Promise<string> => {
  let assignedBranchCode = employee.branchCode;

  if (!assignedBranchCode && employee.branchId) {
    const employeeBranch = await prisma.branches.findUnique({
      where: { id: employee.branchId },
      select: { branch_code: true }
    });
    if (employeeBranch?.branch_code) {
      assignedBranchCode = employeeBranch.branch_code;
    }
  }

  if (!assignedBranchCode) {
    throw new AppError('You are not assigned to any site. Report it to your engineer.', 403);
  }

  if (adminBranchCode && adminBranchCode !== assignedBranchCode) {
    throw new AppError('You are scanning at the wrong site. Report it to your engineer.', 403);
  }

  return assignedBranchCode;
};

// Test clock endpoint without geolocation validation
export const clockGeo = async (
  req: AuthenticatedRequest,
  res: any,
  next: any
): Promise<void> => {
  try {
    const { qrCodeData, notes } = req.body;

    // Get branch_code from logged-in admin (from JWT token)
    const adminBranchCode = req.admin?.branch_code;

    if (!qrCodeData) {
      throw new AppError('QR code data is required', 400);
    }

    // Decode employee code from QR data
    let employeeCode: string;
    try {
      const decoded = decodeQRCodeData(qrCodeData);
      employeeCode = decoded.employeeCode;
    } catch {
      employeeCode = extractEmployeeCode(qrCodeData) || '';
      if (!employeeCode) {
        throw new AppError('Invalid QR code format', 400);
      }
    }

    // Find employee
    const employee = await prisma.employee.findUnique({
      where: { employeeCode }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (employee.status !== 'Active') {
      throw new AppError('Employee account is not active', 403);
    }

    // Resolve branch code
    const resolvedBranchCode = await resolveAttendanceBranchCode(employee, adminBranchCode);

    const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
    const now = new Date();

    console.log('[CLOCK-GEO] Employee:', employee.id, 'Server time:', now.toISOString());

    // Use Prisma query to find active clock-in
    const activeRecord = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: todayStart,
          lt: todayEnd
        },
        check_in: { not: null },
        check_out: null
      },
      orderBy: { check_in: 'desc' }
    });

    console.log('[CLOCK-GEO] Active record found:', activeRecord ? `ID ${activeRecord.id}` : 'none');

    if (activeRecord) {
      // Employee has active clock-in → CLOCK OUT
      const checkOutTime = new Date();

      // Check branch mismatch
      if (adminBranchCode && activeRecord.branch_code && activeRecord.branch_code !== adminBranchCode) {
        throw new AppError(
          `Cannot clock out at this branch. Active clock-in is at ${activeRecord.branch_code}.`,
          409
        );
      }

      // Update attendance record
      const updatedRecord = await prisma.attendance.update({
        where: { id: activeRecord.id },
        data: {
          check_out: checkOutTime
        }
      });

      console.log('[CLOCK-GEO] Clock OUT successful for employee:', employee.id);

      const response = {
        success: true,
        message: `Clocked out successfully at ${checkOutTime.toLocaleTimeString()}`,
        data: {
          action: 'clock_out',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          attendance: updatedRecord
        }
      };

      res.json(response);
    } else {
      // No active clock-in → CLOCK IN
      const checkInTime = new Date();
      const status = determineStatus(checkInTime);
      const todayStr = getPhilippinesDateString();

      // --- SITE ALLOCATION INTEGRATION ---
      const isAllocated = await SiteAllocationService.verifyWorkerAllocation(
        employee.id, 
        resolvedBranchCode, 
        todayStr
      );

      if (!isAllocated) {
        throw new AppError('Employee is not allocated to this site for today.', 403);
      }
      // -----------------------------------

      // Insert attendance record
      const newRecord = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: new Date(todayStr),
          check_in: checkInTime,
          status,
          branch_code: resolvedBranchCode,
          notes: notes || null
        }
      });

      console.log('[CLOCK-GEO] Clock IN successful for employee:', employee.id);

      const response = {
        success: true,
        message: `Clocked in successfully at ${checkInTime.toLocaleTimeString()}`,
        data: {
          action: 'clock_in',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          attendance: newRecord
        }
      };

      res.status(201).json(response);
    }
  } catch (error) {
    next(error);
  }
};

// Register test routes
router.post('/clock-geo', optionalAuth, clockGeo);

export default router;
