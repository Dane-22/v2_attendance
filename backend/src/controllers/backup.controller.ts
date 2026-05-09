import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { backupService } from '../services/backup.service';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();

const serializeBigInt = (value: unknown): unknown => {
  return typeof value === 'bigint' ? Number(value) : value;
};

const serializeBackupRecord = (record: any) => {
  if (!record) return record;
  return {
    ...record,
    size: serializeBigInt(record.size)
  };
};

export class BackupController {
  // Create database backup
  async createDatabaseBackup(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description, sendEmail } = req.body;
      const userId = (req as any).user?.id || 1;

      const backup = await backupService.createDatabaseBackup({
        description,
        userId,
        sendEmail: sendEmail || false
      });

      // Convert BigInt to number for JSON serialization
      const serializedBackup = {
        ...backup,
        size: Number(backup.size)
      };

      res.json({
        success: true,
        message: 'Database backup created successfully',
        data: serializedBackup
      });
    } catch (error) {
      console.error('Database backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create database backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create files backup
  async createFilesBackup(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description, sendEmail } = req.body;
      const userId = (req as any).user?.id || 1;

      const backup = await backupService.createFilesBackup({
        description,
        userId,
        sendEmail: sendEmail || false
      });

      res.json({
        success: true,
        message: 'Files backup created successfully',
        data: backup
      });
    } catch (error) {
      console.error('Files backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create files backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create full system backup
  async createFullBackup(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description, sendEmail } = req.body;
      const userId = (req as any).user?.id || 1;

      const backup = await backupService.createFullBackup({
        description,
        userId,
        sendEmail: sendEmail || false
      });

      res.json({
        success: true,
        message: 'Full system backup created successfully',
        data: backup
      });
    } catch (error) {
      console.error('Full backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create full system backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // List all backups
  async listBackups(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, type, status } = req.query;
      
      const backups = await prisma.backupRecord.findMany({
        where: {
          ...(type && { type: type as any }),
          ...(status && { status: status as any })
        },
        orderBy: { created_at: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      const serializedBackups = backups.map(serializeBackupRecord);

      const total = await prisma.backupRecord.count({
        where: {
          ...(type && { type: type as any }),
          ...(status && { status: status as any })
        }
      });

      res.json({
        success: true,
        data: {
          backups: serializedBackups,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('List backups error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list backups',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Download backup
  async downloadBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const backup = await prisma.backupRecord.findUnique({
        where: { id: Number(id) }
      });

      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'Backup not found'
        });
      }

      // Increment download count
      await prisma.backupRecord.update({
        where: { id: Number(id) },
        data: {
          download_count: { increment: 1 },
          last_downloaded: new Date()
        }
      });

      const filePath = await backupService.getBackupFilePath(backup.filename);
      
      res.download(filePath, backup.filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).json({
            success: false,
            message: 'Failed to download backup'
          });
        }
      });
    } catch (error) {
      console.error('Download backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Restore from backup
  async restoreBackup(req: Request, res: Response) {
    try {
      const { backupId, confirmPassword } = req.body;
      
      if (!confirmPassword || confirmPassword !== 'RESTORE_CONFIRMED') {
        return res.status(400).json({
          success: false,
          message: 'Restore confirmation required'
        });
      }

      const result = await backupService.restoreFromBackup(backupId);

      res.json({
        success: true,
        message: 'Backup restore completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Restore backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Delete backup
  async deleteBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const backup = await prisma.backupRecord.findUnique({
        where: { id: Number(id) }
      });

      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'Backup not found'
        });
      }

      await backupService.deleteBackup(backup.filename);
      
      await prisma.backupRecord.delete({
        where: { id: Number(id) }
      });

      res.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } catch (error) {
      console.error('Delete backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Schedule backup
  async scheduleBackup(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        type, 
        schedule, 
        enabled, 
        retentionDays,
        emailDelivery,
        cloudStorage 
      } = req.body;

      const userId = (req as any).user?.id || 1;

      const result = await backupService.scheduleBackup({
        type,
        schedule,
        enabled,
        retentionDays,
        emailDelivery,
        cloudStorage,
        userId
      });

      res.json({
        success: true,
        message: 'Backup schedule updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Schedule backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule backup',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Upload to cloud storage
  async uploadToCloud(req: Request, res: Response) {
    try {
      const { backupId, provider, config } = req.body;
      
      const result = await backupService.uploadToCloud(backupId, provider, config);

      res.json({
        success: true,
        message: 'Backup uploaded to cloud successfully',
        data: result
      });
    } catch (error) {
      console.error('Cloud upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload to cloud',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Send backup via email
  async emailBackup(req: Request, res: Response) {
    try {
      const { backupId, recipients, subject, message } = req.body;
      
      const result = await backupService.emailBackup(backupId, recipients, subject, message);

      res.json({
        success: true,
        message: 'Backup sent via email successfully',
        data: result
      });
    } catch (error) {
      console.error('Email backup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send backup via email',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get backup statistics
  async getBackupStats(req: Request, res: Response) {
    try {
      const stats = await backupService.getBackupStats();

      // Convert BigInt to Number for JSON serialization
      const serializedStats = {
        ...stats,
        totalSize: Number(stats.totalSize),
        lastBackup: stats.lastBackup ? serializeBackupRecord(stats.lastBackup) : null
      };

      res.json({
        success: true,
        data: serializedStats
      });
    } catch (error) {
      console.error('Backup stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get backup statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const backupController = new BackupController();
