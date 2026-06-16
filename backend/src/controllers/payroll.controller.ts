import { Response, NextFunction } from 'express';
import { PrismaClient, PayrollRecord, Employee, Attendance } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse, PayrollCalculationRequest } from '../types/api.types';
import { logCreate, logUpdate, logApprove, logView } from '../services/activityLogger.service';
import { detectChanges } from '../utils/changeDetector';
import * as ExcelJS from 'exceljs';

const prisma = new PrismaClient();

const SCHEDULE_CONFIGS = {
  // Engineers and Workers: 7:00 AM - 4:00 PM (8 hours)
  standard: {
    morningStart: 7 * 60,
    lunchStart: 12 * 60,
    lunchEnd: 13 * 60,
    end: 16 * 60,
    paidDayMinutes: 8 * 60,
  },
  // Developers, Admins, Super Admins: 8:00 AM - 5:00 PM (9 hours)
  extended: {
    morningStart: 8 * 60,
    lunchStart: 12 * 60,
    lunchEnd: 13 * 60,
    end: 17 * 60,
    paidDayMinutes: 9 * 60,
  },
} as const;

// Determine schedule based on employee role
const getEmployeeSchedule = (employee: Employee) => {
  const role = employee.position?.toLowerCase() || '';
  const department = employee.department?.toLowerCase() || '';
  
  // Extended schedule for Developers, Admins, Super Admins
  if (role.includes('developer') || 
      role.includes('admin') || 
      role.includes('super') ||
      department.includes('administration')) {
    return SCHEDULE_CONFIGS.extended;
  }
  
  // Standard schedule for Engineers, Workers, and others
  return SCHEDULE_CONFIGS.standard;
};

// Default to standard schedule for backward compatibility
const SCHEDULE = SCHEDULE_CONFIGS.standard;

type PayrollIssueCode =
  | 'NO_ATTENDANCE'
  | 'INCOMPLETE_ATTENDANCE'
  | 'MISSING_DAILY_RATE'
  | 'ZERO_PAYABLE_TIME'
  | 'LATE_ATTENDANCE';

interface PayrollIssue {
  code: PayrollIssueCode;
  severity: 'warning' | 'error';
  message: string;
}

interface DailyAttendanceBreakdown {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  payableMinutes: number;
  dayFraction: number;
  overtimeMinutesCandidate: number;
  late: boolean;
  issues: PayrollIssue[];
}

interface PayrollComputationSummary {
  daysWorked: number;
  payableDays: number;
  payableMinutes: number;
  overtimeMinutesCandidate: number;
  overtimeHoursCandidate: number;
  lateCount: number;
  issues: PayrollIssue[];
  dailyBreakdown: DailyAttendanceBreakdown[];
}

interface PayrollEmployeeSummary {
  id: number;
  employeeCode: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  branchName: string | null;
  branchCode: string | null;
  department: string | null;
  position: string | null;
  status: string | null;
}

interface PayrollRecordResponse extends PayrollRecord {
  employee?: PayrollEmployeeSummary;
  reviewStatus: 'draft' | 'needs_review' | 'processed';
  payableDays: number;
  payableMinutes: number;
  overtimeHoursCandidate: number;
  overtimeMinutesCandidate: number;
  issues: PayrollIssue[];
  dailyBreakdown?: DailyAttendanceBreakdown[];
}

const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  if (typeof value === 'object' && value && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const roundHours = (minutes: number) => Math.round((minutes / 60) * 100) / 100;

const dateOnly = (value: Date) => value.toISOString().split('T')[0];

const getWeekOfMonth = (value: Date) => Math.floor((value.getDate() - 1) / 7) + 1;

const getWeekNumber = (value: Date) => {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getProratedDeductions = (weekStart: Date) => {
  const weekOfMonth = getWeekOfMonth(weekStart);

  switch (weekOfMonth) {
    case 1:
      return { sss: 250, phic: 100, hdmf: 50, weekOfMonth };
    case 2:
      return { sss: 100, phic: 100, hdmf: 50, weekOfMonth };
    case 3:
      return { sss: 100, phic: 50, hdmf: 100, weekOfMonth };
    default:
      return { sss: 0, phic: 0, hdmf: 0, weekOfMonth };
  }
};

const timeToMinutes = (value: Date | null | undefined): number | null => {
  if (!value) return null;
  return value.getHours() * 60 + value.getMinutes();
};

const minutesToTime = (value: number | null): string | null => {
  if (value == null) return null;
  const hours = Math.floor(value / 60).toString().padStart(2, '0');
  const minutes = Math.floor(value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const overlapMinutes = (start: number, end: number, rangeStart: number, rangeEnd: number) =>
  Math.max(0, Math.min(end, rangeEnd) - Math.max(start, rangeStart));

const minutesToDayFraction = (minutes: number, schedule: any): number => {
  if (minutes <= 0) return 0;
  const paidDayMinutes = schedule.paidDayMinutes || 480; // Default to 8 hours if not specified
  const minimumThreshold = 30; // Minimum 30 minutes required to count any day fraction
  const quarterDay = paidDayMinutes / 4;
  const halfDay = paidDayMinutes / 2;
  const threeQuarterDay = (paidDayMinutes * 3) / 4;
  
  if (minutes < minimumThreshold) return 0; // Below minimum threshold, no day credit
  if (minutes <= quarterDay) return 0.25;
  if (minutes <= halfDay) return 0.5;
  if (minutes <= threeQuarterDay) return 0.75;
  return 1;
};

const employeeSummary = (employee: Employee): PayrollEmployeeSummary => ({
  id: employee.id,
  employeeCode: employee.employeeCode,
  firstName: employee.firstName,
  middleName: employee.middleName,
  lastName: employee.lastName,
  branchName: employee.branchName,
  branchCode: employee.branchCode,
  department: employee.department,
  position: employee.position,
  status: employee.status,
});

const calculatePayrollDetails = (
  dailyRate: number,
  payableDays: number,
  approvedOvertimeHours: number,
  performanceAllowance: number,
  hasDeductions: boolean,
  cashAdvance: number,
  weekStart: Date,
) => {
  const basicPay = roundCurrency(payableDays * dailyRate);
  const hourlyRate = dailyRate / 8;
  const overtimeAmount = roundCurrency(approvedOvertimeHours * (hourlyRate * 1.25));
  const grossPay = roundCurrency(basicPay + overtimeAmount + performanceAllowance);
  const proratedDeductions = getProratedDeductions(weekStart);
  const sssContribution = hasDeductions ? proratedDeductions.sss : 0;
  const phicContribution = hasDeductions ? proratedDeductions.phic : 0;
  const hdmfContribution = hasDeductions ? proratedDeductions.hdmf : 0;
  const totalDeductions = roundCurrency(sssContribution + phicContribution + hdmfContribution + cashAdvance);
  const netPay = roundCurrency(grossPay - totalDeductions);

  return {
    basicPay,
    overtimeAmount,
    grossPay,
    sssContribution,
    phicContribution,
    hdmfContribution,
    totalDeductions,
    netPay,
    weekOfMonth: proratedDeductions.weekOfMonth,
  };
};

const buildPayrollSummary = (
  employee: Employee,
  attendanceRecords: Attendance[],
): PayrollComputationSummary => {
  const issues: PayrollIssue[] = [];
  const dailyBreakdown: DailyAttendanceBreakdown[] = [];
  const schedule = getEmployeeSchedule(employee);

  if (!employee.dailyRate || toNumber(employee.dailyRate) <= 0) {
    issues.push({
      code: 'MISSING_DAILY_RATE',
      severity: 'error',
      message: 'Employee has no daily rate configured.',
    });
  }

  if (attendanceRecords.length === 0) {
    issues.push({
      code: 'NO_ATTENDANCE',
      severity: 'warning',
      message: 'No attendance records found for the selected payroll week.',
    });
  }

  let daysWorked = 0;
  let payableDays = 0;
  let payableMinutes = 0;
  let overtimeMinutesCandidate = 0;
  let lateCount = 0;

  for (const attendance of attendanceRecords) {
    const checkInMinutes = timeToMinutes(attendance.check_in);
    const checkOutMinutes = timeToMinutes(attendance.check_out);
    const dayIssues: PayrollIssue[] = [];
    const late = attendance.status === 'late' || (checkInMinutes != null && checkInMinutes > schedule.morningStart);

    if (late) {
      lateCount += 1;
      dayIssues.push({
        code: 'LATE_ATTENDANCE',
        severity: 'warning',
        message: 'Late arrival recorded. This is informational only in payroll v1.',
      });
    }

    let dayPayableMinutes = 0;
    let dayOvertimeMinutesCandidate = 0;
    let effectiveCheckOutMinutes = checkOutMinutes;

    // Handle missing check-out time by assuming standard end-of-day time
    if (checkInMinutes != null && checkOutMinutes == null) {
      effectiveCheckOutMinutes = schedule.end;
      dayIssues.push({
        code: 'INCOMPLETE_ATTENDANCE',
        severity: 'warning',
        message: 'Check-out time missing. Assuming standard end-of-day time for payroll calculation.',
      });
    } else if (checkInMinutes == null) {
      dayIssues.push({
        code: 'INCOMPLETE_ATTENDANCE',
        severity: 'error',
        message: 'Attendance is missing a check-in time.',
      });
    }

    if (checkInMinutes != null && effectiveCheckOutMinutes != null) {
      if (effectiveCheckOutMinutes <= checkInMinutes) {
        dayIssues.push({
          code: 'ZERO_PAYABLE_TIME',
          severity: 'error',
          message: 'Attendance time range is invalid for payroll computation.',
        });
      } else {
        dayPayableMinutes =
          overlapMinutes(checkInMinutes, effectiveCheckOutMinutes, schedule.morningStart, schedule.lunchStart) +
          overlapMinutes(checkInMinutes, effectiveCheckOutMinutes, schedule.lunchEnd, schedule.end);
      }
    }

    const dayFraction = minutesToDayFraction(dayPayableMinutes, schedule);
    if (dayPayableMinutes > 0) {
      daysWorked += 1;
      payableDays += dayFraction;
      payableMinutes += dayPayableMinutes;
    }

    overtimeMinutesCandidate += dayOvertimeMinutesCandidate;

    dailyBreakdown.push({
      date: dateOnly(attendance.date),
      checkIn: minutesToTime(checkInMinutes),
      checkOut: minutesToTime(checkOutMinutes),
      payableMinutes: dayPayableMinutes,
      dayFraction,
      overtimeMinutesCandidate: dayOvertimeMinutesCandidate,
      late,
      issues: dayIssues,
    });
  }

  if (attendanceRecords.length > 0 && payableMinutes === 0) {
    issues.push({
      code: 'ZERO_PAYABLE_TIME',
      severity: 'warning',
      message: 'Attendance exists but produced no payable time after schedule and lunch rules were applied.',
    });
  }

  if (lateCount > 0) {
    issues.push({
      code: 'LATE_ATTENDANCE',
      severity: 'warning',
      message: `${lateCount} late attendance record${lateCount > 1 ? 's were' : ' was'} found for this payroll week.`,
    });
  }

  for (const day of dailyBreakdown) {
    for (const issue of day.issues) {
      if (!issues.some((entry) => entry.code === issue.code && entry.message === issue.message)) {
        issues.push(issue);
      }
    }
  }

  return {
    daysWorked,
    payableDays: roundCurrency(payableDays),
    payableMinutes,
    overtimeMinutesCandidate,
    overtimeHoursCandidate: roundHours(overtimeMinutesCandidate),
    lateCount,
    issues,
    dailyBreakdown,
  };
};

const toPayrollResponse = async (
  record: PayrollRecord,
  options?: { includeDailyBreakdown?: boolean; cachedEmployee?: Employee | null },
): Promise<PayrollRecordResponse> => {
  const employee = options?.cachedEmployee ?? await prisma.employee.findUnique({ where: { id: record.employeeId } });
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: record.employeeId,
      date: {
        gte: record.payroll_week_start,
        lte: record.payroll_week_end,
      },
    },
    orderBy: { date: 'asc' },
  });

  const summary = employee ? buildPayrollSummary(employee, attendances) : {
    daysWorked: record.days_worked ?? 0,
    payableDays: 0,
    payableMinutes: 0,
    overtimeMinutesCandidate: 0,
    overtimeHoursCandidate: 0,
    lateCount: 0,
    issues: [{
      code: 'NO_ATTENDANCE' as const,
      severity: 'warning' as const,
      message: 'Employee record was not found for this payroll record.',
    }],
    dailyBreakdown: [],
  };

  return {
    ...record,
    employee: employee ? employeeSummary(employee) : undefined,
    reviewStatus: record.status === 'processed' ? 'processed' : summary.issues.length > 0 ? 'needs_review' : 'draft',
    payableDays: summary.payableDays,
    payableMinutes: summary.payableMinutes,
    overtimeHoursCandidate: summary.overtimeHoursCandidate,
    overtimeMinutesCandidate: summary.overtimeMinutesCandidate,
    issues: summary.issues,
    dailyBreakdown: options?.includeDailyBreakdown ? summary.dailyBreakdown : undefined,
  };
};

const getPayrollRecordOrThrow = async (id: number) => {
  const record = await prisma.payrollRecord.findUnique({ where: { id } });
  if (!record) {
    throw new AppError('Payroll record not found', 404);
  }
  return record;
};

// Function to consume approved overtime requests for payroll calculation
const getApprovedOvertimeRequests = async (
  employeeId: number,
  weekStart: Date,
  weekEnd: Date,
) => {
  try {
    // Use raw SQL query to fetch approved overtime requests
    const query = `
      SELECT 
        id, 
        requested_hours as requestedHours, 
        request_date as requestDate, 
        start_time as startTime, 
        end_time as endTime, 
        reason
      FROM overtime_requests 
      WHERE employee_id = $1 
        AND status = 'APPROVED'
        AND request_date >= $2 
        AND request_date <= $3
        AND payroll_record_id IS NULL
    `;
    
    const result = await prisma.$queryRawUnsafe(query, employeeId, weekStart, weekEnd);
    return result as Array<{
      id: number;
      requestedHours: number;
      requestDate: Date;
      startTime: string;
      endTime: string;
      reason: string;
    }>;
  } catch (error) {
    console.error('Error fetching approved overtime requests:', error);
    return [];
  }
};

// Function to mark overtime requests as applied to payroll
const markOvertimeRequestsAsApplied = async (
  overtimeRequestIds: number[],
  payrollRecordId: number,
) => {
  try {
    // Use raw SQL query to mark overtime requests as applied
    const query = `
      UPDATE overtime_requests 
      SET payroll_record_id = $1, applied_to_payroll_at = NOW()
      WHERE id = ANY($2)
    `;
    
    await prisma.$queryRawUnsafe(query, payrollRecordId, overtimeRequestIds);
  } catch (error) {
    console.error('Error marking overtime requests as applied:', error);
  }
};

const upsertPayrollForEmployeeWeek = async (
  employee: Employee,
  weekStart: Date,
  weekEnd: Date,
) => {
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    orderBy: { date: 'asc' },
  });

  const summary = buildPayrollSummary(employee, attendanceRecords);
  const dailyRate = toNumber(employee.dailyRate);
  const performanceAllowance = toNumber(employee.performanceAllowance);
  const hasDeductions = Boolean(employee.hasDeductions);

  // Get approved overtime requests for this employee and week
  const approvedOvertimeRequests = await getApprovedOvertimeRequests(employee.id, weekStart, weekEnd);
  
  // Calculate total approved overtime hours from requests
  const approvedOvertimeHoursFromRequests = approvedOvertimeRequests.reduce(
    (total, request) => total + Number(request.requestedHours),
    0
  );

  const existingRecord = await prisma.payrollRecord.findFirst({
    where: {
      employeeId: employee.id,
      payroll_week_start: weekStart,
      payroll_week_end: weekEnd,
    },
  });

  if (existingRecord?.status === 'processed') {
    return { record: existingRecord, summary, action: 'skipped_processed' as const };
  }

  // Use existing overtime hours if available, otherwise use approved requests
  const approvedOvertimeHours = existingRecord 
    ? toNumber(existingRecord.overtimeHours) 
    : approvedOvertimeHoursFromRequests;
  const cashAdvance = existingRecord ? toNumber(existingRecord.cash_advance) : 0;
  const calculations = calculatePayrollDetails(
    dailyRate,
    summary.payableDays,
    approvedOvertimeHours,
    performanceAllowance,
    hasDeductions,
    cashAdvance,
    weekStart,
  );

  const payload = {
    employeeId: employee.id,
    branch_code: employee.branchCode || employee.branchName || '',
    payroll_week_start: weekStart,
    payroll_week_end: weekEnd,
    week_number: getWeekNumber(weekStart),
    days_worked: summary.daysWorked,
    daily_rate: dailyRate,
    basic_pay: calculations.basicPay,
    overtimeHours: approvedOvertimeHours,
    overtime_amount: calculations.overtimeAmount,
    performance_allowance: performanceAllowance,
    grossPay: calculations.grossPay,
    sss_contribution: calculations.sssContribution,
    phic_contribution: calculations.phicContribution,
    hdmf_contribution: calculations.hdmfContribution,
    cash_advance: cashAdvance,
    total_deductions: calculations.totalDeductions,
    netPay: calculations.netPay,
    status: 'draft' as const,
  };

  if (existingRecord) {
    const changes = detectChanges(existingRecord, {
      days_worked: summary.daysWorked,
      daily_rate: dailyRate,
      basic_pay: calculations.basicPay,
      overtime_hours: approvedOvertimeHours,
      overtime_amount: calculations.overtimeAmount,
      performance_allowance: performanceAllowance,
      gross_pay: calculations.grossPay,
      sss_contribution: calculations.sssContribution,
      phic_contribution: calculations.phicContribution,
      hdmf_contribution: calculations.hdmfContribution,
      cash_advance: cashAdvance,
      total_deductions: calculations.totalDeductions,
      net_pay: calculations.netPay,
    }, 'PAYROLL');

    const record = await prisma.payrollRecord.update({
      where: { id: existingRecord.id },
      data: payload,
    });

    // Mark overtime requests as applied to payroll (only if we used overtime requests)
    if (approvedOvertimeRequests.length > 0 && !existingRecord.overtimeHours) {
      await markOvertimeRequestsAsApplied(
        approvedOvertimeRequests.map(req => req.id),
        record.id
      );
    }

    return { record, summary, action: 'updated' as const, previous: existingRecord, changes };
  }

  const record = await prisma.payrollRecord.create({
    data: payload,
  });

  // Mark overtime requests as applied to payroll (only if we used overtime requests)
  if (approvedOvertimeRequests.length > 0) {
    await markOvertimeRequestsAsApplied(
      approvedOvertimeRequests.map(req => req.id),
      record.id
    );
  }

  return { record, summary, action: 'created' as const };
};

export const getAllPayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
    const status = req.query.status as string | undefined;
    const weekStart = req.query.weekStart ? new Date(req.query.weekStart as string) : undefined;
    const weekEnd = req.query.weekEnd ? new Date(req.query.weekEnd as string) : undefined;
    const search = req.query.search as string | undefined;
    const branch = req.query.branch as string | undefined;

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status && ['draft', 'processed'].includes(status)) where.status = status;
    if (weekStart || weekEnd) {
      where.payroll_week_start = {};
      if (weekStart) (where.payroll_week_start as Record<string, Date>).gte = weekStart;
      if (weekEnd) (where.payroll_week_start as Record<string, Date>).lte = weekEnd;
    }
    
    // Add branch filtering using branch_code from PayrollRecord
    if (branch) {
      where.branch_code = branch;
    }

    const [records, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { payroll_week_start: 'desc' },
          { employeeId: 'asc' },
        ],
      }),
      prisma.payrollRecord.count({ where }),
    ]);

    const data = await Promise.all(records.map((record) => toPayrollResponse(record)));

    const response: PaginatedResponse<PayrollRecordResponse> = {
      success: true,
      message: 'Payroll records retrieved successfully',
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await logView({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      description: `Viewed all payroll records (${total} records)`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { page, limit, total, employeeId, status, weekStart, weekEnd },
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getMyPayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const employeeId = parseInt(req.query.employeeId as string);

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const [records, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where: { employeeId },
        skip,
        take: limit,
        orderBy: { payroll_week_start: 'desc' },
      }),
      prisma.payrollRecord.count({ where: { employeeId } }),
    ]);

    const data = await Promise.all(records.map((record) => toPayrollResponse(record)));

    const response: PaginatedResponse<PayrollRecordResponse> = {
      success: true,
      message: 'Payroll records retrieved',
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await logView({
      userId: req.admin?.id || employeeId,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      entityId: employeeId.toString(),
      entityName: `Payroll for employee ${employeeId}`,
      description: `Viewed payroll for employee ${employeeId} (${total} records)`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { employeeId, page, limit, total },
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getPayrollById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const record = await getPayrollRecordOrThrow(id);
    const data = await toPayrollResponse(record, { includeDailyBreakdown: true });

    const response: ApiResponse<PayrollRecordResponse> = {
      success: true,
      message: 'Payroll record retrieved successfully',
      data,
    };

    await logView({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      entityId: record.id.toString(),
      entityName: `Payroll record ${record.id}`,
      description: `Viewed payroll record ${id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { payrollId: id },
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const calculatePayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { employeeId, weekStart, weekEnd }: PayrollCalculationRequest = req.body;

    if (!employeeId || !weekStart || !weekEnd) {
      throw new AppError('Employee ID, week start and end dates are required', 400);
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const result = await upsertPayrollForEmployeeWeek(employee, new Date(weekStart), new Date(weekEnd));

    if (result.action === 'skipped_processed') {
      throw new AppError('Processed payroll records cannot be recalculated', 409);
    }

    if (result.action === 'updated') {
      await logUpdate({
        userId: req.admin?.id || 0,
        userName: req.admin?.name || 'unknown',
        userRole: req.admin?.role || 'admin',
        entityType: 'PAYROLL',
        entityId: result.record.id.toString(),
        entityName: `Payroll for employee ${employeeId}`,
        description: `Updated payroll for employee ${employeeId} (${employee.firstName} ${employee.lastName})`,
        detailsBefore: result.previous,
        detailsAfter: result.record,
        changes: result.changes,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { employeeId, weekStart, weekEnd, payableDays: result.summary.payableDays, netPay: result.record.netPay },
      });
    } else {
      await logCreate({
        userId: req.admin?.id || 0,
        userName: req.admin?.name || 'unknown',
        userRole: req.admin?.role || 'admin',
        entityType: 'PAYROLL',
        entityId: result.record.id.toString(),
        entityName: `Payroll for employee ${employeeId}`,
        description: `Created payroll for employee ${employeeId} (${employee.firstName} ${employee.lastName})`,
        detailsAfter: result.record,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { employeeId, weekStart, weekEnd, payableDays: result.summary.payableDays, netPay: result.record.netPay },
      });
    }

    const data = await toPayrollResponse(result.record, { includeDailyBreakdown: true, cachedEmployee: employee });

    const response: ApiResponse<PayrollRecordResponse> = {
      success: true,
      message: 'Payroll calculated successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const calculateWeeklyPayrollBatch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { weekStart, weekEnd } = req.body as { weekStart?: string; weekEnd?: string };
    if (!weekStart || !weekEnd) {
      throw new AppError('Week start and week end are required', 400);
    }

    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    const employees = await prisma.employee.findMany({
      where: { status: 'Active' },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const results: PayrollRecordResponse[] = [];
    let created = 0;
    let updated = 0;
    let skippedProcessed = 0;

    for (const employee of employees) {
      const result = await upsertPayrollForEmployeeWeek(employee, startDate, endDate);
      if (result.action === 'created') created += 1;
      if (result.action === 'updated') updated += 1;
      if (result.action === 'skipped_processed') skippedProcessed += 1;

      results.push(await toPayrollResponse(result.record, { cachedEmployee: employee }));
    }

    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      description: `Generated weekly payroll batch for ${dateOnly(startDate)} to ${dateOnly(endDate)}`,
      detailsAfter: { created, updated, skippedProcessed, employees: employees.length },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { weekStart, weekEnd, created, updated, skippedProcessed, employees: employees.length },
    });

    const response: ApiResponse<{
      weekStart: string;
      weekEnd: string;
      totals: { employees: number; created: number; updated: number; skippedProcessed: number };
      records: PayrollRecordResponse[];
    }> = {
      success: true,
      message: 'Weekly payroll batch generated successfully',
      data: {
        weekStart,
        weekEnd,
        totals: { employees: employees.length, created, updated, skippedProcessed },
        records: results,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const approvePayrollOvertime = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const requestedHours = req.body?.hours != null ? Number(req.body.hours) : undefined;
    const record = await getPayrollRecordOrThrow(id);

    if (record.status === 'processed') {
      throw new AppError('Processed payroll records cannot be modified', 409);
    }

    const employee = await prisma.employee.findUnique({ where: { id: record.employeeId } });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const summary = buildPayrollSummary(
      employee,
      await prisma.attendance.findMany({
        where: {
          employeeId: record.employeeId,
          date: {
            gte: record.payroll_week_start,
            lte: record.payroll_week_end,
          },
        },
        orderBy: { date: 'asc' },
      }),
    );

    const approvedHours = requestedHours == null ? summary.overtimeHoursCandidate : Math.max(0, Math.min(requestedHours, summary.overtimeHoursCandidate));
    const calculations = calculatePayrollDetails(
      toNumber(record.daily_rate),
      summary.payableDays,
      approvedHours,
      toNumber(record.performance_allowance),
      Boolean(employee.hasDeductions) || toNumber(record.sss_contribution) > 0 || toNumber(record.phic_contribution) > 0 || toNumber(record.hdmf_contribution) > 0 || false,
      toNumber(record.cash_advance),
      record.payroll_week_start,
    );

    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: {
        basic_pay: calculations.basicPay,
        overtimeHours: approvedHours,
        overtime_amount: calculations.overtimeAmount,
        grossPay: calculations.grossPay,
        sss_contribution: calculations.sssContribution,
        phic_contribution: calculations.phicContribution,
        hdmf_contribution: calculations.hdmfContribution,
        total_deductions: calculations.totalDeductions,
        netPay: calculations.netPay,
      },
    });

    await logApprove({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      entityId: updatedRecord.id.toString(),
      entityName: `Payroll record ${updatedRecord.id}`,
      description: `Approved overtime for payroll record ${updatedRecord.id}`,
      detailsAfter: updatedRecord,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { payrollId: id, approvedHours, candidateHours: summary.overtimeHoursCandidate },
    });

    const data = await toPayrollResponse(updatedRecord, { includeDailyBreakdown: true, cachedEmployee: employee });

    const response: ApiResponse<PayrollRecordResponse> = {
      success: true,
      message: 'Payroll overtime approved successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const processPayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const record = await getPayrollRecordOrThrow(id);

    if (record.status === 'processed') {
      throw new AppError('Payroll already processed', 409);
    }

    const employee = await prisma.employee.findUnique({ where: { id: record.employeeId } });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const detailed = await toPayrollResponse(record, { cachedEmployee: employee });
    if (detailed.issues.some((issue) => issue.severity === 'error')) {
      throw new AppError('Payroll record still has blocking review issues', 409);
    }

    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: { status: 'processed' },
    });

    await logApprove({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      entityId: updatedRecord.id.toString(),
      entityName: `Payroll record ${updatedRecord.id}`,
      description: `Processed payroll record ${id}`,
      detailsAfter: updatedRecord,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { payrollId: id, previousStatus: record.status, newStatus: 'processed' },
    });

    const data = await toPayrollResponse(updatedRecord, { includeDailyBreakdown: true, cachedEmployee: employee });

    const response: ApiResponse<PayrollRecordResponse> = {
      success: true,
      message: 'Payroll processed successfully',
      data,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updatePayrollStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status?: string };

    if (!['draft', 'processed'].includes(status || '')) {
      throw new AppError('Invalid status value. Use draft or processed', 400);
    }

    const record = await getPayrollRecordOrThrow(id);
    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: { status: status as 'draft' | 'processed' },
    });

    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      entityId: updatedRecord.id.toString(),
      entityName: `Payroll record ${updatedRecord.id}`,
      description: `Updated payroll status to ${status}`,
      detailsBefore: record,
      detailsAfter: updatedRecord,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { payrollId: id, previousStatus: record.status, newStatus: status },
    });

    const data = await toPayrollResponse(updatedRecord, { includeDailyBreakdown: true });

    const response: ApiResponse<PayrollRecordResponse> = {
      success: true,
      message: `Payroll status updated to ${status}`,
      data,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const syncPayrollDeductions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get all employees
    const employees = await prisma.employee.findMany();

    // Get all payroll records
    const payrollRecords = await prisma.payrollRecord.findMany();

    let updatedCount = 0;
    const updates: Array<{ payrollId: number; employeeName: string; previousDeductions: number; newDeductions: number }> = [];

    for (const employee of employees) {
      const hasDeductions = Boolean(employee.hasDeductions);
      const employeeRecords = payrollRecords.filter(r => r.employeeId === employee.id);

      for (const record of employeeRecords) {
        // Skip processed records
        if (record.status === 'processed') {
          continue;
        }

        const currentTotalDeductions = toNumber(record.total_deductions);
        const shouldHaveDeductions = hasDeductions;

        // If employee has no deductions but record shows deductions, remove them
        if (!shouldHaveDeductions && currentTotalDeductions > 0) {
          const newTotalDeductions = toNumber(record.cash_advance);
          const newNetPay = toNumber(record.grossPay) - newTotalDeductions;

          await prisma.payrollRecord.update({
            where: { id: record.id },
            data: {
              sss_contribution: 0,
              phic_contribution: 0,
              hdmf_contribution: 0,
              total_deductions: newTotalDeductions,
              netPay: newNetPay,
            },
          });

          updates.push({
            payrollId: record.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            previousDeductions: currentTotalDeductions,
            newDeductions: newTotalDeductions,
          });

          updatedCount++;
        }
        // If employee has deductions but record shows no deductions, add them
        else if (shouldHaveDeductions && currentTotalDeductions === toNumber(record.cash_advance)) {
          const weekStart = record.payroll_week_start;
          const proratedDeductions = getProratedDeductions(weekStart);
          const sssContribution = proratedDeductions.sss;
          const phicContribution = proratedDeductions.phic;
          const hdmfContribution = proratedDeductions.hdmf;
          const newTotalDeductions = roundCurrency(sssContribution + phicContribution + hdmfContribution + toNumber(record.cash_advance));
          const newNetPay = toNumber(record.grossPay) - newTotalDeductions;

          await prisma.payrollRecord.update({
            where: { id: record.id },
            data: {
              sss_contribution: sssContribution,
              phic_contribution: phicContribution,
              hdmf_contribution: hdmfContribution,
              total_deductions: newTotalDeductions,
              netPay: newNetPay,
            },
          });

          updates.push({
            payrollId: record.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            previousDeductions: currentTotalDeductions,
            newDeductions: newTotalDeductions,
          });

          updatedCount++;
        }
      }
    }

    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      entityId: '0',
      entityName: 'Bulk payroll deduction sync',
      description: `Synced payroll deductions with employee hasDeductions setting. Updated ${updatedCount} records.`,
      detailsAfter: { updatedCount, updates },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { updatedCount, updates },
    });

    const response: ApiResponse<{ updatedCount: number; updates: typeof updates }> = {
      success: true,
      message: `Synced ${updatedCount} payroll records with employee deduction settings`,
      data: { updatedCount, updates },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const exportPayrollToExcel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const weekStart = req.query.weekStart ? new Date(req.query.weekStart as string) : undefined;
    const weekEnd = req.query.weekEnd ? new Date(req.query.weekEnd as string) : undefined;
    const status = req.query.status as string | undefined;
    const branch = req.query.branch as string | undefined;
    const search = req.query.search as string | undefined;

    const where: Record<string, unknown> = {};
    if (status && ['draft', 'processed'].includes(status)) where.status = status;
    if (weekStart || weekEnd) {
      where.payroll_week_start = {};
      if (weekStart) (where.payroll_week_start as Record<string, Date>).gte = weekStart;
      if (weekEnd) (where.payroll_week_start as Record<string, Date>).lte = weekEnd;
    }
    
    if (branch) {
      where.branch_code = branch;
    }

    const records = await prisma.payrollRecord.findMany({
      where,
      orderBy: [
        { payroll_week_start: 'desc' },
        { employeeId: 'asc' },
      ],
    });

    // Fetch employee data separately
    const employeeIds = [...new Set(records.map(r => r.employeeId))];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
    });

    const employeeMap = new Map(employees.map(e => [e.id, e]));

    const payrollData = records.map((record) => {
      const employee = employeeMap.get(record.employeeId);
      const fullName = [employee?.firstName, employee?.middleName, employee?.lastName]
        .filter(Boolean)
        .join(' ');
      return {
        employeeCode: employee?.employeeCode || '',
        name: fullName,
        branchName: employee?.branchName || '',
        branchCode: employee?.branchCode || '',
        daysWorked: record.days_worked || 0,
        dailyRate: toNumber(record.daily_rate),
        basicPay: toNumber(record.basic_pay),
        overtimeHours: toNumber(record.overtimeHours),
        overtimeAmount: toNumber(record.overtime_amount),
        performanceAllowance: toNumber(record.performance_allowance),
        grossPay: toNumber(record.grossPay),
        sssContribution: toNumber(record.sss_contribution),
        phicContribution: toNumber(record.phic_contribution),
        hdmfContribution: toNumber(record.hdmf_contribution),
        cashAdvance: toNumber(record.cash_advance),
        totalDeductions: toNumber(record.total_deductions),
        netPay: toNumber(record.netPay),
      };
    });

    // Group data by branch
    const groupedByBranch = payrollData.reduce((acc, record) => {
      const branchKey = record.branchName || 'Unknown Branch';
      if (!acc[branchKey]) {
        acc[branchKey] = [];
      }
      acc[branchKey].push(record);
      return acc;
    }, {} as Record<string, typeof payrollData>);

    // Calculate date range for filename and headers
    const dateRange = weekStart && weekEnd 
      ? `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
      : 'All Dates';

    const workbook = new ExcelJS.Workbook();

    // Create a separate sheet for each branch with unique names
    const usedSheetNames = new Set<string>();
    for (const [branchName, branchData] of Object.entries(groupedByBranch)) {
      let sheetName = branchName.substring(0, 31); // Excel sheet name max 31 chars
      let counter = 1;
      
      // Ensure unique sheet name by adding suffix if duplicate
      while (usedSheetNames.has(sheetName)) {
        const suffix = ` (${counter})`;
        const baseName = branchName.substring(0, 31 - suffix.length);
        sheetName = `${baseName}${suffix}`;
        counter++;
      }
      
      usedSheetNames.add(sheetName);
      const worksheet = workbook.addWorksheet(sheetName);

      // Header section with project name and date range
      worksheet.mergeCells('A1:P1');
      const headerCell = worksheet.getCell('A1');
      headerCell.value = 'JAJR Construction Payroll Export';
      headerCell.font = { size: 16, bold: true };
      headerCell.alignment = { horizontal: 'center' };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      };

      // Branch name header
      worksheet.mergeCells('A2:P2');
      const branchCell = worksheet.getCell('A2');
      branchCell.value = `Project/Site: ${branchName}`;
      branchCell.font = { size: 12, bold: true };
      branchCell.alignment = { horizontal: 'center' };
      branchCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' },
      };

      // Date range header
      worksheet.mergeCells('A3:P3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = `Project Range: ${dateRange}`;
      dateCell.font = { size: 12, bold: true };
      dateCell.alignment = { horizontal: 'center' };
      dateCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' },
      };

      // Column headers
      const headers = [
        'Employee Code',
        'NAME',
        'Days Worked',
        'Daily Rate',
        'Basic Pay',
        'OT Hours (Approved)',
        'OT Amount',
        'Performance Allowance',
        'Gross Pay',
        'SSS',
        'PHIC',
        'HDMF',
        'CA',
        'SSS LOAN',
        'Total Deductions',
        'Net Pay',
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' },
      };

      // Add borders to header row
      headerRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' }
        };
      });

      // Make specific column headers bold (Performance Allowance, Gross Pay, SSS, PHIC, HDMF, CA, SSS LOAN)
      const boldHeaderColumns = [8, 9, 10, 11, 12, 13, 14]; // 1-indexed column positions
      boldHeaderColumns.forEach((colIndex) => {
        const cell = headerRow.getCell(colIndex);
        cell.font = { bold: true, color: { argb: 'FFFF0000' } };
      });

      // Add data rows
      branchData.forEach((data) => {
        const row = worksheet.addRow([
          data.employeeCode,
          data.name,
          data.daysWorked,
          data.dailyRate,
          data.basicPay,
          data.overtimeHours,
          data.overtimeAmount,
          data.performanceAllowance,
          data.grossPay,
          data.sssContribution,
          data.phicContribution,
          data.hdmfContribution,
          data.cashAdvance,
          0, // SSS LOAN - not available in current data structure
          data.totalDeductions,
          data.netPay,
        ]);

        // Add borders to each cell in the row
        row.eachCell((cell: any, colNumber: number) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Add thick outside borders to the entire data range
      const dataRange = `A4:P${4 + branchData.length}`;
      const range = worksheet.getCell(dataRange);
      
      // Add thick borders to left and right columns
      for (let i = 4; i <= 4 + branchData.length; i++) {
        worksheet.getCell(`A${i}`).border = { ...worksheet.getCell(`A${i}`).border, left: { style: 'thick' } };
        worksheet.getCell(`P${i}`).border = { ...worksheet.getCell(`P${i}`).border, right: { style: 'thick' } };
      }
      
      // Add thick border to bottom row
      for (let j = 1; j <= 16; j++) {
        const colLetter = String.fromCharCode(64 + j);
        worksheet.getCell(`${colLetter}${4 + branchData.length}`).border = { 
          ...worksheet.getCell(`${colLetter}${4 + branchData.length}`).border, 
          bottom: { style: 'thick' } 
        };
      }

      // Set column widths and enable text wrapping
      const columnWidths = [
        { width: 15, wrap: false },  // Employee Code
        { width: 35, wrap: true },   // NAME
        { width: 12, wrap: false },  // Days Worked
        { width: 15, wrap: false },  // Daily Rate
        { width: 18, wrap: false },  // Basic Pay
        { width: 15, wrap: false },  // OT Hours
        { width: 18, wrap: false },  // OT Amount
        { width: 20, wrap: false, red: true },  // Performance Allowance
        { width: 18, wrap: false, red: true },  // Gross Pay
        { width: 12, wrap: false, red: true },  // SSS
        { width: 12, wrap: false, red: true },  // PHIC
        { width: 12, wrap: false, red: true },  // HDMF
        { width: 12, wrap: false, red: true },  // CA
        { width: 12, wrap: false, red: true },  // SSS LOAN
        { width: 18, wrap: false },  // Total Deductions
        { width: 18, wrap: false },  // Net Pay
      ];

      worksheet.columns.forEach((column: any, index: number) => {
        if (columnWidths[index]) {
          column.width = columnWidths[index].width;
          // Center all content
          column.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: columnWidths[index].wrap
          };
          // Apply red font color to specified columns
          if (columnWidths[index].red) {
            column.font = { color: { argb: 'FFFF0000' } };
          }
        }
      });

      // Format currency columns
      const currencyColumns = [4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
      currencyColumns.forEach((colIndex) => {
        worksheet.getColumn(colIndex).numFmt = '#,##0.00';
      });
    }

    // Generate filename
    const filename = `payroll-export-${dateRange.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;

    await logView({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'PAYROLL',
      description: `Exported payroll to Excel (${records.length} records)`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { weekStart, weekEnd, status, branch, search, recordCount: records.length },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
