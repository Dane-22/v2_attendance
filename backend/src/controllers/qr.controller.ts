import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, QRCodeData } from '../types/api.types';
import { decodeQRCodeData, generateQRCodeData, verifyQRCodeData } from '../services/qr.service';

const prisma = new PrismaClient();

export const decodeQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      throw new AppError('QR data is required', 400);
    }

    const decoded = decodeQRCodeData(qrData);

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

    const response: ApiResponse<{
      decoded: QRCodeData;
      employee: typeof employee;
      isValid: boolean;
    }> = {
      success: true,
      message: 'QR code decoded successfully',
      data: {
        decoded,
        employee,
        isValid: employee !== null && employee.status === 'Active'
      }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid QR code format') {
      next(new AppError('Invalid QR code format', 400));
    } else {
      next(error);
    }
  }
};

export const verifyQRCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      throw new AppError('QR data is required', 400);
    }

    let decoded: QRCodeData;
    try {
      decoded = decodeQRCodeData(qrData);
    } catch {
      throw new AppError('Invalid QR code format', 400);
    }

    const isValidFormat = verifyQRCodeData(qrData, 5);

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

    const response: ApiResponse<{
      isValid: boolean;
      isExpired: boolean;
      employeeExists: boolean;
      employeeActive: boolean;
      version: string;
    }> = {
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
  } catch (error) {
    next(error);
  }
};

export const generateEmployeeQR = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const version = (req.query.version as 'V1' | 'V2') || 'V2';

    if (!['V1', 'V2'].includes(version)) {
      throw new AppError('Invalid QR version. Use V1 or V2', 400);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (!employee.employeeCode) {
      throw new AppError('Employee has no employee code', 400);
    }
    const qrCodeData = generateQRCodeData(employee.employeeCode, version);

    // Note: QR code data is generated but not stored in database
    // as qrCodeData/qrVersion fields don't exist in the current schema

    const response: ApiResponse<{
      employeeId: number;
      employeeCode: string | null;
      qrCodeData: string;
      version: string;
    }> = {
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
  } catch (error) {
    next(error);
  }
};
