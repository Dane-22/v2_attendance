import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Employee } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/api.types';
import { logCreate, logUpdate, logDelete, logError } from '../services/activityLogger.service';
import { detectChanges } from '../utils/changeDetector';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for profile image uploads
const uploadDir = path.join(process.cwd(), 'assets', 'profile-images', 'employees');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const employeeId = req.params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${employeeId}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

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
          branchId: true,
          defaultBranchId: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.employee.count({ where })
    ]);

    const response: any = {
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

    if (!data.firstName || !data.lastName) {
      throw new AppError('First name and last name are required', 400);
    }

    let employeeCode = data.employeeCode;

    // Auto-generate employeeCode if not provided based on Position
    if (!employeeCode) {
      const position = (data.position || 'Worker').toLowerCase();
      const year = new Date().getFullYear();
      let prefix = '';
      let pattern = '';

      if (position.includes('engineer')) {
        prefix = `ENG-${year}-`;
        pattern = `ENG-${year}-%`;
      } else if (position.includes('developer')) {
        prefix = `DEV-${year}-`;
        pattern = `DEV-${year}-%`;
      } else if (position.includes('admin')) {
        prefix = `ADMIN-${year}-`;
        pattern = `ADMIN-${year}-%`;
      } else {
        // Default to Worker (E####)
        prefix = 'E';
        pattern = 'E%';
      }

      // Find the last employee with this prefix pattern
      const lastEmployee = await prisma.employee.findFirst({
        where: {
          employeeCode: {
            startsWith: prefix
          }
        },
        orderBy: {
          employeeCode: 'desc'
        }
      });

      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeCode) {
        const currentCode = lastEmployee.employeeCode;
        // Extract the numeric part (the last 4 digits)
        const match = currentCode.match(/(\d{4})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Format with 4-digit padding
      employeeCode = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
      
      // Safety check: ensure the generated code doesn't exist (in case of gaps)
      let codeExists = true;
      let safetyCounter = 0;
      while (codeExists && safetyCounter < 100) {
        const existing = await prisma.employee.findUnique({
          where: { employeeCode }
        });
        if (!existing) {
          codeExists = false;
        } else {
          nextNumber++;
          employeeCode = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
          safetyCounter++;
        }
      }
    } else {
      // If code is provided manually, check for uniqueness
      const existingEmployee = await prisma.employee.findUnique({
        where: { employeeCode }
      });

      if (existingEmployee) {
        throw new AppError('Employee code already exists', 409);
      }
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
        employeeCode: employeeCode,
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

export const uploadProfileImage = async (
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

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Generate the image URL path
    const imagePath = `/assets/profile-images/employees/${req.file.filename}`;

    // Update employee with new profile image
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { profileImage: imagePath },
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
        
        branchId: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log profile image update
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Updated profile image for employee: ${employee.employeeCode}`,
      detailsBefore: { profileImage: employee.profileImage },
      detailsAfter: { profileImage: imagePath },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
    });

    const response: ApiResponse<typeof updatedEmployee> = {
      success: true,
      message: 'Profile image uploaded successfully',
      data: updatedEmployee
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const transferEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { branchCode, reason } = req.body;

    if (!branchCode) {
      throw new AppError('Branch code is required', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Check if employee is already in the destination branch
    if (employee.branchCode === branchCode) {
      throw new AppError('Employee is already in this branch', 400);
    }

    // Check if destination branch exists
    const destinationBranch = await prisma.branches.findUnique({
      where: { branch_code: branchCode }
    });

    if (!destinationBranch) {
      throw new AppError('Destination branch not found', 404);
    }

    // Check if employee has active clock-in (timeIn but no timeOut)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: id,
        date: {
          gte: today,
          lt: tomorrow
        },
        check_in: { not: null },
        check_out: null
      }
    });

    if (activeAttendance) {
      throw new AppError('Cannot transfer employee with active clock-in. Please clock out first.', 400);
    }

    const previousBranch = employee.branchCode;

    // Update employee branch
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        branchCode,
        branchName: destinationBranch.branch_name,
        branchId: destinationBranch.id
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
        
        branchId: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log employee transfer
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Transferred employee ${employee.employeeCode} - ${employee.firstName} ${employee.lastName} from ${previousBranch} to ${branchCode}${reason ? ` (Reason: ${reason})` : ''}`,
      detailsBefore: { branchCode: previousBranch, branchName: employee.branchName },
      detailsAfter: { branchCode, branchName: destinationBranch.branch_name },
      changes: ['branchCode', 'branchName'],
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
      metadata: { previousBranch, newBranch: branchCode, reason }
    });

    const response: ApiResponse<{ employee: typeof updatedEmployee; previousBranch: string | null }> = {
      success: true,
      message: 'Employee transferred successfully',
      data: {
        employee: updatedEmployee,
        previousBranch
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const archiveEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { id }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Copy employee data to archived_employees table
    const archivedEmployee = await prisma.$queryRaw`
      INSERT INTO archived_employees (
        id, employeeCode, firstName, middleName, lastName, email, department,
        position, branchName, branchCode, status, dailyRate, performanceAllowance,
        hasDeductions, branchId, defaultBranchId, profileImage,
        createdAt, updatedAt, archivedAt, archivedBy, archiveReason
      )
      VALUES (
        ${employee.id}, ${employee.employeeCode}, ${employee.firstName}, ${employee.middleName},
        ${employee.lastName}, ${employee.email}, ${employee.department}, ${employee.position},
        ${employee.branchName}, ${employee.branchCode}, 'Inactive', ${employee.dailyRate},
        ${employee.performanceAllowance}, ${employee.hasDeductions},
        ${employee.branchId}, ${employee.defaultBranchId}, ${employee.profileImage},
        ${employee.createdAt}, ${employee.updatedAt}, NOW(),
        ${req.admin?.name || 'unknown'}, ${reason || 'Employee archived'}
      )
    `;

    // Update employee status to Inactive
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { status: 'Inactive' },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });

    // Log employee archiving
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employee.id.toString(),
      entityName: `${employee.firstName} ${employee.lastName}`,
      description: `Archived employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
      detailsBefore: { status: employee.status },
      detailsAfter: { status: 'Inactive' },
      changes: ['status'],
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      branchId: employee.branchId || undefined,
      metadata: { reason, archivedBy: req.admin?.name }
    });

    const response: ApiResponse<typeof updatedEmployee> = {
      success: true,
      message: 'Employee archived successfully',
      data: updatedEmployee
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Export upload middleware for use in routes
export const uploadMiddleware = upload.single('profileImage');
