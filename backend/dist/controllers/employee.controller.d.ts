import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare const getAllEmployees: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getEmployeeById: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createEmployee: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateEmployee: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteEmployee: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const generateQRCode: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadProfileImage: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const transferEmployee: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const archiveEmployee: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const uploadMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=employee.controller.d.ts.map