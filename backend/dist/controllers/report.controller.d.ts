import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare const getAttendanceReport: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPayrollReport: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getEmployeeSummary: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const exportReport: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=report.controller.d.ts.map