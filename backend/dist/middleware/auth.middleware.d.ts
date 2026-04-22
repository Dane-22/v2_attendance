import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    admin?: {
        id: number;
        username: string;
        name: string;
        email: string;
        role: string | null;
        branch_code: string | null;
    };
    token?: string;
}
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map