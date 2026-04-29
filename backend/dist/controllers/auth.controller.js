"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const activityLogger_service_1 = require("../services/activityLogger.service");
const prisma = new client_1.PrismaClient();
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw new error_middleware_1.AppError('Username and password are required', 400);
        }
        // Find admin user
        const admin = await prisma.admins.findUnique({
            where: { username }
        });
        if (!admin) {
            // Log failed login - user not found
            await (0, activityLogger_service_1.logError)({
                userId: 0,
                userName: username,
                userRole: 'unknown',
                actionType: 'LOGIN',
                entityType: 'USER',
                description: `Failed login attempt: Username not found - ${username}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: { reason: 'username_not_found' },
            });
            throw new error_middleware_1.AppError('Username not found', 401);
        }
        // Verify password with bcrypt (database uses bcrypt hashes)
        const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password);
        if (!isPasswordValid) {
            // Log failed login - invalid password
            await (0, activityLogger_service_1.logError)({
                userId: admin.id,
                userName: admin.name,
                userRole: admin.role || 'admin',
                actionType: 'LOGIN',
                entityType: 'USER',
                entityId: admin.id.toString(),
                entityName: admin.name,
                description: `Failed login attempt: Invalid password for user ${username}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: { reason: 'invalid_password' },
            });
            throw new error_middleware_1.AppError('Password does not match', 401);
        }
        if (!process.env.JWT_SECRET) {
            throw new error_middleware_1.AppError('JWT configuration error', 500);
        }
        // Detect if this is a branch user (by username pattern or branch_code)
        const isBranchUser = /^branch-[a-h]$/i.test(admin.username) || (admin.branch_code && !admin.role);
        const userRole = isBranchUser ? 'branch' : (admin.role || 'admin');
        const userType = isBranchUser ? 'branch' : 'admin';
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        const token = jsonwebtoken_1.default.sign({
            adminId: admin.id,
            username: admin.username,
            role: userRole
        }, process.env.JWT_SECRET, { expiresIn });
        const { password: _, ...adminWithoutPassword } = admin;
        // Update the user object with the correct role for branch users
        const userWithCorrectRole = {
            ...adminWithoutPassword,
            role: userRole
        };
        // Log successful login
        await (0, activityLogger_service_1.logAuth)({
            userId: admin.id,
            userName: admin.name,
            userRole: userRole,
            actionType: 'LOGIN',
            entityType: 'USER',
            entityId: admin.id.toString(),
            entityName: admin.name,
            description: `User ${username} logged in successfully`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            status: 'SUCCESS',
            branchId: admin.branch_code ? parseInt(admin.branch_code) : undefined,
        });
        const response = {
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userWithCorrectRole,
                userType
            }
        };
        res.json(response);
    }
    catch (error) {
        // Log unexpected errors
        if (!(error instanceof error_middleware_1.AppError)) {
            await (0, activityLogger_service_1.logError)({
                userId: 0,
                userName: 'unknown',
                userRole: 'unknown',
                actionType: 'LOGIN',
                entityType: 'USER',
                description: `Unexpected error during login: ${error}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
        }
        next(error);
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map