"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const error_middleware_1 = require("./error.middleware");
const prisma = new client_1.PrismaClient();
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.AppError('Access denied. No token provided.', 401);
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            throw new error_middleware_1.AppError('JWT secret not configured', 500);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const admin = await prisma.admins.findUnique({
            where: { id: decoded.adminId },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true
            }
        });
        if (!admin) {
            throw new error_middleware_1.AppError('Admin not found', 404);
        }
        req.admin = admin;
        next();
    }
    catch (error) {
        if (error instanceof error_middleware_1.AppError) {
            next(error);
        }
        else {
            next(new error_middleware_1.AppError('Invalid or expired token', 401));
        }
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            return next();
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const admin = await prisma.admins.findUnique({
            where: { id: decoded.adminId },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true
            }
        });
        if (admin) {
            req.admin = admin;
        }
        next();
    }
    catch {
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map