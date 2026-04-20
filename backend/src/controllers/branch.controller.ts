import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse } from '../types/api.types';

const prisma = new PrismaClient();

// Branch mapping from branch_code to full name
const branchNames: Record<string, string> = {
  'A': 'Sto. Rosario',
  'B': 'BCDA',
  'C': 'Sundara',
  'D': 'Panicsican',
  'E': 'Main Office',
  'F': 'Capitol',
  'H': 'Testing Branch',
};

export const getBranches = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get branch devices from admins table (where role is empty or branch device)
    const branches = await prisma.admins.findMany({
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

    // Format branches with full names
    const formattedBranches = branches.map(branch => ({
      id: branch.id.toString(),
      code: branch.branch_code || '',
      name: branch.name,
      shortName: branchNames[branch.branch_code || ''] || branch.branch_code || 'Unknown',
      description: `Deploy employees to ${branchNames[branch.branch_code || ''] || branch.branch_code} for attendance.`
    }));

    res.json({
      success: true,
      data: formattedBranches
    });
  } catch (error) {
    next(error);
  }
};

export const getBranchEmployees = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branchCode } = req.params;
    console.log('=== GET BRANCH EMPLOYEES ===');
    console.log('Branch code:', branchCode);

    // Get current date in local timezone and convert to UTC midnight for comparison
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    console.log('Today date:', today);

    // Get employees for this branch (case insensitive search)
    const employees = await prisma.employee.findMany({
      where: {
        branchName: {
          contains: branchCode
        },
        status: 'Active'
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        branchName: true,
      }
    });

    console.log('Found employees:', employees.length);
    console.log('Employee IDs:', employees.map(e => e.id));

    // Get today's attendance for these employees
    const employeeIds = employees.map(e => e.id);
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: today
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
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        const totalH = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        totalHours = `${totalH}.${remainingMinutes.toString().padStart(2, '0')}`;
      } else if (checkIn && checkOut) {
        const [inHours, inMinutes] = checkIn.split(':').map(Number);
        const [outHours, outMinutes] = checkOut.split(':').map(Number);
        let totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        const totalH = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        totalHours = `${totalH}.${remainingMinutes.toString().padStart(2, '0')}`;
      }

      return {
        id: emp.id,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
        avatar: `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase(),
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

    res.json({
      success: true,
      data: formattedEmployees
    });
  } catch (error) {
    next(error);
  }
};
