import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { AuthenticatedRequest as BaseAuthenticatedRequest } from './auth.middleware';

export interface AuthenticatedRequest extends BaseAuthenticatedRequest {
  user?: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string | null;
  };
}

/**
 * Middleware to require Super Admin role
 */
export const requireSuperAdmin = (
  req: BaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.admin) {
      throw new AppError('Authentication required', 401);
    }

    if (req.admin.role !== 'super_admin') {
      throw new AppError('Super Admin access required', 403);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authorization failed', 403));
    }
  }
};

/**
 * Middleware to require Admin role (Super Admin or regular Admin)
 */
export const requireAdmin = (
  req: BaseAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.admin) {
      throw new AppError('Authentication required', 401);
    }

    if (req.admin.role !== 'super_admin' && req.admin.role !== 'admin') {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authorization failed', 403));
    }
  }
};
