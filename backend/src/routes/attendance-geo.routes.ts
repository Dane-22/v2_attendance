import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { decodeQRCodeData, extractEmployeeCode } from '../services/qr.service';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { calculateDistance, validateLocation, parseLocationError } from '../services/geolocation.service';

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

// Test clock endpoint with geolocation validation
export const clockGeo = async (
  req: AuthenticatedRequest,
  res: any,
  next: any
): Promise<void> => {
  try {
    const { qrCodeData, notes, latitude, longitude, accuracy } = req.body;

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

    // Get branch location for validation
    const resolvedBranchCode = await resolveAttendanceBranchCode(employee, adminBranchCode);
    const branch = await prisma.branches.findUnique({
      where: { branch_code: resolvedBranchCode },
      select: {
        latitude: true,
        longitude: true,
        location_radius_meters: true,
      }
    });

    let locationValidation: any = null;
    let locationStatus = 'valid';
    let locationMessage = '';

    // Validate location if coordinates provided and branch has location configured
    if (latitude && longitude && branch?.latitude && branch?.longitude) {
      try {
        locationValidation = validateLocation(
          { latitude, longitude },
          {
            branchCode: resolvedBranchCode,
            latitude: branch.latitude,
            longitude: branch.longitude,
            radius: branch.location_radius_meters || 500,
          },
          accuracy || 0
        );

        locationStatus = locationValidation.isValid ? 'valid' : 'invalid';
        locationMessage = locationValidation.message;

        console.log('[GEO] Location validation:', locationValidation);
      } catch (error) {
        console.error('[GEO] Location validation error:', error);
        locationStatus = 'error';
        locationMessage = 'Location validation failed';
      }
    } else if (latitude && longitude) {
      // Location provided but branch has no coordinates configured
      locationStatus = 'valid'; // Allow scan if branch location not configured
      locationMessage = 'Branch location not configured, location validation skipped';
    } else {
      // No location provided
      locationStatus = 'error';
      locationMessage = 'No location data provided';
    }

    const { start: todayStart, end: todayEnd } = getPhilippinesDateRange();
    const now = new Date();

    console.log('[CLOCK-GEO] Employee:', employee.id, 'Location status:', locationStatus, 'Server time:', now.toISOString());

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

      // Update using raw SQL with location data
      await prisma.$executeRaw`
        UPDATE attendance 
        SET check_out = ${checkOutTime}, 
            scan_latitude = ${latitude || null},
            scan_longitude = ${longitude || null},
            scan_accuracy_meters = ${accuracy || null},
            location_status = ${locationStatus},
            location_error_message = ${locationMessage || null},
            updated_at = NOW()
        WHERE id = ${activeRecord.id}
      `;

      // Fetch the updated record
      const updatedRecord = await prisma.attendance.findUnique({
        where: { id: activeRecord.id }
      });

      console.log('[CLOCK-GEO] Clock OUT successful for employee:', employee.id);

      const response = {
        success: true,
        message: `Clocked out successfully at ${checkOutTime.toLocaleTimeString()}`,
        data: {
          action: 'clock_out',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          attendance: updatedRecord,
          locationStatus,
          locationMessage,
          distance: locationValidation?.distance,
        }
      };

      res.json(response);
    } else {
      // No active clock-in → CLOCK IN
      const checkInTime = new Date();
      const status = determineStatus(checkInTime);

      const todayStr = getPhilippinesDateString();
      
      // Insert with location data using raw SQL
      await prisma.$executeRaw`
        INSERT INTO attendance (employee_id, date, check_in, status, branch_code, notes, scan_latitude, scan_longitude, scan_accuracy_meters, location_status, location_error_message, created_at, updated_at)
        VALUES (${employee.id}, ${todayStr}, ${checkInTime}, ${status}, ${resolvedBranchCode}, ${notes || null}, ${latitude || null}, ${longitude || null}, ${accuracy || null}, ${locationStatus}, ${locationMessage || null}, NOW(), NOW())
      `;

      console.log('[CLOCK-GEO] Clock IN successful for employee:', employee.id);

      // Fetch the created record
      const newRecord = await prisma.attendance.findFirst({
        where: { employeeId: employee.id },
        orderBy: { id: 'desc' }
      });

      const response = {
        success: true,
        message: `Clocked in successfully at ${checkInTime.toLocaleTimeString()}`,
        data: {
          action: 'clock_in',
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          attendance: newRecord,
          locationStatus,
          locationMessage,
          distance: locationValidation?.distance,
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
