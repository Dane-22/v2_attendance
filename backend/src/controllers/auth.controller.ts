import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { ApiResponse } from '../types/api.types';

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
      throw new AppError('Username not found', 401);
    }

    // Verify password with bcrypt (database uses bcrypt hashes)
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new AppError('Password does not match', 401);
    }

    if (!process.env.JWT_SECRET) {
      throw new AppError('JWT configuration error', 500);
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username,
        role: admin.role || 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn } as jwt.SignOptions
    );

    const { password: _, ...adminWithoutPassword } = admin;

    const response: ApiResponse<{
      token: string;
      user: Omit<typeof admin, 'password'>;
    }> = {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: adminWithoutPassword
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
