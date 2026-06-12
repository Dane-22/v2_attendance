"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.faceCaptureUploadMiddleware = exports.uploadMiddleware = exports.uploadFaceCapture = exports.archiveEmployee = exports.transferEmployee = exports.uploadProfileImage = exports.generateQRCode = exports.deleteEmployee = exports.updateEmployee = exports.createEmployee = exports.getEmployeeById = exports.getAllEmployees = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const activityLogger_service_1 = require("../services/activityLogger.service");
const changeDetector_1 = require("../utils/changeDetector");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
// Configure multer for profile image uploads
const uploadDir = path_1.default.join(process.cwd(), 'assets', 'profile-images', 'employees');
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
// Configure multer for face capture uploads
const faceCaptureDir = path_1.default.join(process.cwd(), 'assets', 'face-captures', 'employees');
// Ensure face capture upload directory exists
if (!fs_1.default.existsSync(faceCaptureDir)) {
    fs_1.default.mkdirSync(faceCaptureDir, { recursive: true });
}
const faceCaptureStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, faceCaptureDir);
    },
    filename: (req, file, cb) => {
        const employeeId = req.params.id;
        const timestamp = Date.now();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${employeeId}_face_${timestamp}${ext}`);
    }
});
const faceCaptureUpload = (0, multer_1.default)({
    storage: faceCaptureStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed for face capture.'));
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
        if (!data.firstName || !data.lastName) {
            throw new error_middleware_1.AppError('First name and last name are required', 400);
        }
        let employeeCode = data.employeeCode;
        // Auto-generate employeeCode if not provided based on Position
        if (!employeeCode) {
            const position = (data.position || 'Worker').toLowerCase();
            const year = new Date().getFullYear();
            let prefix = '';
            let pattern = '';
            if (position.includes('engineer')) {
                prefix = `ENG-${year}-`;
                pattern = `ENG-${year}-%`;
            }
            else if (position.includes('developer')) {
                prefix = `DEV-${year}-`;
                pattern = `DEV-${year}-%`;
            }
            else if (position.includes('admin')) {
                prefix = `ADMIN-${year}-`;
                pattern = `ADMIN-${year}-%`;
            }
            else {
                // Default to Worker (E####)
                prefix = 'E';
                pattern = 'E%';
            }
            // Find the last employee with this prefix pattern
            const lastEmployee = await prisma.employee.findFirst({
                where: {
                    employeeCode: {
                        startsWith: prefix
                    }
                },
                orderBy: {
                    employeeCode: 'desc'
                }
            });
            let nextNumber = 1;
            if (lastEmployee && lastEmployee.employeeCode) {
                const currentCode = lastEmployee.employeeCode;
                // Extract the numeric part (the last 4 digits)
                const match = currentCode.match(/(\d{4})$/);
                if (match) {
                    nextNumber = parseInt(match[1], 10) + 1;
                }
            }
            // Format with 4-digit padding
            employeeCode = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
            // Safety check: ensure the generated code doesn't exist (in case of gaps)
            let codeExists = true;
            let safetyCounter = 0;
            while (codeExists && safetyCounter < 100) {
                const existing = await prisma.employee.findUnique({
                    where: { employeeCode }
                });
                if (!existing) {
                    codeExists = false;
                }
                else {
                    nextNumber++;
                    employeeCode = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
                    safetyCounter++;
                }
            }
        }
        else {
            // If code is provided manually, check for uniqueness
            const existingEmployee = await prisma.employee.findUnique({
                where: { employeeCode }
            });
            if (existingEmployee) {
                throw new error_middleware_1.AppError('Employee code already exists', 409);
            }
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
                employeeCode: employeeCode,
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
        // Filter out read-only fields that shouldn't be updated
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, hasActualDeductions: _hasActualDeductions, ...updateData } = data;
        const employee = await prisma.employee.update({
            where: { id },
            data: updateData,
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
        const imagePath = `/assets/profile-images/employees/${req.file.filename}`;
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
const archiveEmployee = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { reason } = req.body;
        const employee = await prisma.employee.findUnique({
            where: { id }
        });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        // Copy employee data to archived_employees table
        const archivedEmployee = await prisma.$queryRaw `
      INSERT INTO archived_employees (
        id, employeeCode, firstName, middleName, lastName, email, department,
        position, branchName, branchCode, status, dailyRate, performanceAllowance,
        hasDeductions, branchId, defaultBranchId, profileImage,
        createdAt, updatedAt, archivedAt, archivedBy, archiveReason
      )
      VALUES (
        ${employee.id}, ${employee.employeeCode}, ${employee.firstName}, ${employee.middleName},
        ${employee.lastName}, ${employee.email}, ${employee.department}, ${employee.position},
        ${employee.branchName}, ${employee.branchCode}, 'Inactive', ${employee.dailyRate},
        ${employee.performanceAllowance}, ${employee.hasDeductions},
        ${employee.branchId}, ${employee.defaultBranchId}, ${employee.profileImage},
        ${employee.createdAt}, ${employee.updatedAt}, NOW(),
        ${req.admin?.name || 'unknown'}, ${reason || 'Employee archived'}
      )
    `;
        // Update employee status to Inactive
        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: { status: 'Inactive' },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                status: true
            }
        });
        // Log employee archiving
        await (0, activityLogger_service_1.logUpdate)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Archived employee: ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`,
            detailsBefore: { status: employee.status },
            detailsAfter: { status: 'Inactive' },
            changes: ['status'],
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
            metadata: { reason, archivedBy: req.admin?.name }
        });
        const response = {
            success: true,
            message: 'Employee archived successfully',
            data: updatedEmployee
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.archiveEmployee = archiveEmployee;
const uploadFaceCapture = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { branchCode } = req.body;
        if (!branchCode) {
            throw new error_middleware_1.AppError('branchCode is required', 400);
        }
        const employee = await prisma.employee.findUnique({
            where: { id }
        });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        // Validate branchCode matches employee's branch
        if (employee.branchCode !== branchCode) {
            throw new error_middleware_1.AppError('branchCode does not match employee branch', 400);
        }
        // Branch admin authorization check
        if (req.admin?.role === 'admin' && req.admin?.branch_code !== branchCode) {
            throw new error_middleware_1.AppError('Branch admins can only upload face captures for their own branch', 403);
        }
        if (!req.file) {
            throw new error_middleware_1.AppError('No file uploaded', 400);
        }
        // SHA-256 duplicate detection
        const fileBuffer = fs_1.default.readFileSync(req.file.path);
        const fileHash = crypto_1.default.createHash('sha256').update(fileBuffer).digest('hex');
        // Check if this hash already exists in any face capture file
        const existingFiles = fs_1.default.readdirSync(faceCaptureDir);
        for (const existingFile of existingFiles) {
            const existingFilePath = path_1.default.join(faceCaptureDir, existingFile);
            try {
                const existingBuffer = fs_1.default.readFileSync(existingFilePath);
                const existingHash = crypto_1.default.createHash('sha256').update(existingBuffer).digest('hex');
                if (existingHash === fileHash) {
                    // Delete the newly uploaded file since it's a duplicate
                    fs_1.default.unlinkSync(req.file.path);
                    throw new error_middleware_1.AppError('Duplicate face capture image detected', 409);
                }
            }
            catch (err) {
                // Skip files that can't be read
                continue;
            }
        }
        // Generate the image URL path
        const imagePath = `/assets/face-captures/employees/${req.file.filename}`;
        // Update employee with new face capture image
        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: { faceCaptureImage: imagePath },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                middleName: true,
                lastName: true,
                branchCode: true,
                branchName: true,
                profileImage: true,
                faceCaptureImage: true,
                updatedAt: true
            }
        });
        // Log face capture upload
        await (0, activityLogger_service_1.logUpdate)({
            userId: req.admin?.id || 0,
            userName: req.admin?.name || 'unknown',
            userRole: req.admin?.role || 'admin',
            entityType: 'EMPLOYEE',
            entityId: employee.id.toString(),
            entityName: `${employee.firstName} ${employee.lastName}`,
            description: `Uploaded face capture for employee: ${employee.employeeCode}`,
            detailsBefore: { faceCaptureImage: employee.faceCaptureImage },
            detailsAfter: { faceCaptureImage: imagePath },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            branchId: employee.branchId || undefined,
        });
        const response = {
            success: true,
            message: 'Face capture uploaded successfully',
            data: updatedEmployee
        };
        res.json(response);
    }
    catch (error) {
        // Clean up uploaded file if there was an error
        if (req.file && req.file.path) {
            try {
                fs_1.default.unlinkSync(req.file.path);
            }
            catch (err) {
                // Ignore cleanup errors
            }
        }
        next(error);
    }
};
exports.uploadFaceCapture = uploadFaceCapture;
// Export upload middleware for use in routes
exports.uploadMiddleware = upload.single('profileImage');
exports.faceCaptureUploadMiddleware = faceCaptureUpload.single('faceCapture');
//# sourceMappingURL=employee.controller.js.map