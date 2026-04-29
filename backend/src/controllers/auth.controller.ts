import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ApiResponse } from '../types/api.types';
import { logAuth, logError } from '../services/activityLogger.service';

const prisma = new PrismaClient();

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }

    // Find admin user
    const admin = await prisma.admins.findUnique({
      where: { username }
    });

    if (!admin) {
      // Log failed login - user not found
      await logError({
        userId: 0,
        userName: username,
        userRole: 'unknown',
        actionType: 'LOGIN',
        entityType: 'USER',
        description: `Failed login attempt: Username not found - ${username}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { reason: 'username_not_found' },
      });
      throw new AppError('Username not found', 401);
    }

    // Verify password with bcrypt (database uses bcrypt hashes)
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      // Log failed login - invalid password
      await logError({
        userId: admin.id,
        userName: admin.name,
        userRole: admin.role || 'admin',
        actionType: 'LOGIN',
        entityType: 'USER',
        entityId: admin.id.toString(),
        entityName: admin.name,
        description: `Failed login attempt: Invalid password for user ${username}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { reason: 'invalid_password' },
      });
      throw new AppError('Password does not match', 401);
    }

    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT configuration error', 500);
    }

    // Detect if this is a branch user (by username pattern or branch_code)
    const isBranchUser = /^branch-[a-h]$/i.test(admin.username) || (admin.branch_code && !admin.role);
    const userRole = isBranchUser ? 'branch' : (admin.role || 'admin');
    const userType = isBranchUser ? 'branch' : 'admin';

    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      {
        adminId: admin.id,
        username: admin.username,
        role: userRole
      },
      process.env.JWT_SECRET,
      { expiresIn } as jwt.SignOptions
    );

    const { password: _, ...adminWithoutPassword } = admin;

    // Update the user object with the correct role for branch users
    const userWithCorrectRole = {
      ...adminWithoutPassword,
      role: userRole
    };

    // Log successful login
    await logAuth({
      userId: admin.id,
      userName: admin.name,
      userRole: userRole,
      actionType: 'LOGIN',
      entityType: 'USER',
      entityId: admin.id.toString(),
      entityName: admin.name,
      description: `User ${username} logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'SUCCESS',
      branchId: admin.branch_code ? parseInt(admin.branch_code) : undefined,
    });

    const response: ApiResponse<{
      token: string;
      user: any;
      userType: 'admin' | 'branch';
    }> = {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userWithCorrectRole as any,
        userType
      }
    };

    res.json(response);
  } catch (error) {
    // Log unexpected errors
    if (!(error instanceof AppError)) {
      await logError({
        userId: 0,
        userName: 'unknown',
        userRole: 'unknown',
        actionType: 'LOGIN',
        entityType: 'USER',
        description: `Unexpected error during login: ${error}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    next(error);
  }
};
