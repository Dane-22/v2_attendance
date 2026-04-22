import { PrismaClient } from '@prisma/client';
import { logBufferService } from './logBuffer.service';
import { checkActionRateLimit } from '../middleware/rateLimiter.middleware';

const prisma = new PrismaClient();

// Sensitive data filtering configuration
const FILTER_SALARY = process.env.LOG_FILTER_SALARY === 'true';
const FILTER_PAYROLL = process.env.LOG_FILTER_PAYROLL === 'true';
const FILTER_CONTACT_DETAILS = process.env.LOG_FILTER_CONTACT_DETAILS === 'true';

interface LogOptions {
  userId: number;
  userName: string;
  userRole: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  description: string;
  detailsBefore?: any;
  detailsAfter?: any;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  metadata?: any;
  branchId?: number;
}

/**
 * Filter sensitive data from log entries
 */
function filterSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const filtered = { ...data };

  // Filter salary-related fields
  if (FILTER_SALARY) {
    const salaryFields = ['daily_rate', 'basic_pay', 'gross_pay', 'net_pay', 'performance_allowance'];
    salaryFields.forEach(field => {
      if (field in filtered) {
        filtered[field] = '[FILTERED]';
      }
    });
  }

  // Filter payroll-related fields
  if (FILTER_PAYROLL) {
    const payrollFields = ['sss_contribution', 'phic_contribution', 'hdmf_contribution', 'cash_advance', 'total_deductions', 'overtime_amount'];
    payrollFields.forEach(field => {
      if (field in filtered) {
        filtered[field] = '[FILTERED]';
      }
    });
  }

  // Filter contact details
  if (FILTER_CONTACT_DETAILS) {
    const contactFields = ['email', 'contact_number', 'phone'];
    contactFields.forEach(field => {
      if (field in filtered && typeof filtered[field] === 'string') {
        const value = filtered[field];
        // Partially redact (show first 2 chars, mask rest)
        filtered[field] = value.length > 2 ? value.substring(0, 2) + '***' : '***';
      }
    });
  }

  return filtered;
}

/**
 * Generate unique log ID
 */
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main logging function
 */
export async function logAction(options: LogOptions): Promise<void> {
  try {
    // Check rate limit
    const rateLimitCheck = await checkActionRateLimit(options.userId, options.actionType);
    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for user ${options.userId}, action ${options.actionType}`);
      return;
    }

    // Filter sensitive data
    const filteredDetailsBefore = options.detailsBefore ? filterSensitiveData(options.detailsBefore) : null;
    const filteredDetailsAfter = options.detailsAfter ? filterSensitiveData(options.detailsAfter) : null;
    const filteredChanges = options.changes ? filterSensitiveData(options.changes) : null;
    const filteredMetadata = options.metadata ? filterSensitiveData(options.metadata) : null;

    // Generate log entry
    const logEntry = {
      id: generateLogId(),
      timestamp: new Date(),
      userId: options.userId,
      userName: options.userName,
      userRole: options.userRole,
      actionType: options.actionType,
      entityType: options.entityType,
      entityId: options.entityId || null,
      entityName: options.entityName || null,
      description: options.description,
      detailsBefore: filteredDetailsBefore,
      detailsAfter: filteredDetailsAfter,
      changes: filteredChanges,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      status: options.status || 'SUCCESS',
      metadata: filteredMetadata,
      branchId: options.branchId || null,
      createdAt: new Date(),
    };

    // Add to buffer (will be flushed to database automatically)
    await logBufferService.addLog(logEntry);
  } catch (error) {
    console.error('Error logging action:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Helper for CREATE actions
 */
export async function logCreate(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'CREATE',
  });
}

/**
 * Helper for UPDATE actions (with change detection)
 */
export async function logUpdate(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'UPDATE',
  });
}

/**
 * Helper for DELETE actions
 */
export async function logDelete(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'DELETE',
  });
}

/**
 * Helper for authentication events
 */
export async function logAuth(options: Omit<LogOptions, 'actionType' | 'entityType'> & { entityType?: string; actionType?: string }): Promise<void> {
  return logAction({
    ...options,
    actionType: options.actionType || 'LOGIN',
    entityType: options.entityType || 'USER',
  });
}

/**
 * Helper for error logging
 */
export async function logError(options: Omit<LogOptions, 'status'>): Promise<void> {
  return logAction({
    ...options,
    status: 'FAILED',
  });
}

/**
 * Helper for SCAN actions (QR code scanning)
 */
export async function logScan(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'SCAN',
  });
}

/**
 * Helper for VIEW actions
 */
export async function logView(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'VIEW',
  });
}

/**
 * Helper for EXPORT actions
 */
export async function logExport(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'EXPORT',
  });
}

/**
 * Helper for APPROVE actions
 */
export async function logApprove(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'APPROVE',
  });
}

/**
 * Helper for REJECT actions
 */
export async function logReject(options: Omit<LogOptions, 'actionType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'REJECT',
  });
}

/**
 * Helper for LOGOUT actions
 */
export async function logLogout(options: Omit<LogOptions, 'actionType' | 'entityType'>): Promise<void> {
  return logAction({
    ...options,
    actionType: 'LOGOUT',
    entityType: 'USER',
  });
}
