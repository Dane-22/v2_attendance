import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare const getBranches: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getBranchEmployees: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=branch.controller.d.ts.map