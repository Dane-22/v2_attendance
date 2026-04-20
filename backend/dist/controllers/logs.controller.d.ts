import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare const getLogs: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createLog: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteLog: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=logs.controller.d.ts.map