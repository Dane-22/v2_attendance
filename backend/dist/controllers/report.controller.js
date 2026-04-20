"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.getEmployeeSummary = exports.getPayrollReport = exports.getAttendanceReport = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const prisma = new client_1.PrismaClient();
const getAttendanceReport = async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const department = req.query.department;
        const where = {
            date: {
                gte: startDate,
                lte: endDate
            }
        };
        const attendances = await prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' }
        });
        // Fetch employees separately since there's no relation
        const employeeIds = [...new Set(attendances.map(a => a.employeeId))];
        const employees = await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, employeeCode: true, firstName: true, lastName: true, department: true }
        });
        const employeeMap = new Map(employees.map(e => [e.id, e]));
        const filteredAttendances = department
            ? attendances.filter(a => employeeMap.get(a.employeeId)?.department === department)
            : attendances;
        // Calculate work hours from check_in/check_out
        const totalWorkHours = filteredAttendances.reduce((sum, a) => {
            if (a.check_in && a.check_out) {
                const hours = (a.check_out.getTime() - a.check_in.getTime()) / (1000 * 60 * 60);
                return sum + hours;
            }
            return sum;
        }, 0);
        const stats = {
            totalRecords: filteredAttendances.length,
            presentCount: filteredAttendances.filter(a => a.status === 'present').length,
            lateCount: filteredAttendances.filter(a => a.status === 'late').length,
            absentCount: filteredAttendances.filter(a => a.status === 'absent').length,
            totalWorkHours: Math.round(totalWorkHours * 100) / 100,
            totalOvertimeHours: 0 // Not tracked in Attendance model
        };
        const response = {
            success: true,
            message: 'Attendance report generated',
            data: {
                period: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0]
                },
                stats,
                records: filteredAttendances
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.getAttendanceReport = getAttendanceReport;
const getPayrollReport = async (req, res, next) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const department = req.query.department;
        const payrollRecords = await prisma.payrollRecord.findMany({
            where: {
                payroll_week_start: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        // Fetch employees separately for department filtering
        const employeeIds = [...new Set(payrollRecords.map(p => p.employeeId))];
        const employees = await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, department: true }
        });
        const employeeMap = new Map(employees.map(e => [e.id, e]));
        const filteredRecords = department
            ? payrollRecords.filter(p => employeeMap.get(p.employeeId)?.department === department)
            : payrollRecords;
        const summary = {
            period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
            totalGross: filteredRecords.reduce((sum, p) => sum + (p.grossPay?.toNumber() || 0), 0),
            totalNet: filteredRecords.reduce((sum, p) => sum + (p.netPay?.toNumber() || 0), 0),
            totalDeductions: filteredRecords.reduce((sum, p) => sum + (p.total_deductions?.toNumber() || 0), 0),
            totalTax: 0, // Tax not tracked separately in schema
            employeeCount: new Set(filteredRecords.map(p => p.employeeId)).size
        };
        const response = {
            success: true,
            message: 'Payroll report generated',
            data: {
                summary,
                records: filteredRecords
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.getPayrollReport = getPayrollReport;
const getEmployeeSummary = async (req, res, next) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const employees = await prisma.employee.findMany({
            where: { status: 'Active' },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: true,
                position: true
            }
        });
        const summary = await Promise.all(employees.map(async (emp) => {
            const attendance = await prisma.attendance.findMany({
                where: {
                    employeeId: emp.id,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const payroll = await prisma.payrollRecord.findFirst({
                where: {
                    employeeId: emp.id,
                    payroll_week_start: startDate,
                    payroll_week_end: endDate
                }
            });
            // Calculate hours from check_in/check_out
            const totalHours = attendance.reduce((sum, a) => {
                if (a.check_in && a.check_out) {
                    return sum + (a.check_out.getTime() - a.check_in.getTime()) / (1000 * 60 * 60);
                }
                return sum;
            }, 0);
            const stats = {
                totalDays: attendance.length,
                presentDays: attendance.filter(a => a.status === 'present').length,
                absentDays: attendance.filter(a => a.status === 'absent').length,
                lateDays: attendance.filter(a => a.status === 'late').length,
                totalHours: Math.round(totalHours * 100) / 100,
                overtimeHours: 0, // Not tracked on Attendance model
                averageHoursPerDay: attendance.length > 0 ? totalHours / attendance.length : 0
            };
            return {
                employee: emp,
                attendance: stats,
                payroll: payroll ? {
                    grossPay: payroll.grossPay,
                    netPay: payroll.netPay,
                    status: payroll.status
                } : null
            };
        }));
        const response = {
            success: true,
            message: 'Employee summary generated',
            data: summary
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.getEmployeeSummary = getEmployeeSummary;
const exportReport = async (req, res, next) => {
    try {
        const { type } = req.params;
        const format = req.query.format || 'json';
        if (!['attendance', 'payroll', 'employees'].includes(type)) {
            throw new error_middleware_1.AppError('Invalid report type', 400);
        }
        if (!['json', 'csv'].includes(format)) {
            throw new error_middleware_1.AppError('Invalid format. Use json or csv', 400);
        }
        let data = [];
        let filename = `${type}_report_${new Date().toISOString().split('T')[0]}`;
        if (type === 'attendance') {
            data = await prisma.attendance.findMany({
                orderBy: { date: 'desc' },
                take: 1000
            });
        }
        else if (type === 'payroll') {
            data = await prisma.payrollRecord.findMany({
                orderBy: { payroll_week_start: 'desc' },
                take: 1000
            });
        }
        else if (type === 'employees') {
            data = await prisma.employee.findMany({
                select: {
                    id: true,
                    employeeCode: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    department: true,
                    position: true,
                    status: true,
                    dailyRate: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (format === 'csv') {
            const headers = Object.keys(data[0] || {}).join(',');
            const rows = data.map(row => Object.values(row).map(v => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(','));
            const csv = [headers, ...rows].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csv);
        }
        else {
            const response = {
                success: true,
                message: 'Report exported successfully',
                data
            };
            res.json(response);
        }
    }
    catch (error) {
        next(error);
    }
};
exports.exportReport = exportReport;
//# sourceMappingURL=report.controller.js.map