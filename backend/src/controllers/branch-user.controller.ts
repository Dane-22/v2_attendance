import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { logCreate, logUpdate, logDelete } from '../services/activityLogger.service';

const prisma = new PrismaClient();

// Password complexity validation
const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
};

export const getAllBranchUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const branchCode = req.query.branch_code as string;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search } }
      ];
    }

    if (branchCode) {
      where.branch_code = branchCode;
    }

    const [branchUsers, total] = await Promise.all([
      prisma.branch_users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          branch_code: true,
          username: true,
          status: true,
          created_at: true
        }
      }),
      prisma.branch_users.count({ where })
    ]);

    const response = {
      success: true,
      message: 'Branch users retrieved successfully',
      data: branchUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    } as PaginatedResponse<any>;

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createBranchUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { branch_code, username, password, status } = req.body;

    // Validation
    if (!branch_code || !username || !password) {
      throw new AppError('Branch code, username, and password are required', 400);
    }

    // Validate password complexity
    if (!validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number', 400);
    }

    // Validate branch exists
    const branch = await prisma.branches.findUnique({
      where: { branch_code }
    });
    if (!branch) {
      throw new AppError('Branch code does not exist', 404);
    }

    // Check username uniqueness in branch_users table
    const existingBranchUser = await prisma.branch_users.findFirst({
      where: { username }
    });
    if (existingBranchUser) {
      throw new AppError('Username already exists in branch users', 409);
    }

    // Check username uniqueness in admins table
    const existingAdmin = await prisma.admins.findUnique({
      where: { username }
    });
    if (existingAdmin) {
      throw new AppError('Username already exists in admin users', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const branchUser = await prisma.branch_users.create({
      data: {
        branch_code,
        username,
        password: hashedPassword,
        status: status || 'Active'
      },
      select: {
        id: true,
        branch_code: true,
        username: true,
        status: true,
        created_at: true
      }
    });

    // Log branch user creation
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'BRANCH_USER',
      entityId: branchUser.id.toString(),
      entityName: branchUser.username,
      description: `Created new branch user: ${branchUser.username} for branch ${branch_code}`,
      detailsAfter: branchUser,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<typeof branchUser> = {
      success: true,
      message: 'Branch user created successfully',
      data: branchUser
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateBranchUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { branch_code, username, password, status } = req.body;

    const existingBranchUser = await prisma.branch_users.findUnique({
      where: { id }
    });

    if (!existingBranchUser) {
      throw new AppError('Branch user not found', 404);
    }

    // Validate branch exists if changing
    if (branch_code && branch_code !== existingBranchUser.branch_code) {
      const branch = await prisma.branches.findUnique({
        where: { branch_code }
      });
      if (!branch) {
        throw new AppError('Branch code does not exist', 404);
      }
    }

    // Check username uniqueness if changing
    if (username && username !== existingBranchUser.username) {
      const existingUser = await prisma.branch_users.findFirst({
        where: { username }
      });
      if (existingUser) {
        throw new AppError('Username already exists in branch users', 409);
      }

      // Check username uniqueness in admins table
      const existingAdmin = await prisma.admins.findUnique({
        where: { username }
      });
      if (existingAdmin) {
        throw new AppError('Username already exists in admin users', 409);
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (branch_code) updateData.branch_code = branch_code;
    if (username) updateData.username = username;
    if (status) updateData.status = status;
    
    // Handle password update with validation
    if (password) {
      if (!validatePassword(password)) {
        throw new AppError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number', 400);
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const branchUser = await prisma.branch_users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        branch_code: true,
        username: true,
        status: true,
        created_at: true
      }
    });

    // Log branch user update
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'BRANCH_USER',
      entityId: branchUser.id.toString(),
      entityName: branchUser.username,
      description: `Updated branch user: ${branchUser.username}`,
      detailsBefore: existingBranchUser,
      detailsAfter: branchUser,
      changes: Object.keys(updateData),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<typeof branchUser> = {
      success: true,
      message: 'Branch user updated successfully',
      data: branchUser
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteBranchUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const branchUser = await prisma.branch_users.findUnique({
      where: { id }
    });

    if (!branchUser) {
      throw new AppError('Branch user not found', 404);
    }

    await prisma.branch_users.delete({ where: { id } });

    // Log branch user deletion
    await logDelete({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'BRANCH_USER',
      entityId: branchUser.id.toString(),
      entityName: branchUser.username,
      description: `Deleted branch user: ${branchUser.username} from branch ${branchUser.branch_code}`,
      detailsBefore: branchUser,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Branch user deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
