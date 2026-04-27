import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from './error.middleware';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string | null;
    branch_code: string | null;
    permissions?: any;
    permissions_enabled?: boolean;
  };
  token?: string;
}

interface AdminJWTPayload {
  adminId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AdminJWTPayload;

    const admin = await prisma.admins.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        branch_code: true
      }
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    req.admin = admin as any;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    if (!process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AdminJWTPayload;

    const admin = await prisma.admins.findUnique({
      where: { id: decoded.adminId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        branch_code: true
      }
    });

    if (admin) {
      req.admin = admin as any;
    }

    next();
  } catch {
    next();
  }
};
