import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare const decodeQRCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const verifyQRCode: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const generateEmployeeQR: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=qr.controller.d.ts.map