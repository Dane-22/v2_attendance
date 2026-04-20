import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare const clockIn: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const manualClockIn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const clockOut: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const manualClockOut: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAttendanceRecords: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyAttendance: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAttendanceStats: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTodayAttendance: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAttendanceAudit: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=attendance.controller.d.ts.map