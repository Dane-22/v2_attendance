import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse } from '../types/api.types';
import {
  registerFace,
  verifyFace,
  getFaceRegistrationStatus,
  deleteFaceData,
  logFaceRecognition,
  getFaceRecognitionLogs
} from '../services/faceRecognition.service';
import { logView } from '../services/activityLogger.service';

/**
 * Register facial data for an employee (Admin only)
 */
export const registerEmployeeFace = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const { embedding, consentGiven } = req.body;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    if (!embedding || !Array.isArray(embedding)) {
      throw new AppError('Facial embedding is required and must be an array', 400);
    }

    if (typeof consentGiven !== 'boolean') {
      throw new AppError('Consent given flag is required', 400);
    }

    // Check if facial recognition is enabled
    if (process.env.FACIAL_RECOGNITION_ENABLED !== 'true') {
      throw new AppError('Facial recognition is not enabled', 403);
    }

    // Register face
    await registerFace(employeeId, embedding, consentGiven);

    // Log the action
    await logView({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employeeId.toString(),
      entityName: `Employee ${employeeId}`,
      description: `Registered facial recognition data for employee ${employeeId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { employeeId, consentGiven },
    });

    const response: ApiResponse<{
      employeeId: number;
      registered: boolean;
    }> = {
      success: true,
      message: 'Facial data registered successfully',
      data: {
        employeeId,
        registered: true
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify facial data for an employee
 */
export const verifyEmployeeFace = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId, embedding } = req.body;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    if (!embedding || !Array.isArray(embedding)) {
      throw new AppError('Facial embedding is required and must be an array', 400);
    }

    // Check if facial recognition is enabled
    if (process.env.FACIAL_RECOGNITION_ENABLED !== 'true') {
      throw new AppError('Facial recognition is not enabled', 403);
    }

    // Get confidence threshold from env or use default
    const threshold = parseFloat(process.env.FACE_CONFIDENCE_THRESHOLD || '0.7');

    // Verify face
    const result = await verifyFace(employeeId, embedding, threshold);

    // Log the verification attempt
    const branchCode = req.body.branchCode || 'UNKNOWN';
    await logFaceRecognition(
      employeeId,
      branchCode,
      result.match ? 'SUCCESS' : 'FAILED',
      result.confidence,
      req.ip,
      req.headers['user-agent']
    );

    const response: ApiResponse<{
      match: boolean;
      confidence: number;
      distance: number;
      threshold: number;
    }> = {
      success: true,
      message: result.match ? 'Face verified successfully' : 'Face verification failed',
      data: {
        match: result.match,
        confidence: result.confidence,
        distance: result.distance,
        threshold
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get face registration status for an employee
 */
export const getEmployeeFaceStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.employeeId);

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const status = await getFaceRegistrationStatus(employeeId);

    const response: ApiResponse<typeof status> = {
      success: true,
      message: 'Face registration status retrieved',
      data: status
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete facial data for an employee (Admin only)
 */
export const deleteEmployeeFace = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.employeeId);

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    // Delete face data
    await deleteFaceData(employeeId);

    // Log the action
    await logView({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'EMPLOYEE',
      entityId: employeeId.toString(),
      entityName: `Employee ${employeeId}`,
      description: `Deleted facial recognition data for employee ${employeeId}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { employeeId },
    });

    const response: ApiResponse<{
      employeeId: number;
      deleted: boolean;
    }> = {
      success: true,
      message: 'Facial data deleted successfully',
      data: {
        employeeId,
        deleted: true
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get face recognition logs for an employee
 */
export const getFaceLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const limit = parseInt(req.query.limit as string) || 50;

    if (!employeeId) {
      throw new AppError('Employee ID is required', 400);
    }

    const logs = await getFaceRecognitionLogs(employeeId, limit);

    const response: ApiResponse<typeof logs> = {
      success: true,
      message: 'Face recognition logs retrieved',
      data: logs
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
