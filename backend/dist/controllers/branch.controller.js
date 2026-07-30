"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBranchEmployees = exports.getBranches = void 0;
const client_1 = require("@prisma/client");
const activityLogger_service_1 = require("../services/activityLogger.service");
const prisma = new client_1.PrismaClient();
const getBranches = async (req, res, next) => {
    try {
        // Get branch devices from admins table (where role is empty or branch device)
        const admins = await prisma.admins.findMany({
            where: {
                branch_code: { not: null }
            },
            select: {
                id: true,
                name: true,
                branch_code: true,
            },
            orderBy: {
                branch_code: 'asc'
            }
        });
        // Get all branch codes
        const branchCodes = admins.map(a => a.branch_code).filter(Boolean);
        // Fetch branch names from branches table
        const branchesData = await prisma.branches.findMany({
            where: {
                branch_code: { in: branchCodes }
            },
            select: {
                branch_code: true,
                branch_name: true
            }
        });
        // Create a map of branch_code to branch_name
        const branchNameMap = new Map(branchesData.map(b => [b.branch_code, b.branch_name]));
        // Format branches with names from database
        const formattedBranches = admins.map(admin => {
            const branchName = branchNameMap.get(admin.branch_code || '') || admin.branch_code || 'Unknown';
            return {
                id: admin.id.toString(),
                code: admin.branch_code || '',
                name: branchName,
                shortName: branchName,
                description: `Deploy employees to ${branchName} for attendance.`
            };
        });
        // Log branch list view
        await (0, activityLogger_service_1.logView)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'BRANCH',
            description: `Viewed all branches (${admins.length} branches)`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { branchCount: admins.length },
        });
        res.json({
            success: true,
            data: formattedBranches
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBranches = getBranches;
const getBranchEmployees = async (req, res, next) => {
    try {
        const { branchCode } = req.params;
        console.log('=== GET BRANCH EMPLOYEES ===');
        console.log('Branch code:', branchCode);
        // Get Philippines date range for attendance query
        const getPhilippinesDateString = () => {
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
        const todayStr = getPhilippinesDateString();
        const [year, month, day] = todayStr.split('-').map(Number);
        // Philippines timezone is UTC+8, so the day starts at 16:00 UTC previous day
        const todayStart = new Date(Date.UTC(year, month - 1, day - 1, 16, 0, 0));
        const todayEnd = new Date(Date.UTC(year, month - 1, day, 16, 0, 0));
        console.log('Today date range (Philippines timezone):', todayStart.toISOString(), 'to', todayEnd.toISOString());
        // Get employees for this branch using exact branch_code match
        const employees = await prisma.employee.findMany({
            where: {
                branchCode: branchCode,
                status: 'Active'
            },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                department: true,
                position: true,
                branchName: true,
                branchCode: true,
            }
        });
        console.log('Found employees:', employees.length);
        console.log('Employee IDs:', employees.map(e => e.id));
        // Get today's attendance for these employees
        const employeeIds = employees.map(e => e.id);
        // The date field is a DATE type in MySQL, so we need to compare it as a date string
        const todayDateStr = todayStr; // Already in YYYY-MM-DD format
        const todayAttendance = await prisma.attendance.findMany({
            where: {
                employeeId: { in: employeeIds },
                date: {
                    equals: new Date(todayDateStr)
                }
            },
            orderBy: { check_in: 'desc' }
        });
        console.log('Found attendance records:', todayAttendance.length);
        console.log('Attendance data:', todayAttendance.map(a => ({ id: a.id, empId: a.employeeId, check_in: a.check_in, check_out: a.check_out })));
        // Create attendance map - find most recent incomplete record for each employee
        // If no incomplete record, use the most recent complete one
        const attendanceMap = new Map();
        // First pass: find most recent incomplete (active) record for each employee
        todayAttendance.forEach((record) => {
            if (!record.check_out && record.check_in) {
                const existing = attendanceMap.get(record.employeeId);
                if (!existing || (existing.check_in && new Date(record.check_in) > new Date(existing.check_in))) {
                    attendanceMap.set(record.employeeId, record);
                }
            }
        });
        // Second pass: if no incomplete record, use most recent complete one
        todayAttendance.forEach((record) => {
            if (!attendanceMap.has(record.employeeId)) {
                attendanceMap.set(record.employeeId, record);
            }
        });
        // Format employees with attendance data
        const formattedEmployees = employees.map(emp => {
            const attendance = attendanceMap.get(emp.id);
            const checkIn = attendance?.check_in
                ? new Date(attendance.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                : null;
            const checkOut = attendance?.check_out
                ? new Date(attendance.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                : null;
            // Calculate total hours
            let totalHours = '0.00';
            if (checkIn && !checkOut) {
                const [hours, minutes] = checkIn.split(':').map(Number);
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                let totalMinutes = (currentHour * 60 + currentMinute) - (hours * 60 + minutes);
                if (totalMinutes < 0)
                    totalMinutes += 24 * 60;
                const totalH = Math.floor(totalMinutes / 60);
                const remainingMinutes = totalMinutes % 60;
                totalHours = `${totalH}.${remainingMinutes.toString().padStart(2, '0')}`;
            }
            else if (checkIn && checkOut) {
                const [inHours, inMinutes] = checkIn.split(':').map(Number);
                const [outHours, outMinutes] = checkOut.split(':').map(Number);
                let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
                if (totalMinutes < 0)
                    totalMinutes += 24 * 60;
                const totalH = Math.floor(totalMinutes / 60);
                const remainingMinutes = totalMinutes % 60;
                totalHours = `${totalH}.${remainingMinutes.toString().padStart(2, '0')}`;
            }
            return {
                id: emp.id,
                name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
                avatar: `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase(),
                profileImage: emp.profileImage,
                employeeCode: emp.employeeCode,
                department: emp.department || 'General',
                position: emp.position || 'Worker',
                branchName: emp.branchName || '',
                timeIn: checkIn,
                timeOut: checkOut,
                totalHours,
                status: attendance?.status || null,
                attendanceId: attendance?.id || null
            };
        });
        console.log('Attendance map entries:', Array.from(attendanceMap.entries()).map(([k, v]) => ({ empId: k, attId: v.id, check_in: v.check_in, check_out: v.check_out })));
        console.log('Formatted employees:', formattedEmployees.map(e => ({ id: e.id, name: e.name, timeIn: e.timeIn, timeOut: e.timeOut })));
        console.log('=== END GET BRANCH EMPLOYEES ===');
        // Log branch employees view
        await (0, activityLogger_service_1.logView)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'BRANCH',
            entityId: branchCode,
            entityName: `Branch ${branchCode}`,
            description: `Viewed employees for branch ${branchCode} (${employees.length} employees)`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            metadata: { branchCode, employeeCount: employees.length },
        });
        res.json({
            success: true,
            data: formattedEmployees
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBranchEmployees = getBranchEmployees;
//# sourceMappingURL=branch.controller.js.map