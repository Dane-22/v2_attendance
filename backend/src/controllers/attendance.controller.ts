import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Attendance } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse, AttendanceResponse } from '../types/api.types';
import { decodeQRCodeData, extractEmployeeCode } from '../services/qr.service';

const prisma = new PrismaClient();

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

      // Use raw SQL to insert - bypasses Prisma timezone conversion on date field
      const todayStr = getPhilippinesDateString();
      const result = await prisma.$executeRaw`
        INSERT INTO attendance (employee_id, date, check_in, status, branch_code, notes, created_at, updated_at)
        VALUES (${employee.id}, ${todayStr}, ${checkInTime}, ${status}, ${adminBranchCode || employee.branchName || null}, ${notes || null}, NOW(), NOW())
      `;

      // Fetch the created record
      const newRecord = await prisma.attendance.findFirst({
        where: { employeeId: employee.id },
        orderBy: { id: 'desc' }
      });

      console.log('[CLOCK] Clock IN successful for employee:', employee.id, 'date range:', todayStart.toISOString());

      const response: ApiResponse<any> = {
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
  employee: { id: number; branchName: string | null; status: string | null },
  notes: string | undefined,
  isManual: boolean,
  branchCode?: string
): Promise<{ attendance: Attendance; message: string }> => {
  const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
  const dateNow = new Date();
  const todayStr = getPhilippinesDateString();
  
  console.log('[CLOCK-IN DEBUG] Philippines date range:', todayStart.toISOString(), 'to', todayEnd.toISOString());
  console.log('[CLOCK-IN DEBUG] Philippines date string:', todayStr);
  console.log('[CLOCK-IN DEBUG] Server time:', dateNow.toISOString());

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

  // Always create new attendance record (allow multiple per day)
  const attendance = await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date: todayStr as any,
      check_in: checkInTime,
      status,
      branch_code: branchCode || employee.branchName || undefined,
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
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const where: any = {};
    
    if (employeeId) where.employeeId = employeeId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
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
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const where: any = { employeeId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
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
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate
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
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
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
      const d = new Date(date as string);
      dateRange = {
        start: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())),
        end: new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + 1))
      };
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
