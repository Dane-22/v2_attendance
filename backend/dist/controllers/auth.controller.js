"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.changePassword = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const activityLogger_service_1 = require("../services/activityLogger.service");
const tokenBlacklist_service_1 = require("../services/tokenBlacklist.service");
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
        // Detect branch scanner accounts more reliably.
        // Admin/super admin users must stay on the admin experience, but branch-scoped
        // accounts should be routed to the scanner even if they have an explicit "branch" role.
        const normalizedRole = (admin.role || '').toLowerCase();
        const isElevatedAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin';
        const isBranchUser = /^branch-[a-z0-9]+$/i.test(admin.username) ||
            normalizedRole === 'branch' ||
            (!!admin.branch_code && !isElevatedAdmin);
        const userRole = isBranchUser ? 'branch' : (admin.role || 'admin');
        const userType = isBranchUser ? 'branch' : 'admin';
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        const token = jsonwebtoken_1.default.sign({
            adminId: admin.id,
            username: admin.username,
            role: userRole
        }, process.env.JWT_SECRET, { expiresIn });
        const { password: _, ...adminWithoutPassword } = admin;
        // Fetch branch name if this is a branch user
        let branchName = null;
        if (isBranchUser && admin.branch_code) {
            const branch = await prisma.branches.findUnique({
                where: { branch_code: admin.branch_code },
                select: { branch_name: true }
            });
            branchName = branch?.branch_name || null;
        }
        // Update the user object with the correct role and branch name for branch users
        const userWithCorrectRole = {
            ...adminWithoutPassword,
            role: userRole,
            branch_name: branchName,
            permissions: admin.permissions || [],
            permissions_enabled: admin.permissions_enabled || false,
            employeeId: admin.employeeId || null
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
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new error_middleware_1.AppError('All password fields are required', 400);
        }
        if (newPassword !== confirmPassword) {
            throw new error_middleware_1.AppError('New password and confirmation do not match', 400);
        }
        if (newPassword.length < 8) {
            throw new error_middleware_1.AppError('New password must be at least 8 characters long', 400);
        }
        // Get admin user from authenticated request
        if (!req.admin) {
            throw new error_middleware_1.AppError('Authentication required', 401);
        }
        // Find admin user with password
        const admin = await prisma.admins.findUnique({
            where: { id: req.admin.id }
        });
        if (!admin) {
            throw new error_middleware_1.AppError('User not found', 404);
        }
        // Verify current password
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, admin.password);
        if (!isCurrentPasswordValid) {
            await (0, activityLogger_service_1.logError)({
                userId: admin.id,
                userName: admin.name,
                userRole: admin.role || 'admin',
                actionType: 'UPDATE',
                entityType: 'USER',
                entityId: admin.id.toString(),
                entityName: admin.name,
                description: `Failed password change attempt for user ${admin.username}: Invalid current password`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                metadata: { reason: 'invalid_current_password' },
            });
            throw new error_middleware_1.AppError('Current password is incorrect', 400);
        }
        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
        // Update password in database
        await prisma.admins.update({
            where: { id: admin.id },
            data: { password: hashedNewPassword }
        });
        // Log successful password change
        await (0, activityLogger_service_1.logAuth)({
            userId: admin.id,
            userName: admin.name,
            userRole: admin.role || 'admin',
            actionType: 'UPDATE',
            entityType: 'USER',
            entityId: admin.id.toString(),
            entityName: admin.name,
            description: `User ${admin.username} successfully changed password`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            status: 'SUCCESS',
            branchId: admin.branch_code ? parseInt(admin.branch_code) : undefined,
        });
        const response = {
            success: true,
            message: 'Password changed successfully',
            data: null
        };
        res.json(response);
    }
    catch (error) {
        if (!(error instanceof error_middleware_1.AppError)) {
            await (0, activityLogger_service_1.logError)({
                userId: 0,
                userName: 'unknown',
                userRole: 'unknown',
                actionType: 'UPDATE',
                entityType: 'USER',
                description: `Unexpected error during password change: ${error}`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            });
        }
        next(error);
    }
};
exports.changePassword = changePassword;
const logout = async (req, res, next) => {
    try {
        if (!req.admin || !req.token) {
            throw new error_middleware_1.AppError('Authentication required', 401);
        }
        if (!process.env.JWT_SECRET) {
            throw new error_middleware_1.AppError('JWT configuration error', 500);
        }
        const decoded = jsonwebtoken_1.default.verify(req.token, process.env.JWT_SECRET);
        if (!decoded.exp) {
            throw new error_middleware_1.AppError('Invalid token payload', 401);
        }
        (0, tokenBlacklist_service_1.blacklistToken)(req.token, decoded.exp);
        await (0, activityLogger_service_1.logAuth)({
            userId: req.admin.id,
            userName: req.admin.name,
            userRole: req.admin.role || 'admin',
            actionType: 'LOGOUT',
            entityType: 'USER',
            entityId: req.admin.id.toString(),
            entityName: req.admin.name,
            description: `User ${req.admin.username} logged out`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            status: 'SUCCESS',
        });
        const response = {
            success: true,
            message: 'Logout successful',
            data: null
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map