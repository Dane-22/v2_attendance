import { Response, NextFunction } from 'express';
import { PrismaClient, PayrollRecord } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse, PayrollCalculationRequest } from '../types/api.types';

const prisma = new PrismaClient();

// Calculate payroll based on daily rate and days worked
const calculatePayrollDetails = (
  dailyRate: number,
  daysWorked: number,
  overtimeHours: number,
  performanceAllowance: number,
  hasDeductions: boolean
) => {
  const basicPay = daysWorked * dailyRate;
  // Assume overtime rate is 1.25x hourly equivalent (dailyRate / 8 * 1.25)
  const hourlyRate = dailyRate / 8;
  const overtimeAmount = overtimeHours * (hourlyRate * 1.25);
  const grossPay = basicPay + overtimeAmount + performanceAllowance;
  
  // Standard Philippine deductions (simplified)
  const sssContribution = hasDeductions ? Math.min(grossPay * 0.045, 1350) : 0;
  const phicContribution = hasDeductions ? grossPay * 0.03 : 0;
  const hdmfContribution = hasDeductions ? 100 : 0;
  const totalDeductions = sssContribution + phicContribution + hdmfContribution;
  
  const netPay = grossPay - totalDeductions;

  return {
    basicPay,
    overtimeAmount,
    grossPay,
    sssContribution,
    phicContribution,
    hdmfContribution,
    totalDeductions,
    netPay
  };
};

export const getAllPayroll = async (
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
    const status = req.query.status as string;

    const where: any = {};
    
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.payroll_week_start = {};
      if (startDate) where.payroll_week_start.gte = startDate;
      if (endDate) where.payroll_week_start.lte = endDate;
    }

    const [records, total] = await Promise.all([
      prisma.payrollRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { payroll_week_start: 'desc' }
      }),
      prisma.payrollRecord.count({ where })
    ]);

    const response: PaginatedResponse<PayrollRecord> = {
      success: true,
      message: 'Payroll records retrieved successfully',
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

export const getMyPayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
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
        orderBy: { payroll_week_start: 'desc' }
      }),
      prisma.payrollRecord.count({ where: { employeeId } })
    ]);

    const response: PaginatedResponse<PayrollRecord> = {
      success: true,
      message: 'Payroll records retrieved',
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

export const getPayrollById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const record = await prisma.payrollRecord.findUnique({
      where: { id }
    });

    if (!record) {
      throw new AppError('Payroll record not found', 404);
    }

    const response: ApiResponse<typeof record> = {
      success: true,
      message: 'Payroll record retrieved successfully',
      data: record
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const calculatePayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId, weekStart, weekEnd }: PayrollCalculationRequest = req.body;

    if (!employeeId || !weekStart || !weekEnd) {
      throw new AppError('Employee ID, week start and end dates are required', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    // Count days worked from attendance records
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate
        },
        check_out: { not: null }
      }
    });

    const daysWorked = attendances.length;
    const overtimeHours = 0; // Calculate based on your business logic

    const dailyRate = employee.dailyRate?.toNumber() || 0;
    const performanceAllowance = employee.performanceAllowance?.toNumber() || 0;
    const hasDeductions = employee.hasDeduction ?? true;

    const calculations = calculatePayrollDetails(dailyRate, daysWorked, overtimeHours, performanceAllowance, hasDeductions);

    // Check for existing record
    const existingRecord = await prisma.payrollRecord.findFirst({
      where: {
        employeeId,
        payroll_week_start: startDate,
        payroll_week_end: endDate
      }
    });

    let payrollRecord;
    
    if (existingRecord) {
      payrollRecord = await prisma.payrollRecord.update({
        where: { id: existingRecord.id },
        data: {
          days_worked: daysWorked,
          overtimeHours: overtimeHours,
          basic_pay: calculations.basicPay,
          overtime_amount: calculations.overtimeAmount,
          grossPay: calculations.grossPay,
          sss_contribution: calculations.sssContribution,
          phic_contribution: calculations.phicContribution,
          hdmf_contribution: calculations.hdmfContribution,
          total_deductions: calculations.totalDeductions,
          netPay: calculations.netPay
        }
      });
    } else {
      payrollRecord = await prisma.payrollRecord.create({
        data: {
          employeeId,
          branch_code: employee.branchName || '',
          payroll_week_start: startDate,
          payroll_week_end: endDate,
          week_number: 1, // Calculate based on date
          days_worked: daysWorked,
          daily_rate: dailyRate,
          basic_pay: calculations.basicPay,
          overtimeHours: overtimeHours,
          overtime_amount: calculations.overtimeAmount,
          performance_allowance: performanceAllowance,
          grossPay: calculations.grossPay,
          sss_contribution: calculations.sssContribution,
          phic_contribution: calculations.phicContribution,
          hdmf_contribution: calculations.hdmfContribution,
          cash_advance: 0,
          total_deductions: calculations.totalDeductions,
          netPay: calculations.netPay,
          status: 'draft'
        }
      });
    }

    const response: ApiResponse<typeof payrollRecord> = {
      success: true,
      message: 'Payroll calculated successfully',
      data: payrollRecord
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const processPayroll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const record = await prisma.payrollRecord.findUnique({
      where: { id }
    });

    if (!record) {
      throw new AppError('Payroll record not found', 404);
    }

    if (record.status === 'processed') {
      throw new AppError('Payroll already processed', 409);
    }

    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: { status: 'processed' }
    });

    const response: ApiResponse<typeof updatedRecord> = {
      success: true,
      message: 'Payroll processed successfully',
      data: updatedRecord
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updatePayrollStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!['draft', 'processed'].includes(status)) {
      throw new AppError('Invalid status value. Use draft or processed', 400);
    }

    const record = await prisma.payrollRecord.findUnique({
      where: { id }
    });

    if (!record) {
      throw new AppError('Payroll record not found', 404);
    }

    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: { status }
    });

    const response: ApiResponse<typeof updatedRecord> = {
      success: true,
      message: `Payroll status updated to ${status}`,
      data: updatedRecord
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
