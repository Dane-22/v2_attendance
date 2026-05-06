import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Attendance } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse, AttendanceResponse } from '../types/api.types';
import { decodeQRCodeData, extractEmployeeCode } from '../services/qr.service';
import { logScan, logCreate, logUpdate, logError } from '../services/activityLogger.service';
import { emitAttendanceUpdate, emitStatsUpdate } from '../routes/websocket.routes';

const prisma = new PrismaClient();
const RECENT_SCAN_WINDOW_MS = 3000;
const recentScansByEmployee = new Map<number, number>();

// Get Philippines date as YYYY-MM-DD string using Intl.DateTimeFormat
// This ensures we get the correct date components for Asia/Manila timezone
const getPhilippinesDateString = (): string => {
  const now = new Date();
  // Use Intl.DateTimeFormat to get Philippines date components
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

const getPhilippinesDateRangeForDate = (dateStr: string): { start: Date; end: Date } => {
  const [yearRaw, monthRaw, dayRaw] = dateStr.split('-');
  const year = parseInt(yearRaw || '0', 10);
  const month = parseInt(monthRaw || '0', 10);
  const day = parseInt(dayRaw || '0', 10);

  if (!year || !month || !day) {
    throw new AppError('Invalid date format. Expected YYYY-MM-DD', 400);
  }

  return {
    start: new Date(Date.UTC(year, month - 1, day)),
    end: new Date(Date.UTC(year, month - 1, day + 1))
  };
};

const resolveAttendanceBranchCode = async (employee: { branchCode: string | null; branchId: number | null }, adminBranchCode?: string | null): Promise<string> => {
  if (adminBranchCode) return adminBranchCode;
  if (employee.branchCode) return employee.branchCode;

  if (employee.branchId) {
    const employeeBranch = await prisma.branches.findUnique({
      where: { id: employee.branchId },
      select: { branch_code: true }
    });

    if (employeeBranch?.branch_code) {
      return employeeBranch.branch_code;
    }
  }

  throw new AppError('Unable to resolve branch code for attendance record', 422);
};

// Unified clock endpoint - uses raw SQL to bypass Prisma @db.Date timezone bugs
export const clock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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

    const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
    const now = new Date();

    console.log('[CLOCK] Employee:', employee.id, 'Date range:', todayStart.toISOString(), 'to', todayEnd.toISOString(), 'Server time:', now.toISOString());

    // Use Prisma query to find active clock-in - finds most recent incomplete record
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

    console.log('[CLOCK] Active record found:', activeRecord ? `ID ${activeRecord.id}` : 'none');

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

      // Update using raw SQL
      await prisma.$executeRaw`
        UPDATE attendance 
        SET check_out = ${checkOutTime}, updated_at = NOW()
        WHERE id = ${activeRecord.id}
      `;

      // Fetch the updated record
      const updatedRecord = await prisma.attendance.findUnique({
        where: { id: activeRecord.id }
      });

      console.log('[CLOCK] Clock OUT successful for employee:', employee.id);

      // Log clock out
      await logUpdate({
        userId: req.admin?.id || employee.id,
        userName: req.admin?.name || employee.firstName || 'unknown',
        userRole: req.admin?.role || 'employee',
        entityType: 'ATTENDANCE',
        entityId: updatedRecord?.id.toString(),
        entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
        description: `Clock OUT: ${employee.firstName} ${employee.lastName} at ${checkOutTime.toLocaleTimeString()}`,
        detailsBefore: activeRecord,
        detailsAfter: updatedRecord,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        branchId: employee.branchId || undefined,
        metadata: { method: 'qr_scan', branch_code: activeRecord.branch_code },
      });

      // Emit WebSocket event for real-time update
      if (global.io && activeRecord.branch_code) {
        emitAttendanceUpdate(global.io, activeRecord.branch_code, {
          attendanceId: updatedRecord?.id || activeRecord.id,
          type: 'clock_out',
          action: 'clock_out',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode || '',
          branchCode: activeRecord.branch_code,
          branchName: activeRecord.branch_code || '',
          timestamp: checkOutTime.toISOString(),
          previousStatus: 'present',
          newStatus: 'completed',
          status: 'completed'
        });
      }

      const response: ApiResponse<any> = {
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
      const resolvedBranchCode = await resolveAttendanceBranchCode(employee, adminBranchCode);

      const nowMs = Date.now();
      const lastScanMs = recentScansByEmployee.get(employee.id);
      if (lastScanMs && nowMs - lastScanMs < RECENT_SCAN_WINDOW_MS) {
        const response: ApiResponse<any> = {
          success: true,
          message: 'Duplicate scan ignored',
          data: {
            ignored: true,
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`
          }
        };
        res.status(200).json(response);
        return;
      }
      recentScansByEmployee.set(employee.id, nowMs);

      // Check if employee needs to be transferred (different branch)
      const needsTransfer = employee.branchCode !== resolvedBranchCode;
      let previousBranch: string | null = null;
      let transferResult: { attendance: any; updatedEmployee: any } | null = null;

      if (needsTransfer && adminBranchCode) {
        // Validate destination branch exists
        const destinationBranch = await prisma.branches.findUnique({
          where: { branch_code: adminBranchCode }
        });

        if (!destinationBranch) {
          throw new AppError('Destination branch not found', 404);
        }

        previousBranch = employee.branchCode;

        // Perform atomic transaction: clock-in + transfer
        transferResult = await prisma.$transaction(async (tx) => {
          // Use raw SQL to insert attendance - bypasses Prisma timezone conversion on date field
          const todayStr = getPhilippinesDateString();
          await tx.$executeRaw`
            INSERT INTO attendance (employee_id, date, check_in, status, branch_code, notes, created_at, updated_at)
            VALUES (${employee.id}, ${todayStr}, ${checkInTime}, ${status}, ${resolvedBranchCode}, ${notes || null}, NOW(), NOW())
          `;

          // Fetch the created attendance record
          const attendance = await tx.attendance.findFirst({
            where: { employeeId: employee.id },
            orderBy: { id: 'desc' }
          });

          // Update employee branch
          const updatedEmployee = await tx.employee.update({
            where: { id: employee.id },
            data: {
              branchCode: adminBranchCode,
              branchName: destinationBranch.branch_name,
              branchId: destinationBranch.id
            },
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              branchName: true,
              branchCode: true,
              branchId: true,
              status: true
            }
          });

          return { attendance, updatedEmployee };
        });

        // Log auto-transfer action
        await logUpdate({
          userId: req.admin?.id || employee.id,
          userName: req.admin?.name || employee.firstName || 'unknown',
          userRole: req.admin?.role || 'employee',
          entityType: 'EMPLOYEE',
          entityId: employee.id.toString(),
          entityName: `${employee.firstName} ${employee.lastName}`,
          description: `QR Scan transfer on clock in at ${adminBranchCode} from ${previousBranch}`,
          detailsBefore: { branchCode: previousBranch, branchName: employee.branchName },
          detailsAfter: { branchCode: adminBranchCode, branchName: destinationBranch.branch_name },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { method: 'qr_scan_auto_transfer', employeeId: employee.id, previousBranch, newBranch: adminBranchCode }
        });

        console.log('[CLOCK] Clock IN with TRANSFER successful for employee:', employee.id, 'transferred from', previousBranch, 'to', adminBranchCode);
      } else {
        // Same branch - just clock in without transfer
        const todayStr = getPhilippinesDateString();
        await prisma.$executeRaw`
          INSERT INTO attendance (employee_id, date, check_in, status, branch_code, notes, created_at, updated_at)
          VALUES (${employee.id}, ${todayStr}, ${checkInTime}, ${status}, ${resolvedBranchCode}, ${notes || null}, NOW(), NOW())
        `;

        console.log('[CLOCK] Clock IN successful for employee:', employee.id, 'date range:', todayStart.toISOString());
      }

      // Fetch the created record (outside transaction for non-transfer, or from result)
      const newRecord = transferResult?.attendance || await prisma.attendance.findFirst({
        where: { employeeId: employee.id },
        orderBy: { id: 'desc' }
      });

      // Log clock in
      await logScan({
        userId: req.admin?.id || employee.id,
        userName: req.admin?.name || employee.firstName || 'unknown',
        userRole: req.admin?.role || 'employee',
        entityType: 'ATTENDANCE',
        entityId: newRecord?.id.toString(),
        entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
        description: needsTransfer
          ? `Clock IN with transfer: ${employee.firstName} ${employee.lastName} at ${checkInTime.toLocaleTimeString()} (transferred from ${previousBranch})`
          : `Clock IN: ${employee.firstName} ${employee.lastName} at ${checkInTime.toLocaleTimeString()}`,
        detailsAfter: newRecord,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        branchId: transferResult?.updatedEmployee?.branchId || employee.branchId || undefined,
        metadata: { method: 'qr_scan', branch_code: resolvedBranchCode, status, transferred: needsTransfer, previousBranch },
      });

      // Emit WebSocket event for real-time update
      const branchCode = resolvedBranchCode;
      if (global.io) {
        // Emit to new/current branch
        emitAttendanceUpdate(global.io, branchCode, {
          attendanceId: newRecord?.id,
          type: 'clock_in',
          action: 'clock_in',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode || '',
          branchCode: branchCode,
          branchName: branchCode,
          timestamp: checkInTime.toISOString(),
          previousStatus: 'available',
          newStatus: status,
          status,
          transferred: needsTransfer,
          previousBranch: previousBranch
        });

        // If transferred, also emit to old branch
        if (needsTransfer && previousBranch) {
          emitAttendanceUpdate(global.io, previousBranch, {
            attendanceId: newRecord?.id,
            type: 'clock_in',
            action: 'clock_in',
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeCode || '',
            branchCode: branchCode,
            branchName: branchCode,
            timestamp: checkInTime.toISOString(),
            previousStatus: 'available',
            newStatus: status,
            status,
            transferred: true,
            previousBranch: previousBranch
          });
        }
      }

      const response: ApiResponse<any> = {
        success: true,
        message: needsTransfer
          ? `Clocked in and transferred from ${previousBranch} to ${resolvedBranchCode}`
          : `Clocked in successfully at ${checkInTime.toLocaleTimeString()}`,
        data: {
          action: 'clock_in',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          attendance: newRecord,
          transferred: needsTransfer,
          previousBranch: previousBranch,
          currentBranch: resolvedBranchCode,
          employee: transferResult?.updatedEmployee
        }
      };

      res.status(201).json(response);
    }
  } catch (error) {
    next(error);
  }
};

// Helper to get Philippines date range (for Prisma queries in manual endpoints)
const getPhilippinesDateRange = (): { start: Date; end: Date } => {
  const now = new Date();
  // Use Intl.DateTimeFormat to get correct Philippines date components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const start = new Date(Date.UTC(year, month, day));
  const end = new Date(Date.UTC(year, month, day + 1));
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

const performClockIn = async (
  employee: { id: number; branchName: string | null; branchCode?: string | null; status: string | null },
  notes: string | undefined,
  isManual: boolean,
  branchCode?: string
): Promise<{ attendance: Attendance; message: string }> => {
  const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
  console.log('[CLOCK-IN DEBUG] Philippines date range:', todayStart.toISOString(), 'to', todayEnd.toISOString());
  console.log('[CLOCK-IN DEBUG] Server time:', new Date().toISOString());

  // Check if employee has an active (incomplete) shift at a different branch
  const activeShift = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: {
        gte: todayStart,
        lt: todayEnd
      },
      check_in: { not: null },
      check_out: null
    }
  });

  console.log('[CLOCK-IN DEBUG] Active shift found:', activeShift);
  console.log('[CLOCK-IN DEBUG] Branch code requested:', branchCode);

  // If trying to clock in at different branch while having active shift
  if (activeShift && branchCode && activeShift.branch_code !== branchCode) {
    throw new AppError(
      `Cannot clock in at this branch. Employee must clock out from ${activeShift.branch_code} first.`,
      409
    );
  }

  const checkInTime = new Date();
  const status = determineStatus(checkInTime);

  // Check if employee has an existing absent row for today (auto-marked absent)
  const absentRecord = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: {
        gte: todayStart,
        lt: todayEnd
      },
      status: 'absent',
      check_in: null,
      check_out: null
    }
  });

  if (absentRecord) {
    // Update the existing absent row instead of creating a new one
    const attendance = await prisma.attendance.update({
      where: { id: absentRecord.id },
      data: {
        check_in: checkInTime,
        status,
      branch_code: branchCode || employee.branchCode || absentRecord.branch_code || undefined,
        notes: notes || absentRecord.notes
      }
    });

    const method = isManual ? 'Manually clocked in' : 'Clocked in';
    const message = `${method} successfully at ${checkInTime.toLocaleTimeString()}`;

    return { attendance, message };
  }

  // No absent record - create new attendance record (allow multiple per day)
  const attendance = await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date: todayStart,
      check_in: checkInTime,
      status,
      branch_code: branchCode || employee.branchCode || undefined,
      notes
    }
  });

  const method = isManual ? 'Manually clocked in' : 'Clocked in';
  const message = `${method} successfully at ${checkInTime.toLocaleTimeString()}`;

  return { attendance, message };
};

const performClockOut = async (
  employee: { id: number; employeeCode: string | null },
  notes: string | undefined,
  isManual: boolean
): Promise<{ attendance: Attendance; message: string }> => {
  const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
  
  console.log('[CLOCK-OUT DEBUG] Philippines date range:', todayStart.toISOString(), 'to', todayEnd.toISOString());

  // Find the most recent incomplete attendance record (has check_in but no check_out)
  const attendance = await prisma.attendance.findFirst({
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

  if (!attendance) {
    throw new AppError('No active clock-in record found for today', 400);
  }

  const checkOutTime = new Date();

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      check_out: checkOutTime,
      notes: notes || attendance.notes
    }
  });

  const method = isManual ? 'Manually clocked out' : 'Clocked out';
  const message = `${method} successfully at ${checkOutTime.toLocaleTimeString()}`;

  return { attendance: updatedAttendance, message };
};

export const clockIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrCodeData, notes } = req.body;

    console.log('[API DEBUG] clockIn called with qrCodeData:', qrCodeData?.substring(0, 30));

    if (!qrCodeData) {
      throw new AppError('QR code data is required', 400);
    }

    let employeeCode: string;

    try {
      const decoded = decodeQRCodeData(qrCodeData);
      employeeCode = decoded.employeeCode;
      console.log('[API DEBUG] Decoded employeeCode:', employeeCode);
    } catch {
      employeeCode = extractEmployeeCode(qrCodeData) || '';
      console.log('[API DEBUG] Extracted employeeCode:', employeeCode);
      if (!employeeCode) {
        throw new AppError('Invalid QR code format', 400);
      }
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeCode }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    console.log('[API DEBUG] Found employee ID:', employee.id);

    if (employee.status !== 'Active') {
      throw new AppError('Employee account is not active', 403);
    }

    const { attendance, message } = await performClockIn(employee, notes, false);
    console.log('[API DEBUG] Created attendance record:', { id: attendance.id, date: attendance.date, check_in: attendance.check_in });

    // Log QR scan clock in
    await logScan({
      userId: employee.id,
      userName: `${employee.firstName} ${employee.lastName}`,
      userRole: 'employee',
      entityType: 'ATTENDANCE',
      entityId: attendance.id.toString(),
      entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
      description: `QR Scan Clock IN: ${employee.firstName} ${employee.lastName}`,
      detailsAfter: attendance,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
      metadata: { method: 'qr_scan', employeeCode: employee.employeeCode },
    });

    // Emit WebSocket event for real-time update
    const branchCode = employee.branchCode || employee.branchName || 'A';
    if (global.io) {
      emitAttendanceUpdate(global.io, branchCode, {
        attendanceId: attendance.id,
        type: 'clock_in',
        action: 'clock_in',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode || '',
        branchCode: branchCode,
        branchName: branchCode,
        timestamp: new Date().toISOString(),
        previousStatus: 'available',
        newStatus: attendance.status || 'present',
        status: attendance.status || 'present'
      });
    }

    const response: ApiResponse<AttendanceResponse> = {
      success: true,
      message,
      data: attendance as AttendanceResponse
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const manualClockIn = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId, notes, branch_code } = req.body;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (employee.status !== 'Active') {
      throw new AppError('Employee account is not active', 403);
    }

    const { attendance, message } = await performClockIn(employee, notes, true, branch_code);

    // Log manual clock in
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ATTENDANCE',
      entityId: attendance.id.toString(),
      entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
      description: `Manual Clock IN: ${employee.firstName} ${employee.lastName} by ${req.admin?.name}`,
      detailsAfter: attendance,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
      metadata: { method: 'manual', employeeId: employee.id, branch_code },
    });

    // Emit WebSocket event for real-time update
    const branchCode = branch_code || employee.branchCode || employee.branchName || 'A';
    if (global.io) {
      emitAttendanceUpdate(global.io, branchCode, {
        attendanceId: attendance.id,
        type: 'clock_in',
        action: 'clock_in',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode || '',
        branchCode: branchCode,
        branchName: branchCode,
        timestamp: new Date().toISOString(),
        previousStatus: 'available',
        newStatus: attendance.status || 'present',
        status: attendance.status || 'present'
      });
    }

    const response: ApiResponse<AttendanceResponse> = {
      success: true,
      message,
      data: attendance as AttendanceResponse
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const manualClockInWithTransfer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId, notes, branch_code } = req.body;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    if (!branch_code) {
      throw new AppError('Branch code is required', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (employee.status !== 'Active') {
      throw new AppError('Employee account is not active', 403);
    }

    // Validate destination branch exists
    const destinationBranch = await prisma.branches.findUnique({
      where: { branch_code: branch_code }
    });

    if (!destinationBranch) {
      throw new AppError('Destination branch not found', 404);
    }

    // Check if employee has active clock-in (enforce restriction)
    const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeId,
        date: {
          gte: todayStart,
          lt: todayEnd
        },
        check_in: { not: null },
        check_out: null
      }
    });

    if (activeAttendance) {
      throw new AppError('Cannot transfer employee with active clock-in. Please clock out first.', 400);
    }

    // Check if employee's branchCode differs from requested branch_code
    if (employee.branchCode === branch_code) {
      // Same branch - perform normal clock-in only
      const { attendance, message } = await performClockIn(employee, notes, true, branch_code);

      // Log manual clock in
      await logCreate({
        userId: req.admin?.id || 0,
        userName: req.admin?.name || 'unknown',
        userRole: req.admin?.role || 'admin',
        entityType: 'ATTENDANCE',
        entityId: attendance.id.toString(),
        entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
        description: `Manual Clock IN: ${employee.firstName} ${employee.lastName} by ${req.admin?.name}`,
        detailsAfter: attendance,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        branchId: employee.branchId || undefined,
        metadata: { method: 'manual', employeeId: employee.id, branch_code },
      });

      // Emit WebSocket event
      const branchCode = branch_code || employee.branchCode || employee.branchName || 'A';
      if (global.io) {
        emitAttendanceUpdate(global.io, branchCode, {
          attendanceId: attendance.id,
          type: 'clock_in',
          action: 'clock_in',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode || '',
          branchCode: branchCode,
          branchName: branchCode,
          timestamp: new Date().toISOString(),
          previousStatus: 'available',
          newStatus: attendance.status || 'present',
          status: attendance.status || 'present'
        });
      }

      const response: ApiResponse<AttendanceResponse> = {
        success: true,
        message,
        data: attendance as AttendanceResponse
      };

      res.status(201).json(response);
      return;
    }

    // Different branch - perform atomic transaction (clock-in + transfer)
    const previousBranch = employee.branchCode;
    const previousBranchName = employee.branchName;

    const result = await prisma.$transaction(async (tx) => {
      // Create attendance record
      const { attendance } = await performClockIn(employee, notes, true, branch_code);

      // Update employee branch
      const updatedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: {
          branchCode: branch_code,
          branchName: destinationBranch.branch_name,
          branchId: destinationBranch.id
        },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          branchName: true,
          branchCode: true,
          branchId: true,
          status: true
        }
      });

      return { attendance, updatedEmployee };
    });

    // Log auto-transfer action
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `transfer on clock in at ${branch_code} from ${previousBranch}`,
      detailsBefore: { branchCode: previousBranch, branchName: previousBranchName },
      detailsAfter: { branchCode: branch_code, branchName: destinationBranch.branch_name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { method: 'auto_transfer_on_clock_in', employeeId: employee.id, previousBranch, newBranch: branch_code }
    });

    // Log attendance
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ATTENDANCE',
      entityId: result.attendance.id.toString(),
      entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
      description: `Manual Clock IN with transfer: ${employee.firstName} ${employee.lastName} by ${req.admin?.name}`,
      detailsAfter: result.attendance,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: destinationBranch.id,
      metadata: { method: 'manual_with_transfer', employeeId: employee.id, branch_code, previousBranch }
    });

    // Emit WebSocket event to both old and new branches
    if (global.io) {
      // Emit to new branch
      emitAttendanceUpdate(global.io, branch_code, {
        attendanceId: result.attendance.id,
        type: 'clock_in',
        action: 'clock_in',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode || '',
        branchCode: branch_code,
        branchName: branch_code,
        timestamp: new Date().toISOString(),
        previousStatus: 'available',
        newStatus: result.attendance.status || 'present',
        status: result.attendance.status || 'present'
      });

      // Emit to old branch if different
      if (previousBranch && previousBranch !== branch_code) {
        emitAttendanceUpdate(global.io, previousBranch, {
          attendanceId: result.attendance.id,
          type: 'clock_in',
          action: 'clock_in',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeCode || '',
          branchCode: branch_code,
          branchName: branch_code,
          timestamp: new Date().toISOString(),
          previousStatus: 'available',
          newStatus: result.attendance.status || 'present',
          status: result.attendance.status || 'present'
        });
      }
    }

    const response: ApiResponse<{ attendance: AttendanceResponse; employee: any; previousBranch: string | null }> = {
      success: true,
      message: 'Clock-in and transfer successful',
      data: {
        attendance: result.attendance as AttendanceResponse,
        employee: result.updatedEmployee,
        previousBranch: previousBranch
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const clockOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrCodeData, notes } = req.body;

    if (!qrCodeData) {
      throw new AppError('QR code data is required', 400);
    }

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

    const employee = await prisma.employee.findUnique({
      where: { employeeCode }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const { attendance, message } = await performClockOut(employee, notes, false);

    // Log QR scan clock out
    await logUpdate({
      userId: employee.id,
      userName: `${employee.firstName} ${employee.lastName}`,
      userRole: 'employee',
      entityType: 'ATTENDANCE',
      entityId: attendance.id.toString(),
      entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
      description: `QR Scan Clock OUT: ${employee.firstName} ${employee.lastName}`,
      detailsAfter: attendance,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
      metadata: { method: 'qr_scan', employeeCode: employee.employeeCode },
    });

    // Emit WebSocket event for real-time update
    const branchCode = employee.branchCode || employee.branchName || 'A';
    if (global.io) {
      emitAttendanceUpdate(global.io, branchCode, {
        attendanceId: attendance.id,
        type: 'clock_out',
        action: 'clock_out',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode || '',
        branchCode: branchCode,
        branchName: branchCode,
        timestamp: new Date().toISOString(),
        previousStatus: 'present',
        newStatus: 'completed',
        status: 'completed'
      });
    }

    const response: ApiResponse<AttendanceResponse> = {
      success: true,
      message,
      data: attendance as AttendanceResponse
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const manualClockOut = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId, notes } = req.body;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const { attendance, message } = await performClockOut(employee, notes, true);

    // Log manual clock out
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ATTENDANCE',
      entityId: attendance.id.toString(),
      entityName: `Attendance for ${employee.firstName} ${employee.lastName}`,
      description: `Manual Clock OUT: ${employee.firstName} ${employee.lastName} by ${req.admin?.name}`,
      detailsAfter: attendance,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
      metadata: { method: 'manual', employeeId: employee.id },
    });

    // Emit WebSocket event for real-time update
    const branchCode = employee.branchCode || employee.branchName || 'A';
    if (global.io) {
      emitAttendanceUpdate(global.io, branchCode, {
        attendanceId: attendance.id,
        type: 'clock_out',
        action: 'clock_out',
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeCode: employee.employeeCode || '',
        branchCode: branchCode,
        branchName: branchCode,
        timestamp: new Date().toISOString(),
        previousStatus: 'present',
        newStatus: 'completed',
        status: 'completed'
      });
    }

    const response: ApiResponse<AttendanceResponse> = {
      success: true,
      message,
      data: attendance as AttendanceResponse
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceRecords = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const branch_code = req.query.branch_code as string | undefined;

    const where: any = {};
    
    if (employeeId) where.employeeId = employeeId;
    if (branch_code) where.branch_code = branch_code;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = getPhilippinesDateRangeForDate(startDate).start;
      if (endDate) where.date.lt = getPhilippinesDateRangeForDate(endDate).end;
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' }
      }),
      prisma.attendance.count({ where })
    ]);

    // Fetch employees separately since there's no relation in schema
    const employeeIds = [...new Set(records.map(r => r.employeeId))];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, employeeCode: true, firstName: true, lastName: true, department: true }
    });
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Merge employee data into attendance records
    const recordsWithEmployee = records.map(r => ({
      ...r,
      employee: employeeMap.get(r.employeeId) || undefined
    }));

    const response: PaginatedResponse<AttendanceResponse> = {
      success: true,
      message: 'Attendance records retrieved successfully',
      data: recordsWithEmployee as AttendanceResponse[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const employeeId = parseInt(req.query.employeeId as string);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const where: any = { employeeId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = getPhilippinesDateRangeForDate(startDate).start;
      if (endDate) where.date.lt = getPhilippinesDateRangeForDate(endDate).end;
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' }
      }),
      prisma.attendance.count({ where })
    ]);

    const response: PaginatedResponse<Attendance> = {
      success: true,
      message: 'Attendance records retrieved',
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.query.employeeId as string);
    const now = new Date();
    const currentMonthStart = getPhilippinesDateString().replace(/-\d{2}$/, '-01');
    const startDateInput = (req.query.startDate as string | undefined) || currentMonthStart;
    const endDateInput = (req.query.endDate as string | undefined) || getPhilippinesDateString();
    const startDate = getPhilippinesDateRangeForDate(startDateInput).start;
    const endDate = getPhilippinesDateRangeForDate(endDateInput).end;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === 'present').length;
    const lateDays = records.filter((r) => r.status === 'late').length;
    const absentDays = records.filter((r) => r.status === 'absent').length;
    
    // Calculate hours from check_in/check_out
    const totalHours = records.reduce((sum: number, r) => {
      if (r.check_in && r.check_out) {
        const diffMs = r.check_out.getTime() - r.check_in.getTime();
        return sum + (diffMs / (1000 * 60 * 60));
      }
      return sum;
    }, 0);

    const response: ApiResponse<{
      period: { start: string; end: string };
      stats: {
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        totalHours: number;
        overtimeHours: number;
        averageHoursPerDay: number;
      }
    }> = {
      success: true,
      message: 'Attendance statistics retrieved',
      data: {
        period: {
          start: startDateInput,
          end: endDateInput
        },
        stats: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          totalHours: Math.round(totalHours * 100) / 100,
          overtimeHours: 0, // Calculate based on your business logic
          averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0
        }
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getTodayAttendance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.query.employeeId as string);

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
    const now = new Date();

    console.log('[TODAY DEBUG] Server time:', now.toISOString());
    console.log('[TODAY DEBUG] Philippines date range:', todayStart.toISOString(), 'to', todayEnd.toISOString());
    console.log('[TODAY DEBUG] employeeId:', employeeId);

    // Use date range to avoid timezone conversion issues with MySQL DATE type
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      orderBy: { check_in: 'desc' }
    });

    console.log('[TODAY DEBUG] Found attendance record:', attendance);
    if (attendance) {
      console.log('[TODAY DEBUG] Record date:', attendance.date);
      console.log('[TODAY DEBUG] Record check_in:', attendance.check_in);
      console.log('[TODAY DEBUG] Record check_out:', attendance.check_out);
    }

    const response: ApiResponse<typeof attendance> = {
      success: true,
      message: attendance ? 'Today\'s attendance record found' : 'No attendance record for today',
      data: attendance
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const markIndividualAbsent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.employeeId);

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    // Get employee to find their branch
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, branchCode: true }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (!employee.branchCode) {
      throw new AppError('Employee has no branch assigned', 400);
    }

    // Get today's date range (Philippines)
    const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();

    // Check if employee already has an attendance record for today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: todayStart,
          lt: todayEnd
        }
      }
    });

    if (existingAttendance) {
      throw new AppError('Employee already has an attendance record for today', 409);
    }

    // Create absent record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: todayStart,
        check_in: null,
        check_out: null,
        status: 'absent',
        branch_code: employee.branchCode
      }
    });

    // Log mark absent
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ATTENDANCE',
      entityId: attendance.id.toString(),
      entityName: `Attendance for employee ${employeeId}`,
      description: `Marked employee ${employeeId} as absent`,
      detailsAfter: attendance,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { method: 'manual', employeeId, branch_code: employee.branchCode },
    });

    // Emit WebSocket event for real-time update
    const branchCode = employee.branchCode || 'A';
    if (global.io) {
      emitAttendanceUpdate(global.io, branchCode, {
        attendanceId: attendance.id,
        type: 'mark_absent',
        action: 'mark_absent',
        employeeId: employee.id,
        employeeName: `Employee ${employeeId}`,
        employeeCode: '',
        branchCode: branchCode,
        branchName: branchCode,
        timestamp: new Date().toISOString(),
        previousStatus: 'available',
        newStatus: 'absent',
        status: 'absent'
      });
    }

    const response: ApiResponse<typeof attendance> = {
      success: true,
      message: 'Employee marked as absent',
      data: attendance
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const markAbsent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branch_code } = req.body;

    if (!branch_code) {
      throw new AppError('Branch code is required', 400);
    }

    // Get all active employees for this branch
    const employees = await prisma.employee.findMany({
      where: {
        branchCode: branch_code,
        status: 'Active'
      },
      select: { id: true, branchCode: true }
    });

    if (employees.length === 0) {
      const response: ApiResponse<null> = {
        success: true,
        message: 'No employees found for this branch',
        data: null
      };
      res.json(response);
      return;
    }

    const employeeIds = employees.map(e => e.id);

    // Get today's date range (Philippines)
    const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();

    // Find employees who already have attendance records today
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: {
          gte: todayStart,
          lt: todayEnd
        }
      },
      select: { employeeId: true }
    });

    const employeesWithRecords = new Set(existingAttendance.map(a => a.employeeId));

    // Filter to employees with NO attendance record at all today
    const absentEmployeeIds = employeeIds.filter(id => !employeesWithRecords.has(id));

    if (absentEmployeeIds.length === 0) {
      const response: ApiResponse<null> = {
        success: true,
        message: 'All employees already have attendance records for today',
        data: null
      };
      res.json(response);
      return;
    }

    // Insert absent records for each employee without a record
    const absentRecords = [];
    for (const empId of absentEmployeeIds) {
      absentRecords.push({
        employeeId: empId,
        date: todayStart,
        check_in: null,
        check_out: null,
        status: 'absent' as const,
        branch_code: branch_code
      });
    }

    await prisma.attendance.createMany({
      data: absentRecords
    });

    // Log bulk mark absent
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ATTENDANCE',
      description: `Bulk marked ${absentEmployeeIds.length} employees as absent for branch ${branch_code}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { method: 'bulk', markedCount: absentEmployeeIds.length, branch_code, employeeIds: absentEmployeeIds },
    });

    // Emit WebSocket event for real-time update
    if (global.io) {
      emitAttendanceUpdate(global.io, branch_code, {
        attendanceId: 0,
        type: 'mark_absent',
        action: 'mark_absent',
        employeeId: 0,
        employeeName: `Bulk mark absent (${absentEmployeeIds.length} employees)`,
        employeeCode: '',
        branchCode: branch_code,
        branchName: branch_code,
        timestamp: new Date().toISOString(),
        previousStatus: 'available',
        newStatus: 'absent',
        status: 'absent'
      });
    }

    const response: ApiResponse<{ markedCount: number }> = {
      success: true,
      message: `${absentEmployeeIds.length} employees marked as absent`,
      data: { markedCount: absentEmployeeIds.length }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceAudit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, branch_code, status } = req.query;

    console.log('=== ATTENDANCE AUDIT DEBUG ===');
    console.log('Query params:', { date, branch_code, status });

    // Parse date or use Philippines date range
    let dateRange: { start: Date; end: Date };
    if (date) {
      dateRange = getPhilippinesDateRangeForDate(date as string);
    } else {
      dateRange = getPhilippinesDateRange();
    }

    console.log('Target date range:', dateRange.start.toISOString(), 'to', dateRange.end.toISOString());

    // Build where clause using date range
    const where: any = {
      date: {
        gte: dateRange.start,
        lt: dateRange.end
      }
    };

    console.log('Where clause:', where);

    if (branch_code && branch_code !== 'ALL') {
      where.branch_code = branch_code;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Get attendance records with employee info
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      orderBy: { check_in: 'desc' }
    });

    console.log('Records found:', attendanceRecords.length);
    console.log('Records:', attendanceRecords.map(r => ({ id: r.id, employeeId: r.employeeId, date: r.date, status: r.status })));

    // Fetch employee details for each attendance record
    const employeeIds = [...new Set(attendanceRecords.map(r => r.employeeId))];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        department: true,
        branchName: true
      }
    });
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Format records for audit
    const formattedRecords = attendanceRecords.map(record => {
      const emp = employeeMap.get(record.employeeId);
      const checkIn = record.check_in 
        ? new Date(record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '-';
      const checkOut = record.check_out
        ? new Date(record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '-';
      
      // Calculate hours
      let hours = '-';
      if (record.check_in && record.check_out) {
        const diffMs = new Date(record.check_out).getTime() - new Date(record.check_in).getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        hours = `${diffHrs.toFixed(2)} hrs`;
      } else if (record.check_in && !record.check_out) {
        const diffMs = new Date().getTime() - new Date(record.check_in).getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        hours = `${diffHrs.toFixed(2)} hrs`;
      }

      return {
        id: record.id,
        employeeId: record.employeeId,
        name: emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown',
        code: emp?.employeeCode || '-',
        profileImage: emp?.profileImage || null,
        branch: record.branch_code || emp?.branchName || '-',
        timeIn: checkIn,
        timeOut: checkOut,
        hours,
        status: record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : '-',
        rawStatus: record.status
      };
    });

    // Calculate stats
    const stats = {
      totalRecords: formattedRecords.length,
      currentlyPresent: formattedRecords.filter(r => r.timeIn !== '-' && r.timeOut === '-').length,
      completedShifts: formattedRecords.filter(r => r.timeOut !== '-').length,
      absent: formattedRecords.filter(r => r.rawStatus === 'absent' || r.timeIn === '-').length,
      present: formattedRecords.filter(r => r.rawStatus === 'present').length,
      late: formattedRecords.filter(r => r.rawStatus === 'late').length
    };

    const response: ApiResponse<{
      date: string;
      records: typeof formattedRecords;
      stats: typeof stats;
    }> = {
      success: true,
      message: 'Attendance audit records retrieved',
      data: {
        date: dateRange.start.toISOString().split('T')[0],
        records: formattedRecords,
        stats
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
