"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = exports.transferEmployee = exports.uploadProfileImage = exports.generateQRCode = exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getAllEmployees = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const activityLogger_service_1 = require("../services/activityLogger.service");
const changeDetector_1 = require("../utils/changeDetector");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
// Configure multer for profile image uploads
const uploadDir = path_1.default.join(process.cwd(), 'public', 'uploads', 'profile-images');
// Ensure upload directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const employeeId = req.params.id;
        const timestamp = Date.now();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${employeeId}_${timestamp}${ext}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'));
        }
    }
});
const getAllEmployees = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search;
        const department = req.query.department;
        const isActive = req.query.isActive === 'true' ? true :
            req.query.isActive === 'false' ? false : undefined;
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { employeeCode: { contains: search } },
                { email: { contains: search } }
            ];
        }
        if (department)
            where.department = department;
        if (isActive !== undefined)
            where.status = isActive ? 'Active' : 'Inactive';
        const [employees, total] = await Promise.all([
            prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    employeeCode: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    email: true,
                    department: true,
                    position: true,
                    branchName: true,
                    branchCode: true,
                    status: true,
                    dailyRate: true,
                    hasDeductions: true,
                    performanceAllowance: true,
                    hasDeduction: true,
                    branchId: true,
                    defaultBranchId: true,
                    profileImage: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.employee.count({ where })
        ]);
        const response = {
            success: true,
            message: 'Employees retrieved successfully',
            data: employees,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllEmployees = getAllEmployees;
const getEmployeeById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const employee = await prisma.employee.findUnique({
            where: { id },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
                position: true,
                status: true,
                dailyRate: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        const response = {
            success: true,
            message: 'Employee retrieved successfully',
            data: employee
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.getEmployeeById = getEmployeeById;
const createEmployee = async (req, res, next) => {
    try {
        const data = req.body;
        if (!data.employeeCode || !data.firstName || !data.lastName) {
            throw new error_middleware_1.AppError('Employee code, first name, and last name are required', 400);
        }
        const existingEmployee = await prisma.employee.findUnique({
            where: { employeeCode: data.employeeCode }
        });
        if (existingEmployee) {
            throw new error_middleware_1.AppError('Employee code already exists', 409);
        }
        if (data.email) {
            const existingEmail = await prisma.employee.findUnique({
                where: { email: data.email }
            });
            if (existingEmail) {
                throw new error_middleware_1.AppError('Email already exists', 409);
            }
        }
        const employee = await prisma.employee.create({
            data: {
                employeeCode: data.employeeCode,
                firstName: data.firstName,
                lastName: data.lastName,
                middleName: data.middleName,
                email: data.email,
                department: data.department,
                position: data.position,
                branchName: data.branchName,
                branchCode: data.branchCode,
                dailyRate: data.dailyRate,
                performanceAllowance: data.performanceAllowance,
                hasDeductions: data.hasDeductions,
                hasDeduction: data.hasDeduction,
                status: 'Active'
            },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                department: true,
                position: true,
                branchName: true,
                branchCode: true,
                status: true,
                dailyRate: true,
                hasDeductions: true,
                performanceAllowance: true,
                hasDeduction: true,
                branchId: true,
                profileImage: true,
                createdAt: true,
                updatedAt: true
            }
        });
        // Log employee creation
        await (0, activityLogger_service_1.logCreate)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Created new employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
            detailsAfter: employee,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
        });
        const response = {
            success: true,
            message: 'Employee created successfully',
            data: employee
        };
        res.status(201).json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.createEmployee = createEmployee;
const updateEmployee = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const data = req.body;
        const existingEmployee = await prisma.employee.findUnique({
            where: { id }
        });
        if (!existingEmployee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        if (data.email && data.email !== existingEmployee.email) {
            const emailExists = await prisma.employee.findUnique({
                where: { email: data.email }
            });
            if (emailExists) {
                throw new error_middleware_1.AppError('Email already exists', 409);
            }
        }
        // Detect changes
        const changes = (0, changeDetector_1.detectChanges)(existingEmployee, data, 'EMPLOYEE');
        const employee = await prisma.employee.update({
            where: { id },
            data,
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                department: true,
                position: true,
                branchName: true,
                branchCode: true,
                status: true,
                dailyRate: true,
                hasDeductions: true,
                performanceAllowance: true,
                hasDeduction: true,
                branchId: true,
                profileImage: true,
                createdAt: true,
                updatedAt: true
            }
        });
        // Log employee update
        await (0, activityLogger_service_1.logUpdate)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Updated employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
            detailsBefore: existingEmployee,
            detailsAfter: employee,
            changes: changes,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
        });
        const response = {
            success: true,
            message: 'Employee updated successfully',
            data: employee
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.updateEmployee = updateEmployee;
const deleteEmployee = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const employee = await prisma.employee.findUnique({
            where: { id }
        });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        await prisma.employee.delete({ where: { id } });
        // Log employee deletion
        await (0, activityLogger_service_1.logDelete)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Deleted employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
            detailsBefore: employee,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
        });
        const response = {
            success: true,
            message: 'Employee deleted successfully'
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteEmployee = deleteEmployee;
const generateQRCode = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const employee = await prisma.employee.findUnique({
            where: { id }
        });
        if (!employee || !employee.employeeCode) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        // Generate QR code data (employee code only - V1 format)
        const qrData = `https://jajr.com/attendance/${employee.employeeCode}`;
        // Log QR code generation
        await (0, activityLogger_service_1.logCreate)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Generated QR code for employee: ${employee.employeeCode}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
            metadata: { qrData },
        });
        const response = {
            success: true,
            message: 'QR code data generated',
            data: {
                employeeId: employee.id,
                employeeCode: employee.employeeCode,
                qrData
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.generateQRCode = generateQRCode;
const uploadProfileImage = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const employee = await prisma.employee.findUnique({
            where: { id }
        });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        if (!req.file) {
            throw new error_middleware_1.AppError('No file uploaded', 400);
        }
        // Generate the image URL path
        const imagePath = `/uploads/profile-images/${req.file.filename}`;
        // Update employee with new profile image
        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: { profileImage: imagePath },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                department: true,
                position: true,
                branchName: true,
                branchCode: true,
                status: true,
                dailyRate: true,
                hasDeductions: true,
                performanceAllowance: true,
                hasDeduction: true,
                branchId: true,
                profileImage: true,
                createdAt: true,
                updatedAt: true
            }
        });
        // Log profile image update
        await (0, activityLogger_service_1.logUpdate)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Updated profile image for employee: ${employee.employeeCode}`,
            detailsBefore: { profileImage: employee.profileImage },
            detailsAfter: { profileImage: imagePath },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
        });
        const response = {
            success: true,
            message: 'Profile image uploaded successfully',
            data: updatedEmployee
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.uploadProfileImage = uploadProfileImage;
const transferEmployee = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { branchCode, reason } = req.body;
        if (!branchCode) {
            throw new error_middleware_1.AppError('Branch code is required', 400);
        }
        const employee = await prisma.employee.findUnique({
            where: { id }
        });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        // Check if employee is already in the destination branch
        if (employee.branchCode === branchCode) {
            throw new error_middleware_1.AppError('Employee is already in this branch', 400);
        }
        // Check if destination branch exists
        const destinationBranch = await prisma.branches.findUnique({
            where: { branch_code: branchCode }
        });
        if (!destinationBranch) {
            throw new error_middleware_1.AppError('Destination branch not found', 404);
        }
        // Check if employee has active clock-in (timeIn but no timeOut)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const activeAttendance = await prisma.attendance.findFirst({
            where: {
                employeeId: id,
                date: {
                    gte: today,
                    lt: tomorrow
                },
                check_in: { not: null },
                check_out: null
            }
        });
        if (activeAttendance) {
            throw new error_middleware_1.AppError('Cannot transfer employee with active clock-in. Please clock out first.', 400);
        }
        const previousBranch = employee.branchCode;
        // Update employee branch
        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: {
                branchCode,
                branchName: destinationBranch.branch_name,
                branchId: destinationBranch.id
            },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
                department: true,
                position: true,
                branchName: true,
                branchCode: true,
                status: true,
                dailyRate: true,
                hasDeductions: true,
                performanceAllowance: true,
                hasDeduction: true,
                branchId: true,
                profileImage: true,
                createdAt: true,
                updatedAt: true
            }
        });
        // Log employee transfer
        await (0, activityLogger_service_1.logUpdate)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Transferred employee ${employee.employeeCode} - ${employee.firstName} ${employee.lastName} from ${previousBranch} to ${branchCode}${reason ? ` (Reason: ${reason})` : ''}`,
            detailsBefore: { branchCode: previousBranch, branchName: employee.branchName },
            detailsAfter: { branchCode, branchName: destinationBranch.branch_name },
            changes: ['branchCode', 'branchName'],
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
            metadata: { previousBranch, newBranch: branchCode, reason }
        });
        const response = {
            success: true,
            message: 'Employee transferred successfully',
            data: {
                employee: updatedEmployee,
                previousBranch
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.transferEmployee = transferEmployee;
// Export upload middleware for use in routes
exports.uploadMiddleware = upload.single('profileImage');
//# sourceMappingURL=employee.controller.js.map