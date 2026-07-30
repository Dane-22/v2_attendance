"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPayrollToExcel = exports.syncPayrollDeductions = exports.updatePayrollStatus = exports.processPayroll = exports.approvePayrollOvertime = exports.calculateWeeklyPayrollBatch = exports.calculatePayroll = exports.getPayrollById = exports.getMyPayroll = exports.getAllPayroll = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const activityLogger_service_1 = require("../services/activityLogger.service");
const changeDetector_1 = require("../utils/changeDetector");
const ExcelJS = __importStar(require("exceljs"));
const prisma = new client_1.PrismaClient();
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
};
// Determine schedule based on employee role
const getEmployeeSchedule = (employee) => {
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
const toNumber = (value) => {
    if (value == null)
        return 0;
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string')
        return Number(value) || 0;
    if (typeof value === 'object' && value && 'toNumber' in value && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    return Number(value) || 0;
};
const roundCurrency = (value) => Math.round(value * 100) / 100;
const roundHours = (minutes) => Math.round((minutes / 60) * 100) / 100;
const dateOnly = (value) => value.toISOString().split('T')[0];
const getWeekOfMonth = (value) => Math.floor((value.getDate() - 1) / 7) + 1;
const getWeekNumber = (value) => {
    const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
const getProratedDeductions = (weekStart) => {
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
const timeToMinutes = (value) => {
    if (!value)
        return null;
    return value.getHours() * 60 + value.getMinutes();
};
const minutesToTime = (value) => {
    if (value == null)
        return null;
    const hours = Math.floor(value / 60).toString().padStart(2, '0');
    const minutes = Math.floor(value % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};
const overlapMinutes = (start, end, rangeStart, rangeEnd) => Math.max(0, Math.min(end, rangeEnd) - Math.max(start, rangeStart));
const minutesToDayFraction = (minutes, schedule) => {
    if (minutes <= 0)
        return 0;
    const paidDayMinutes = schedule.paidDayMinutes || 480; // Default to 8 hours if not specified
    const minimumThreshold = 30; // Minimum 30 minutes required to count any day fraction
    const quarterDay = paidDayMinutes / 4;
    const halfDay = paidDayMinutes / 2;
    const threeQuarterDay = (paidDayMinutes * 3) / 4;
    if (minutes < minimumThreshold)
        return 0; // Below minimum threshold, no day credit
    if (minutes <= quarterDay)
        return 0.25;
    if (minutes <= halfDay)
        return 0.5;
    if (minutes <= threeQuarterDay)
        return 0.75;
    return 1;
};
const employeeSummary = (employee) => ({
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
const calculatePayrollDetails = (dailyRate, payableDays, approvedOvertimeHours, performanceAllowance, hasDeductions, cashAdvance, weekStart) => {
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
const buildPayrollSummary = (employee, attendanceRecords) => {
    const issues = [];
    const dailyBreakdown = [];
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
        const dayIssues = [];
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
        }
        else if (checkInMinutes == null) {
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
            }
            else {
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
const toPayrollResponse = async (record, options) => {
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
                code: 'NO_ATTENDANCE',
                severity: 'warning',
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
const getPayrollRecordOrThrow = async (id) => {
    const record = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!record) {
        throw new error_middleware_1.AppError('Payroll record not found', 404);
    }
    return record;
};
// Function to consume approved overtime requests for payroll calculation
const getApprovedOvertimeRequests = async (employeeId, weekStart, weekEnd) => {
    try {
        const requests = await prisma.overtimeRequest.findMany({
            where: {
                employeeId: employeeId,
                status: 'APPROVED',
                requestDate: {
                    gte: weekStart,
                    lte: weekEnd,
                },
                payrollRecordId: null,
            },
            select: {
                id: true,
                requestedHours: true,
                requestDate: true,
                startTime: true,
                endTime: true,
                reason: true,
            },
        });
        return requests.map(r => ({
            ...r,
            requestedHours: Number(r.requestedHours)
        }));
    }
    catch (error) {
        console.error('Error fetching approved overtime requests:', error);
        return [];
    }
};
// Function to mark overtime requests as applied to payroll
const markOvertimeRequestsAsApplied = async (overtimeRequestIds, payrollRecordId) => {
    try {
        if (!overtimeRequestIds || overtimeRequestIds.length === 0)
            return;
        await prisma.overtimeRequest.updateMany({
            where: {
                id: {
                    in: overtimeRequestIds
                }
            },
            data: {
                payrollRecordId: payrollRecordId,
                appliedToPayrollAt: new Date(),
                status: 'APPLIED_TO_PAYROLL'
            }
        });
    }
    catch (error) {
        console.error('Error marking overtime requests as applied:', error);
    }
};
const upsertPayrollForEmployeeWeek = async (employee, weekStart, weekEnd) => {
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
    const approvedOvertimeHoursFromRequests = approvedOvertimeRequests.reduce((total, request) => total + Number(request.requestedHours), 0);
    const existingRecord = await prisma.payrollRecord.findFirst({
        where: {
            employeeId: employee.id,
            payroll_week_start: weekStart,
            payroll_week_end: weekEnd,
        },
    });
    if (existingRecord?.status === 'processed') {
        return { record: existingRecord, summary, action: 'skipped_processed' };
    }
    // Use existing overtime hours if available, otherwise use approved requests
    const approvedOvertimeHours = existingRecord
        ? toNumber(existingRecord.overtimeHours)
        : approvedOvertimeHoursFromRequests;
    const cashAdvance = existingRecord ? toNumber(existingRecord.cash_advance) : 0;
    const calculations = calculatePayrollDetails(dailyRate, summary.payableDays, approvedOvertimeHours, performanceAllowance, hasDeductions, cashAdvance, weekStart);
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
        status: 'draft',
    };
    if (existingRecord) {
        const changes = (0, changeDetector_1.detectChanges)(existingRecord, {
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
            await markOvertimeRequestsAsApplied(approvedOvertimeRequests.map(req => req.id), record.id);
        }
        return { record, summary, action: 'updated', previous: existingRecord, changes };
    }
    const record = await prisma.payrollRecord.create({
        data: payload,
    });
    // Mark overtime requests as applied to payroll (only if we used overtime requests)
    if (approvedOvertimeRequests.length > 0) {
        await markOvertimeRequestsAsApplied(approvedOvertimeRequests.map(req => req.id), record.id);
    }
    return { record, summary, action: 'created' };
};
const getAllPayroll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const employeeId = req.query.employeeId ? parseInt(req.query.employeeId) : undefined;
        const status = req.query.status;
        const weekStart = req.query.weekStart ? new Date(req.query.weekStart) : undefined;
        const weekEnd = req.query.weekEnd ? new Date(req.query.weekEnd) : undefined;
        const search = req.query.search;
        const branch = req.query.branch;
        const where = {};
        if (employeeId)
            where.employeeId = employeeId;
        if (status && ['draft', 'processed'].includes(status))
            where.status = status;
        if (weekStart) {
            where.payroll_week_start = { gte: weekStart };
        }
        if (weekEnd) {
            where.payroll_week_end = { lte: weekEnd };
        }
        // Add branch filtering using branch_code from PayrollRecord
        if (branch) {
            where.branch_code = branch;
        }
        // Add search filtering by employee name or employee code
        // Only apply search if employeeId is not already specified (to avoid conflicts)
        let employeeIds;
        if (search && !employeeId) {
            const matchingEmployees = await prisma.employee.findMany({
                where: {
                    OR: [
                        { firstName: { contains: search } },
                        { middleName: { contains: search } },
                        { lastName: { contains: search } },
                        { employeeCode: { contains: search } },
                    ],
                },
                select: { id: true },
            });
            employeeIds = matchingEmployees.map((e) => e.id);
            if (employeeIds.length > 0) {
                where.employeeId = { in: employeeIds };
            }
            else {
                // If no employees match, return empty results
                where.employeeId = -1; // Impossible ID to return no results
            }
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
        const response = {
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
        await (0, activityLogger_service_1.logView)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAllPayroll = getAllPayroll;
const getMyPayroll = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const employeeId = parseInt(req.query.employeeId);
        if (!employeeId) {
            throw new error_middleware_1.AppError('Employee ID is required', 400);
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
        const response = {
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
        await (0, activityLogger_service_1.logView)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getMyPayroll = getMyPayroll;
const getPayrollById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const record = await getPayrollRecordOrThrow(id);
        const data = await toPayrollResponse(record, { includeDailyBreakdown: true });
        const response = {
            success: true,
            message: 'Payroll record retrieved successfully',
            data,
        };
        await (0, activityLogger_service_1.logView)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getPayrollById = getPayrollById;
const calculatePayroll = async (req, res, next) => {
    try {
        const { employeeId, weekStart, weekEnd } = req.body;
        if (!employeeId || !weekStart || !weekEnd) {
            throw new error_middleware_1.AppError('Employee ID, week start and end dates are required', 400);
        }
        const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        const result = await upsertPayrollForEmployeeWeek(employee, new Date(weekStart), new Date(weekEnd));
        if (result.action === 'skipped_processed') {
            throw new error_middleware_1.AppError('Processed payroll records cannot be recalculated', 409);
        }
        if (result.action === 'updated') {
            await (0, activityLogger_service_1.logUpdate)({
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
        }
        else {
            await (0, activityLogger_service_1.logCreate)({
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
        const response = {
            success: true,
            message: 'Payroll calculated successfully',
            data,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.calculatePayroll = calculatePayroll;
const calculateWeeklyPayrollBatch = async (req, res, next) => {
    try {
        const { weekStart, weekEnd } = req.body;
        if (!weekStart || !weekEnd) {
            throw new error_middleware_1.AppError('Week start and week end are required', 400);
        }
        const startDate = new Date(weekStart);
        const endDate = new Date(weekEnd);
        const employees = await prisma.employee.findMany({
            where: { status: 'Active' },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        });
        const results = [];
        let created = 0;
        let updated = 0;
        let skippedProcessed = 0;
        for (const employee of employees) {
            const result = await upsertPayrollForEmployeeWeek(employee, startDate, endDate);
            if (result.action === 'created')
                created += 1;
            if (result.action === 'updated')
                updated += 1;
            if (result.action === 'skipped_processed')
                skippedProcessed += 1;
            results.push(await toPayrollResponse(result.record, { cachedEmployee: employee }));
        }
        await (0, activityLogger_service_1.logCreate)({
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
        const response = {
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
    }
    catch (error) {
        next(error);
    }
};
exports.calculateWeeklyPayrollBatch = calculateWeeklyPayrollBatch;
const approvePayrollOvertime = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const requestedHours = req.body?.hours != null ? Number(req.body.hours) : undefined;
        const record = await getPayrollRecordOrThrow(id);
        if (record.status === 'processed') {
            throw new error_middleware_1.AppError('Processed payroll records cannot be modified', 409);
        }
        const employee = await prisma.employee.findUnique({ where: { id: record.employeeId } });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        const summary = buildPayrollSummary(employee, await prisma.attendance.findMany({
            where: {
                employeeId: record.employeeId,
                date: {
                    gte: record.payroll_week_start,
                    lte: record.payroll_week_end,
                },
            },
            orderBy: { date: 'asc' },
        }));
        const approvedHours = requestedHours == null ? summary.overtimeHoursCandidate : Math.max(0, Math.min(requestedHours, summary.overtimeHoursCandidate));
        const calculations = calculatePayrollDetails(toNumber(record.daily_rate), summary.payableDays, approvedHours, toNumber(record.performance_allowance), Boolean(employee.hasDeductions) || toNumber(record.sss_contribution) > 0 || toNumber(record.phic_contribution) > 0 || toNumber(record.hdmf_contribution) > 0 || false, toNumber(record.cash_advance), record.payroll_week_start);
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
        await (0, activityLogger_service_1.logApprove)({
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
        const response = {
            success: true,
            message: 'Payroll overtime approved successfully',
            data,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.approvePayrollOvertime = approvePayrollOvertime;
const processPayroll = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const record = await getPayrollRecordOrThrow(id);
        if (record.status === 'processed') {
            throw new error_middleware_1.AppError('Payroll already processed', 409);
        }
        const employee = await prisma.employee.findUnique({ where: { id: record.employeeId } });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        const detailed = await toPayrollResponse(record, { cachedEmployee: employee });
        if (detailed.issues.some((issue) => issue.severity === 'error')) {
            throw new error_middleware_1.AppError('Payroll record still has blocking review issues', 409);
        }
        const updatedRecord = await prisma.payrollRecord.update({
            where: { id },
            data: { status: 'processed' },
        });
        await (0, activityLogger_service_1.logApprove)({
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
        const response = {
            success: true,
            message: 'Payroll processed successfully',
            data,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.processPayroll = processPayroll;
const updatePayrollStatus = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        if (!['draft', 'processed'].includes(status || '')) {
            throw new error_middleware_1.AppError('Invalid status value. Use draft or processed', 400);
        }
        const record = await getPayrollRecordOrThrow(id);
        const updatedRecord = await prisma.payrollRecord.update({
            where: { id },
            data: { status: status },
        });
        await (0, activityLogger_service_1.logUpdate)({
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
        const response = {
            success: true,
            message: `Payroll status updated to ${status}`,
            data,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.updatePayrollStatus = updatePayrollStatus;
const syncPayrollDeductions = async (req, res, next) => {
    try {
        // Get all employees
        const employees = await prisma.employee.findMany();
        // Get all payroll records
        const payrollRecords = await prisma.payrollRecord.findMany();
        let updatedCount = 0;
        const updates = [];
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
        await (0, activityLogger_service_1.logUpdate)({
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
        const response = {
            success: true,
            message: `Synced ${updatedCount} payroll records with employee deduction settings`,
            data: { updatedCount, updates },
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.syncPayrollDeductions = syncPayrollDeductions;
const exportPayrollToExcel = async (req, res, next) => {
    try {
        const weekStart = req.query.weekStart ? new Date(req.query.weekStart) : undefined;
        const weekEnd = req.query.weekEnd ? new Date(req.query.weekEnd) : undefined;
        const status = req.query.status;
        const branch = req.query.branch;
        const search = req.query.search;
        const where = {};
        if (status && ['draft', 'processed'].includes(status))
            where.status = status;
        if (weekStart) {
            where.payroll_week_start = { gte: weekStart };
        }
        if (weekEnd) {
            where.payroll_week_end = { lte: weekEnd };
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
        }, {});
        // Calculate date range for filename and headers
        const dateRange = weekStart && weekEnd
            ? `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`
            : 'All Dates';
        const workbook = new ExcelJS.Workbook();
        // Create a separate sheet for each branch with unique names
        const usedSheetNames = new Set();
        for (const [branchName, branchData] of Object.entries(groupedByBranch)) {
            let sheetName = branchName.substring(0, 31); // Excel sheet name max 31 chars
            let counter = 1;
            let worksheet;
            // Ensure unique sheet name by adding suffix if duplicate
            // Use try-catch to handle ExcelJS duplicate name error
            while (true) {
                try {
                    worksheet = workbook.addWorksheet(sheetName);
                    break; // Success, exit the loop
                }
                catch (error) {
                    if (error.message && error.message.includes('Worksheet name already exists')) {
                        const suffix = ` (${counter})`;
                        // Truncate base name to accommodate suffix, ensuring total length <= 31
                        const maxBaseLength = 31 - suffix.length;
                        const baseName = branchName.substring(0, Math.max(0, maxBaseLength));
                        sheetName = `${baseName}${suffix}`;
                        counter++;
                    }
                    else {
                        throw error; // Re-throw if it's a different error
                    }
                }
            }
            usedSheetNames.add(sheetName);
            // Header section with project name and date range
            worksheet.mergeCells('A1:O1');
            const headerCell = worksheet.getCell('A1');
            headerCell.value = branchName.toUpperCase();
            headerCell.font = { size: 14, bold: true, name: 'Aptos Narrow' };
            headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
            // Date range header
            worksheet.mergeCells('A2:O2');
            const dateCell = worksheet.getCell('A2');
            dateCell.value = dateRange.toUpperCase();
            dateCell.font = { size: 11, bold: true, name: 'Aptos Narrow' };
            dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
            // Group header: DEDUCTION (K3:O3)
            worksheet.mergeCells('K3:O3');
            const deductionGroupCell = worksheet.getCell('K3');
            deductionGroupCell.value = 'DEDUCTION';
            deductionGroupCell.font = { size: 11, bold: true, name: 'Aptos Narrow' };
            deductionGroupCell.alignment = { horizontal: 'center', vertical: 'middle' };
            // Row 4 & Row 5 Column headers
            const row4Values = [
                'EMP-CODE',
                'NAME',
                'DAYS WORKED',
                'HOURS WORKED',
                'DAILY RATE',
                'BASIC PAY',
                'OVERTIME',
                'OVERTIME',
                'GROSS PAY',
                'PERFORMANCE ALLOWANCE',
                'GROSS ALLOWANCE',
                'CA',
                'TOTAL',
                'TAKE HOME PAY',
                'SIGNATURE',
            ];
            const row5Values = [
                'EMP-CODE',
                'NAME',
                'DAYS WORKED',
                'HOURS WORKED',
                'DAILY RATE',
                'BASIC PAY',
                'HRS',
                'AMT',
                'GROSS PAY',
                'PERFORMANCE ALLOWANCE',
                'GROSS ALLOWANCE',
                'CA',
                'TOTAL',
                'TAKE HOME PAY',
                'SIGNATURE',
            ];
            const row4 = worksheet.addRow(row4Values);
            const row5 = worksheet.addRow(row5Values);
            // Perform column header cell merges
            worksheet.mergeCells('A4:A5');
            worksheet.mergeCells('B4:B5');
            worksheet.mergeCells('C4:C5');
            worksheet.mergeCells('D4:D5');
            worksheet.mergeCells('E4:E5');
            worksheet.mergeCells('F4:F5');
            worksheet.mergeCells('G4:H4'); // OVERTIME header merge
            worksheet.mergeCells('I4:I5');
            worksheet.mergeCells('J4:J5');
            worksheet.mergeCells('K4:K5');
            worksheet.mergeCells('L4:L5');
            worksheet.mergeCells('M4:M5');
            worksheet.mergeCells('N4:N5');
            worksheet.mergeCells('O4:O5');
            // Style header rows 4 & 5
            [row4, row5].forEach((row) => {
                row.font = { bold: true, size: 11, name: 'Aptos Narrow' };
                row.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            });
            // Highlight specified headers in Red font (PERFORMANCE ALLOWANCE, GROSS ALLOWANCE, CA)
            const redHeaderCols = [10, 11, 12]; // J, K, L
            redHeaderCols.forEach((colIdx) => {
                worksheet.getCell(4, colIdx).font = { bold: true, size: 11, color: { argb: 'FFFF0000' }, name: 'Aptos Narrow' };
                worksheet.getCell(5, colIdx).font = { bold: true, size: 11, color: { argb: 'FFFF0000' }, name: 'Aptos Narrow' };
            });
            // Add borders to header rows (Rows 3, 4, 5)
            for (let r = 3; r <= 5; r++) {
                const row = worksheet.getRow(r);
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                });
            }
            // Add data rows starting at Row 6
            branchData.forEach((data, index) => {
                const rowIdx = 6 + index;
                const grossAllowance = data.grossPay + data.performanceAllowance;
                const totalDeductions = data.cashAdvance;
                const takeHomePay = grossAllowance - totalDeductions;
                const row = worksheet.addRow([
                    data.employeeCode,
                    data.name,
                    data.daysWorked,
                    data.daysWorked * 8,
                    data.dailyRate,
                    { formula: `C${rowIdx}*E${rowIdx}`, result: data.basicPay },
                    data.overtimeHours || null,
                    data.overtimeAmount || null,
                    { formula: `F${rowIdx}+H${rowIdx}`, result: data.grossPay },
                    data.performanceAllowance || null,
                    { formula: `I${rowIdx}+J${rowIdx}`, result: grossAllowance },
                    data.cashAdvance || null,
                    { formula: `L${rowIdx}`, result: totalDeductions },
                    { formula: `K${rowIdx}-M${rowIdx}`, result: takeHomePay },
                    '', // SIGNATURE column
                ]);
                row.font = { size: 11, name: 'Aptos Narrow' };
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' },
                    };
                    // Center align except for NAME column (Col 2)
                    cell.alignment = {
                        horizontal: colNumber === 2 ? 'left' : 'center',
                        vertical: 'middle',
                    };
                });
            });
            const lastDataRow = 5 + branchData.length;
            const totalRowIdx = lastDataRow + 1;
            // Add Summary Total Row at the bottom
            const totalRow = worksheet.addRow([
                '',
                '',
                { formula: `SUM(C6:C${lastDataRow})` },
                { formula: `SUM(D6:D${lastDataRow})` },
                { formula: `SUM(E6:E${lastDataRow})` },
                { formula: `SUM(F6:F${lastDataRow})` },
                { formula: `SUM(G6:G${lastDataRow})` },
                { formula: `SUM(H6:H${lastDataRow})` },
                { formula: `SUM(I6:I${lastDataRow})` },
                { formula: `SUM(J6:J${lastDataRow})` },
                { formula: `SUM(K6:K${lastDataRow})` },
                { formula: `SUM(L6:L${lastDataRow})` },
                { formula: `SUM(M6:M${lastDataRow})` },
                { formula: `SUM(N6:N${lastDataRow})` },
                '',
            ]);
            totalRow.font = { bold: true, size: 11, name: 'Aptos Narrow' };
            totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'medium' },
                    right: { style: 'thin' },
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });
            // Add thick outer borders to table boundaries
            for (let r = 4; r <= totalRowIdx; r++) {
                worksheet.getCell(`A${r}`).border = { ...worksheet.getCell(`A${r}`).border, left: { style: 'medium' } };
                worksheet.getCell(`O${r}`).border = { ...worksheet.getCell(`O${r}`).border, right: { style: 'medium' } };
            }
            // Column widths configuration (15 columns: A to O)
            const columnWidths = [
                { width: 14 }, // A: EMP-CODE
                { width: 28 }, // B: NAME
                { width: 14 }, // C: DAYS WORKED
                { width: 15 }, // D: HOURS WORKED
                { width: 14 }, // E: DAILY RATE
                { width: 14 }, // F: BASIC PAY
                { width: 10 }, // G: OVERTIME HRS
                { width: 14 }, // H: OVERTIME AMT
                { width: 14 }, // I: GROSS PAY
                { width: 22 }, // J: PERFORMANCE ALLOWANCE
                { width: 20 }, // K: GROSS ALLOWANCE
                { width: 12 }, // L: CA
                { width: 12 }, // M: TOTAL
                { width: 18 }, // N: TAKE HOME PAY
                { width: 20 }, // O: SIGNATURE
            ];
            worksheet.columns.forEach((column, index) => {
                if (columnWidths[index]) {
                    column.width = columnWidths[index].width;
                }
            });
            // Format currency columns (#,##0.00)
            const currencyColumns = [5, 6, 8, 9, 10, 11, 12, 13, 14];
            currencyColumns.forEach((colIndex) => {
                worksheet.getColumn(colIndex).numFmt = '#,##0.00';
            });
        }
        // Generate filename
        const filename = `payroll-export-${dateRange.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
        await (0, activityLogger_service_1.logView)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.exportPayrollToExcel = exportPayrollToExcel;
//# sourceMappingURL=payroll.controller.js.map