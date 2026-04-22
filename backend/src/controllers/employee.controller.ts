import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Employee } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/api.types';
import { logCreate, logUpdate, logDelete, logError } from '../services/activityLogger.service';
import { detectChanges } from '../utils/changeDetector';

const prisma = new PrismaClient();

export const getAllEmployees = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const department = req.query.department as string;
    const isActive = req.query.isActive === 'true' ? true : 
                     req.query.isActive === 'false' ? false : undefined;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
        { email: { contains: search } }
      ];
    }
    
    if (department) where.department = department;
    if (isActive !== undefined) where.status = isActive ? 'Active' : 'Inactive';

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          department: true,
          position: true,
          branchName: true,
          branchCode: true,
          status: true,
          dailyRate: true,
          hasDeductions: true,
          performanceAllowance: true,
          hasDeduction: true,
          branchId: true,
          defaultBranchId: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.employee.count({ where })
    ]);

    const response: PaginatedResponse<Employee> = {
      success: true,
      message: 'Employees retrieved successfully',
      data: employees,
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

export const getEmployeeById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: { id },
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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const response: ApiResponse<typeof employee> = {
      success: true,
      message: 'Employee retrieved successfully',
      data: employee
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data: CreateEmployeeRequest = req.body;

    if (!data.employeeCode || !data.firstName || !data.lastName) {
      throw new AppError('Employee code, first name, and last name are required', 400);
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode }
    });

    if (existingEmployee) {
      throw new AppError('Employee code already exists', 409);
    }

    if (data.email) {
      const existingEmail = await prisma.employee.findUnique({
        where: { email: data.email }
      });
      if (existingEmail) {
        throw new AppError('Email already exists', 409);
      }
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        email: data.email,
        department: data.department,
        position: data.position,
        branchName: data.branchName,
        branchCode: data.branchCode,
        dailyRate: data.dailyRate,
        performanceAllowance: data.performanceAllowance,
        hasDeductions: data.hasDeductions,
        hasDeduction: data.hasDeduction,
        status: 'Active'
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
        branchName: true,
        branchCode: true,
        status: true,
        dailyRate: true,
        hasDeductions: true,
        performanceAllowance: true,
        hasDeduction: true,
        branchId: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log employee creation
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Created new employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
      detailsAfter: employee,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
    });

    const response: ApiResponse<typeof employee> = {
      success: true,
      message: 'Employee created successfully',
      data: employee
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const data: UpdateEmployeeRequest = req.body;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!existingEmployee) {
      throw new AppError('Employee not found', 404);
    }

    if (data.email && data.email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email: data.email }
      });
      if (emailExists) {
        throw new AppError('Email already exists', 409);
      }
    }

    // Detect changes
    const changes = detectChanges(existingEmployee, data, 'EMPLOYEE');

    const employee = await prisma.employee.update({
      where: { id },
      data,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
        branchName: true,
        branchCode: true,
        status: true,
        dailyRate: true,
        hasDeductions: true,
        performanceAllowance: true,
        hasDeduction: true,
        branchId: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log employee update
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Updated employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
      detailsBefore: existingEmployee,
      detailsAfter: employee,
      changes: changes,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
    });

    const response: ApiResponse<typeof employee> = {
      success: true,
      message: 'Employee updated successfully',
      data: employee
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    await prisma.employee.delete({ where: { id } });

    // Log employee deletion
    await logDelete({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Deleted employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
      detailsBefore: employee,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Employee deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const generateQRCode = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee || !employee.employeeCode) {
      throw new AppError('Employee not found', 404);
    }

    // Generate QR code data (employee code only - V1 format)
    const qrData = `https://jajr.com/attendance/${employee.employeeCode}`;

    // Log QR code generation
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Generated QR code for employee: ${employee.employeeCode}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
      metadata: { qrData },
    });

    const response: ApiResponse<{ employeeId: number; employeeCode: string | null; qrData: string }> = {
      success: true,
      message: 'QR code data generated',
      data: {
        employeeId: employee.id,
        employeeCode: employee.employeeCode,
        qrData
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
