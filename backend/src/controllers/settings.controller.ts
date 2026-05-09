import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logAction } from '../services/activityLogger.service';

const prisma = new PrismaClient();

export const getSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await prisma.settings.findFirst();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      companyName,
      address,
      phone,
      email,
      website,
      taxId,
      workStartTime,
      workEndTime,
      gracePeriod,
      overtimeThreshold,
      payPeriod,
      payDay,
      defaultDailyRate,
      overtimeMultiplier,
      holidayMultiplier,
      emailNotifications,
      pushNotifications,
      attendanceAlerts,
      payrollAlerts,
      systemUpdates,
      lowBalanceAlerts,
      twoFactorAuth,
      passwordExpiryDays,
      sessionTimeout,
      loginAttempts,
      requireStrongPasswords,
      timezone,
      dateFormat,
      currency,
      language,
      autoLogout,
      dataRetention
    } = req.body;

    if (!req.admin) {
      throw new Error('Authentication required');
    }

    const existingSettings = await prisma.settings.findFirst();
    const oldSettings = existingSettings ? { ...existingSettings } : null;

    let settings;
    if (existingSettings) {
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          companyName,
          address,
          phone,
          email,
          website,
          taxId,
          workStartTime,
          workEndTime,
          gracePeriod,
          overtimeThreshold,
          payPeriod,
          payDay,
          defaultDailyRate,
          overtimeMultiplier,
          holidayMultiplier,
          emailNotifications,
          pushNotifications,
          attendanceAlerts,
          payrollAlerts,
          systemUpdates,
          lowBalanceAlerts,
          twoFactorAuth,
          passwordExpiryDays,
          sessionTimeout,
          loginAttempts,
          requireStrongPasswords,
          timezone,
          dateFormat,
          currency,
          language,
          autoLogout,
          dataRetention
        }
      });
    } else {
      settings = await prisma.settings.create({
        data: {
          companyName,
          address,
          phone,
          email,
          website,
          taxId,
          workStartTime,
          workEndTime,
          gracePeriod,
          overtimeThreshold,
          payPeriod,
          payDay,
          defaultDailyRate,
          overtimeMultiplier,
          holidayMultiplier,
          emailNotifications,
          pushNotifications,
          attendanceAlerts,
          payrollAlerts,
          systemUpdates,
          lowBalanceAlerts,
          twoFactorAuth,
          passwordExpiryDays,
          sessionTimeout,
          loginAttempts,
          requireStrongPasswords,
          timezone,
          dateFormat,
          currency,
          language,
          autoLogout,
          dataRetention
        }
      });
    }

    await logAction({
      userId: req.admin.id,
      userName: req.admin.name,
      userRole: req.admin.role || 'admin',
      actionType: 'UPDATE',
      entityType: 'SETTINGS',
      entityId: settings.id.toString(),
      entityName: 'System Settings',
      description: `Updated system settings`,
      detailsBefore: oldSettings,
      detailsAfter: settings,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'SUCCESS',
      branchId: req.admin.branch_code ? parseInt(req.admin.branch_code) : undefined
    });

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
