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
            throw new error_middleware_1.AppError('Username not found', 401);
        }
        // Verify password with bcrypt (database uses bcrypt hashes)
        const isPasswordValid = await bcryptjs_1.default.compare(password, admin.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError('Password does not match', 401);
        }
        if (!process.env.JWT_SECRET) {
            throw new error_middleware_1.AppError('JWT configuration error', 500);
        }
        const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
        const token = jsonwebtoken_1.default.sign({
            adminId: admin.id,
            username: admin.username,
            role: admin.role || 'admin'
        }, process.env.JWT_SECRET, { expiresIn });
        const { password: _, ...adminWithoutPassword } = admin;
        const response = {
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: adminWithoutPassword
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
//# sourceMappingURL=auth.controller.js.map