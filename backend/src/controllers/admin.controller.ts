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

export const getAllAdmins = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.admins.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
          branch_code: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.admins.count({ where })
    ]);

    const response = {
      success: true,
      message: 'Admins retrieved successfully',
      data: admins,
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

export const createAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password, name, email, role, branch_code } = req.body;

    // Validation
    if (!username || !password || !name || !email || !role) {
      throw new AppError('Username, password, name, email, and role are required', 400);
    }

    // Validate password complexity
    if (!validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number', 400);
    }

    // Validate role
    if (!['admin', 'super_admin'].includes(role)) {
      throw new AppError('Role must be either admin or super_admin', 400);
    }

    // Check username uniqueness
    const existingUsername = await prisma.admins.findUnique({
      where: { username }
    });
    if (existingUsername) {
      throw new AppError('Username already exists', 409);
    }

    // Check email uniqueness
    const existingEmail = await prisma.admins.findUnique({
      where: { email }
    });
    if (existingEmail) {
      throw new AppError('Email already exists', 409);
    }

    // Check username uniqueness in branch_users table
    const existingBranchUser = await prisma.branch_users.findFirst({
      where: { username }
    });
    if (existingBranchUser) {
      throw new AppError('Username already exists in branch users', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.admins.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role,
        branch_code
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        branch_code: true,
        created_at: true,
        updated_at: true
      }
    });

    // Log admin creation
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ADMIN',
      entityId: admin.id.toString(),
      entityName: admin.name,
      description: `Created new admin: ${admin.username} - ${admin.name}`,
      detailsAfter: admin,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<typeof admin> = {
      success: true,
      message: 'Admin created successfully',
      data: admin
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { username, password, name, email, role, branch_code } = req.body;

    const existingAdmin = await prisma.admins.findUnique({
      where: { id }
    });

    if (!existingAdmin) {
      throw new AppError('Admin not found', 404);
    }

    // Validate role if provided
    if (role && !['admin', 'super_admin'].includes(role)) {
      throw new AppError('Role must be either admin or super_admin', 400);
    }

    // Check username uniqueness if changing
    if (username && username !== existingAdmin.username) {
      const existingUsername = await prisma.admins.findUnique({
        where: { username }
      });
      if (existingUsername) {
        throw new AppError('Username already exists', 409);
      }

      // Check username uniqueness in branch_users table
      const existingBranchUser = await prisma.branch_users.findFirst({
        where: { username }
      });
      if (existingBranchUser) {
        throw new AppError('Username already exists in branch users', 409);
      }
    }

    // Check email uniqueness if changing
    if (email && email !== existingAdmin.email) {
      const existingEmail = await prisma.admins.findUnique({
        where: { email }
      });
      if (existingEmail) {
        throw new AppError('Email already exists', 409);
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (branch_code !== undefined) updateData.branch_code = branch_code;
    
    // Handle password update with validation
    if (password) {
      if (!validatePassword(password)) {
        throw new AppError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number', 400);
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const admin = await prisma.admins.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        branch_code: true,
        created_at: true,
        updated_at: true
      }
    });

    // Log admin update
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ADMIN',
      entityId: admin.id.toString(),
      entityName: admin.name,
      description: `Updated admin: ${admin.username} - ${admin.name}`,
      detailsBefore: existingAdmin,
      detailsAfter: admin,
      changes: Object.keys(updateData),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<typeof admin> = {
      success: true,
      message: 'Admin updated successfully',
      data: admin
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const admin = await prisma.admins.findUnique({
      where: { id }
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    await prisma.admins.delete({ where: { id } });

    // Log admin deletion
    await logDelete({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ADMIN',
      entityId: admin.id.toString(),
      entityName: admin.name,
      description: `Deleted admin: ${admin.username} - ${admin.name}`,
      detailsBefore: admin,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Admin deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
