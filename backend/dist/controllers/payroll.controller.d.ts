import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare const getAllPayroll: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyPayroll: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPayrollById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const calculatePayroll: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const processPayroll: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updatePayrollStatus: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=payroll.controller.d.ts.map