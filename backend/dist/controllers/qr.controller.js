"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmployeeQR = exports.verifyQRCode = exports.decodeQRCode = void 0;
const client_1 = require("@prisma/client");
const error_middleware_1 = require("../middleware/error.middleware");
const qr_service_1 = require("../services/qr.service");
const prisma = new client_1.PrismaClient();
const decodeQRCode = async (req, res, next) => {
    try {
        const { qrData } = req.body;
        if (!qrData) {
            throw new error_middleware_1.AppError('QR data is required', 400);
        }
        const decoded = (0, qr_service_1.decodeQRCodeData)(qrData);
        const employee = await prisma.employee.findUnique({
            where: { employeeCode: decoded.employeeCode },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: true,
                position: true,
                status: true
            }
        });
        const response = {
            success: true,
            message: 'QR code decoded successfully',
            data: {
                decoded,
                employee,
                isValid: employee !== null && employee.status === 'Active'
            }
        };
        res.json(response);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Invalid QR code format') {
            next(new error_middleware_1.AppError('Invalid QR code format', 400));
        }
        else {
            next(error);
        }
    }
};
exports.decodeQRCode = decodeQRCode;
const verifyQRCode = async (req, res, next) => {
    try {
        const { qrData } = req.body;
        if (!qrData) {
            throw new error_middleware_1.AppError('QR data is required', 400);
        }
        let decoded;
        try {
            decoded = (0, qr_service_1.decodeQRCodeData)(qrData);
        }
        catch {
            throw new error_middleware_1.AppError('Invalid QR code format', 400);
        }
        const isValidFormat = (0, qr_service_1.verifyQRCodeData)(qrData, 5);
        const employee = await prisma.employee.findUnique({
            where: { employeeCode: decoded.employeeCode },
            select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: true,
                status: true
            }
        });
        const response = {
            success: true,
            message: 'QR code verified',
            data: {
                isValid: isValidFormat && employee !== null && employee.status === 'Active',
                isExpired: decoded.version === 'V2' && !isValidFormat,
                employeeExists: employee !== null,
                employeeActive: employee?.status === 'Active' || false,
                version: decoded.version
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.verifyQRCode = verifyQRCode;
const generateEmployeeQR = async (req, res, next) => {
    try {
        const employeeId = parseInt(req.params.employeeId);
        const version = req.query.version || 'V2';
        if (!['V1', 'V2'].includes(version)) {
            throw new error_middleware_1.AppError('Invalid QR version. Use V1 or V2', 400);
        }
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });
        if (!employee) {
            throw new error_middleware_1.AppError('Employee not found', 404);
        }
        if (!employee.employeeCode) {
            throw new error_middleware_1.AppError('Employee has no employee code', 400);
        }
        const qrCodeData = (0, qr_service_1.generateQRCodeData)(employee.employeeCode, version);
        // Note: QR code data is generated but not stored in database
        // as qrCodeData/qrVersion fields don't exist in the current schema
        const response = {
            success: true,
            message: `QR code generated successfully (Version ${version})`,
            data: {
                employeeId,
                employeeCode: employee.employeeCode,
                qrCodeData,
                version
            }
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
};
exports.generateEmployeeQR = generateEmployeeQR;
//# sourceMappingURL=qr.controller.js.map