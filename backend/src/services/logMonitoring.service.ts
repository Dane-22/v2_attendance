/**
 * Log Monitoring Service
 * Monitors logs for critical events and triggers notifications
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Critical event patterns to monitor
const CRITICAL_PATTERNS = {
  FAILED_LOGIN: {
    actionType: 'LOGIN',
    status: 'FAILED',
    threshold: 5, // Number of failed attempts within time window
    timeWindowMinutes: 15,
  },
  SUSPICIOUS_ACTIVITY: {
    actionTypes: ['DELETE', 'UPDATE'],
    entityTypes: ['PAYROLL', 'SETTINGS'],
    threshold: 3, // Number of sensitive actions within time window
    timeWindowMinutes: 60,
  },
  HIGH_VOLUME: {
    threshold: 1000, // Logs per minute
  },
};

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: any;
  timestamp: Date;
}

/**
 * Monitor for failed login attempts
 */
async function monitorFailedLogins(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const timeWindow = new Date(Date.now() - CRITICAL_PATTERNS.FAILED_LOGIN.timeWindowMinutes * 60 * 1000);

  const failedLogins = await prisma.activityLog.findMany({
    where: {
      actionType: 'LOGIN' as any,
      status: 'FAILED' as any,
      timestamp: {
        gte: timeWindow,
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  // Group by user to detect repeated failures
  const failuresByUser = new Map<number, number>();
  failedLogins.forEach(log => {
    const count = failuresByUser.get(log.userId) || 0;
    failuresByUser.set(log.userId, count + 1);
  });

  // Generate alerts for users exceeding threshold
  for (const [userId, count] of failuresByUser) {
    if (count >= CRITICAL_PATTERNS.FAILED_LOGIN.threshold) {
      const userLogs = failedLogins.filter(log => log.userId === userId);
      const lastLog = userLogs[0];
      
      alerts.push({
        type: 'FAILED_LOGIN',
        severity: count > 10 ? 'critical' : 'high',
        message: `${count} failed login attempts for user ${lastLog.userName} in the last ${CRITICAL_PATTERNS.FAILED_LOGIN.timeWindowMinutes} minutes`,
        metadata: {
          userId,
          userName: lastLog.userName,
          attemptCount: count,
          lastAttemptAt: lastLog.timestamp,
          ipAddress: lastLog.ipAddress,
        },
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Monitor for suspicious activity on sensitive entities
 */
async function monitorSuspiciousActivity(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const timeWindow = new Date(Date.now() - CRITICAL_PATTERNS.SUSPICIOUS_ACTIVITY.timeWindowMinutes * 60 * 1000);

  const sensitiveActions = await prisma.activityLog.findMany({
    where: {
      actionType: { in: CRITICAL_PATTERNS.SUSPICIOUS_ACTIVITY.actionTypes as any[] },
      entityType: { in: CRITICAL_PATTERNS.SUSPICIOUS_ACTIVITY.entityTypes as any[] },
      timestamp: {
        gte: timeWindow,
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  // Group by user to detect unusual activity
  const actionsByUser = new Map<number, number>();
  sensitiveActions.forEach(log => {
    const count = actionsByUser.get(log.userId) || 0;
    actionsByUser.set(log.userId, count + 1);
  });

  // Generate alerts for users exceeding threshold
  for (const [userId, count] of actionsByUser) {
    if (count >= CRITICAL_PATTERNS.SUSPICIOUS_ACTIVITY.threshold) {
      const userLogs = sensitiveActions.filter(log => log.userId === userId);
      const lastLog = userLogs[0];
      
      alerts.push({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: count > 5 ? 'high' : 'medium',
        message: `${count} sensitive actions performed by ${lastLog.userName} in the last ${CRITICAL_PATTERNS.SUSPICIOUS_ACTIVITY.timeWindowMinutes} minutes`,
        metadata: {
          userId,
          userName: lastLog.userName,
          actionCount: count,
          actions: userLogs.map(log => ({ actionType: log.actionType, entityType: log.entityType })),
        },
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Monitor for high volume of logs (potential abuse)
 */
async function monitorHighVolume(): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  const recentLogs = await prisma.activityLog.count({
    where: {
      timestamp: {
        gte: oneMinuteAgo,
      },
    },
  });

  if (recentLogs >= CRITICAL_PATTERNS.HIGH_VOLUME.threshold) {
    alerts.push({
      type: 'HIGH_VOLUME',
      severity: 'critical',
      message: `High volume of logs detected: ${recentLogs} logs in the last minute`,
      metadata: {
        logCount: recentLogs,
        threshold: CRITICAL_PATTERNS.HIGH_VOLUME.threshold,
      },
      timestamp: new Date(),
    });
  }

  return alerts;
}

/**
 * Create a notification for an alert
 */
async function createNotification(alert: Alert): Promise<void> {
  try {
    await prisma.notifications.create({
      data: {
        title: `${alert.type}: ${alert.severity.toUpperCase()}`,
        message: alert.message,
        type: alert.severity,
        recipient_type: 'admin',
        recipient_id: 0, // System notification (no specific user)
        is_read: false,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to create notification for alert:', error);
  }
}

/**
 * Main monitoring function - runs all monitors
 */
export async function runLogMonitoring(): Promise<Alert[]> {
  console.log('Starting log monitoring...');
  const startTime = Date.now();

  const [failedLoginAlerts, suspiciousActivityAlerts, highVolumeAlerts] = await Promise.all([
    monitorFailedLogins(),
    monitorSuspiciousActivity(),
    monitorHighVolume(),
  ]);

  const allAlerts = [...failedLoginAlerts, ...suspiciousActivityAlerts, ...highVolumeAlerts];

  // Create notifications for alerts
  for (const alert of allAlerts) {
    await createNotification(alert);
    console.log(`[${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
  }

  const duration = Date.now() - startTime;
  console.log(`Log monitoring completed. Found ${allAlerts.length} alerts. Duration: ${duration}ms`);

  return allAlerts;
}

/**
 * Schedule monitoring to run every 5 minutes
 */
export function scheduleLogMonitoring(): NodeJS.Timeout {
  console.log('Scheduling log monitoring to run every 5 minutes');
  const intervalId = setInterval(runLogMonitoring, 5 * 60 * 1000);
  return intervalId;
}

// Run monitoring immediately if called directly
if (require.main === module) {
  runLogMonitoring()
    .then((alerts) => {
      console.log(`Monitoring completed with ${alerts.length} alerts`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Monitoring failed:', error);
      process.exit(1);
    });
}
