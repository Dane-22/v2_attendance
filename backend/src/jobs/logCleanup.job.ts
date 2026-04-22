/**
 * Log Cleanup Job
 * Runs periodically to delete old logs based on retention policy
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Data retention configuration from environment variables
const RETENTION_DAYS: Record<string, number> = {
  LOGIN: parseInt(process.env.LOG_RETENTION_LOGIN_DAYS || '365'),
  EMPLOYEE: parseInt(process.env.LOG_RETENTION_EMPLOYEE_DAYS || '180'),
  ATTENDANCE: parseInt(process.env.LOG_RETENTION_ATTENDANCE_DAYS || '90'),
  PAYROLL: parseInt(process.env.LOG_RETENTION_PAYROLL_DAYS || '365'),
  DEFAULT: parseInt(process.env.LOG_RETENTION_DEFAULT_DAYS || '90'),
};

/**
 * Calculate cutoff date for a given action type
 */
function getCutoffDate(actionType: string): Date {
  const days = RETENTION_DAYS[actionType] || RETENTION_DAYS.DEFAULT;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return cutoffDate;
}

/**
 * Clean up logs older than retention period for a specific action type
 */
async function cleanupLogsByActionType(actionType: string): Promise<number> {
  const cutoffDate = getCutoffDate(actionType);

  const result = await prisma.activityLog.deleteMany({
    where: {
      actionType: actionType as any,
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Main cleanup function - runs for all action types
 */
export async function runLogCleanup(): Promise<void> {
  console.log('Starting log cleanup job...');
  const startTime = Date.now();

  const actionTypes = ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'SCAN', 'APPROVE', 'REJECT', 'VIEW', 'EXPORT', 'LOGOUT'];
  let totalDeleted = 0;

  for (const actionType of actionTypes) {
    try {
      const deleted = await cleanupLogsByActionType(actionType);
      totalDeleted += deleted;
      
      if (deleted > 0) {
        console.log(`Deleted ${deleted} ${actionType} logs older than ${RETENTION_DAYS[actionType] || RETENTION_DAYS.DEFAULT} days`);
      }
    } catch (error) {
      console.error(`Error cleaning up ${actionType} logs:`, error);
    }
  }

  // Also clean up any logs without specific retention (use default)
  try {
    const defaultCutoff = getCutoffDate('DEFAULT');
    const defaultDeleted = await prisma.activityLog.deleteMany({
      where: {
        timestamp: {
          lt: defaultCutoff,
        },
      },
    });
    totalDeleted += defaultDeleted.count;
    
    if (defaultDeleted.count > 0) {
      console.log(`Deleted ${defaultDeleted.count} logs using default retention`);
    }
  } catch (error) {
    console.error('Error cleaning up default logs:', error);
  }

  const duration = Date.now() - startTime;
  console.log(`Log cleanup job completed. Total deleted: ${totalDeleted} logs. Duration: ${duration}ms`);
}

/**
 * Schedule cleanup job to run daily at midnight
 */
export function scheduleLogCleanup(): NodeJS.Timeout {
  // Calculate time until next midnight
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight
  const msUntilMidnight = midnight.getTime() - now.getTime();

  console.log(`Scheduling log cleanup job to run at midnight (${midnight.toISOString()})`);

  // Initial delay until midnight
  const initialTimeout = setTimeout(() => {
    runLogCleanup();
    // Then run every 24 hours
    const intervalId = setInterval(runLogCleanup, 24 * 60 * 60 * 1000);
    console.log('Log cleanup job scheduled to run every 24 hours');
  }, msUntilMidnight);

  return initialTimeout;
}

// Run cleanup job immediately if called directly
if (require.main === module) {
  runLogCleanup()
    .then(() => {
      console.log('Log cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Log cleanup failed:', error);
      process.exit(1);
    });
}
