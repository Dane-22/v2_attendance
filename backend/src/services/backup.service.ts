import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import AWS from 'aws-sdk';
import { google } from 'googleapis';

const prisma = new PrismaClient();

// Custom execAsync that works with newer Node.js
const execAsync = (command: string, options?: any): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

interface DatabaseConnectionConfig {
  hostname: string;
  port?: string;
  username: string;
  password: string;
  database: string;
}

const parseDatabaseConnection = (databaseUrl: string): DatabaseConnectionConfig => {
  const url = new URL(databaseUrl);

  return {
    hostname: url.hostname,
    port: url.port || undefined,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\/+/, '')
  };
};

// Helper function to run mysqldump using spawn (more reliable on Windows)
const runMysqldump = async (args: string[], outputFile: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const mysqldumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
    const child = spawn(mysqldumpPath, [...args, '-r', outputFile], { shell: false });
    
    let stderr = '';
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`mysqldump failed: ${stderr}`));
      }
    });
    
    child.on('error', reject);
  });
};

// Helper function to run mysql using exec (for restore)
const runMysql = async (args: string[]): Promise<void> => {
  const mysqlPath = process.env.MYSQL_PATH || 'mysql';
  const command = `"${mysqlPath}" ${args.join(' ')}`;
  await execAsync(command);
};

export interface BackupOptions {
  description?: string;
  userId: number;
  sendEmail?: boolean;
}

export interface ScheduleOptions {
  type: 'DATABASE' | 'FILES' | 'FULL';
  schedule: string; // cron expression
  enabled: boolean;
  retentionDays: number;
  emailDelivery: {
    enabled: boolean;
    recipients: string[];
    subject?: string;
  };
  cloudStorage?: {
    enabled: boolean;
    provider: 'AWS_S3' | 'GOOGLE_DRIVE' | 'DROPBOX';
    config: any;
  };
  userId: number;
}

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');
  private scheduledJobs: Map<string, any> = new Map();

  constructor() {
    this.ensureBackupDirectory();
    // Initialize schedules from database on startup
    this.initializeSchedules();
  }

  // Load and start all enabled schedules from database
  private async initializeSchedules() {
    try {
      const schedules = await prisma.backupSchedule.findMany({
        where: { enabled: true }
      });

      for (const schedule of schedules) {
        this.startScheduleFromDb(schedule);
      }

      // If no schedules exist, create default daily 11 PM backup
      if (schedules.length === 0) {
        await this.createDefaultSchedule();
      }

      console.log(`✅ Initialized ${schedules.length} backup schedules`);
    } catch (error) {
      console.error('Failed to initialize backup schedules:', error);
    }
  }

  // Create default daily 11 PM backup schedule
  private async createDefaultSchedule() {
    try {
      const defaultRecipients = process.env.DEFAULT_RECIPIENTS || '';
      
      const schedule = await prisma.backupSchedule.create({
        data: {
          type: 'FULL',
          schedule: '0 23 * * *', // Daily at 11:00 PM
          enabled: true,
          retentionDays: 30,
          emailEnabled: true,
          emailRecipients: defaultRecipients,
          emailSubject: 'Daily Backup - JAJR Construction',
          created_by: 1 // System admin
        }
      });

      this.startScheduleFromDb(schedule);
      console.log('✅ Created default daily backup schedule (11:00 PM)');
    } catch (error) {
      console.error('Failed to create default backup schedule:', error);
    }
  }

  // Start a schedule from database record
  private startScheduleFromDb(schedule: any) {
    const jobKey = `schedule_${schedule.id}`;
    
    // Stop existing job if any
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
    }

    if (!schedule.enabled) return;

    const job = cron.schedule(schedule.schedule, async () => {
      try {
        console.log(`[${new Date().toISOString()}] Running scheduled backup: ${schedule.type}`);
        
        let backup;
        const emailRecipients = schedule.emailRecipients?.split(',').filter((r: string) => r.trim()) || [];
        
        switch (schedule.type) {
          case 'DATABASE':
            backup = await this.createDatabaseBackup({
              userId: schedule.created_by,
              description: `Scheduled backup - ${new Date().toISOString()}`,
              sendEmail: schedule.emailEnabled
            });
            break;
          case 'FILES':
            backup = await this.createFilesBackup({
              userId: schedule.created_by,
              description: `Scheduled backup - ${new Date().toISOString()}`,
              sendEmail: schedule.emailEnabled
            });
            break;
          case 'FULL':
            backup = await this.createFullBackup({
              userId: schedule.created_by,
              description: `Scheduled backup - ${new Date().toISOString()}`,
              sendEmail: schedule.emailEnabled
            });
            break;
        }

        // Upload to cloud if configured
        if (schedule.cloudEnabled && schedule.cloudProvider && backup) {
          await this.uploadToCloud(backup.id, schedule.cloudProvider, schedule.cloudConfig || {});
        }

        // Update last run time
        await prisma.backupSchedule.update({
          where: { id: schedule.id },
          data: { 
            last_run_at: new Date(),
            next_run_at: this.calculateNextRun(schedule.schedule)
          }
        });

        // Clean up old backups
        await this.cleanupOldBackup(schedule.retentionDays);

        console.log(`[${new Date().toISOString()}] Scheduled backup completed: ${backup?.filename}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Scheduled backup failed:`, error);
      }
    });

    this.scheduledJobs.set(jobKey, job);
    job.start();
  }

  // Calculate next run time from cron expression
  private calculateNextRun(schedule: string): Date {
    // Simple calculation - assumes daily schedule
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 0, 0, 0);
    return tomorrow;
  }

  private async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  // Create database backup
  async createDatabaseBackup(options: BackupOptions) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_backup_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    try {
      // Get database connection info from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      const connection = parseDatabaseConnection(databaseUrl);
      const dumpArgs = ['-h', connection.hostname];
      if (connection.port) {
        dumpArgs.push('-P', connection.port);
      }
      dumpArgs.push('-u', connection.username);
      if (connection.password) {
        dumpArgs.push(`-p${connection.password}`);
      }
      dumpArgs.push(connection.database);

      try {
        await runMysqldump(dumpArgs, filePath);
      } catch (dumpErr: any) {
        console.error('mysqldump error:', dumpErr.message);
        throw dumpErr;
      }
      
      // Check if file was created
      const fsCheck = await import('fs');
      try {
        await fsCheck.promises.access(filePath);
        console.log('SQL file created successfully');
      } catch {
        throw new Error('mysqldump failed - no output file created');
      }

      // Compress the backup
      const compressedPath = await this.compressFile(filePath, 'gzip');
      
      // Get file size
      const stats = await fs.stat(compressedPath);
      
      // Save backup record to database
      const backupRecord = await this.saveBackupRecord({
        filename: path.basename(compressedPath),
        type: 'DATABASE',
        size: BigInt(stats.size),
        userId: options.userId,
        description: options.description
      });

      // Send email if requested (non-blocking - email failure won't fail backup)
      if (options.sendEmail) {
        try {
          await this.emailBackup(backupRecord.id, [], 'Database Backup Created', 'Your database backup has been created successfully.');
        } catch (emailError) {
          console.warn('Failed to send email notification for database backup:', emailError);
          // Don't fail the backup if email fails
        }
      }

      return backupRecord;
    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(filePath);
      } catch {}
      throw error;
    }
  }

  // Create files backup
  async createFilesBackup(options: BackupOptions) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `files_backup_${timestamp}.tar.gz`;
    const filePath = path.join(this.backupDir, filename);

    try {
      const publicDir = path.join(process.cwd(), 'public');
      await this.createArchive(publicDir, filePath, ['node_modules', '.git', 'logs']);

      const stats = await fs.stat(filePath);
      
      const backupRecord = await this.saveBackupRecord({
        filename,
        type: 'FILES',
        size: BigInt(stats.size),
        userId: options.userId,
        description: options.description
      });

      if (options.sendEmail) {
        try {
          await this.emailBackup(backupRecord.id, [], 'Files Backup Created', 'Your files backup has been created successfully.');
        } catch (emailError) {
          console.warn('Failed to send email notification for files backup:', emailError);
          // Don't fail the backup if email fails
        }
      }

      return backupRecord;
    } catch (error) {
      try {
        await fs.unlink(filePath);
      } catch {}
      throw error;
    }
  }

  // Create full system backup
  async createFullBackup(options: BackupOptions) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `full_backup_${timestamp}.tar.gz`;
    const filePath = path.join(this.backupDir, filename);

    try {
      // Create database backup first
      const dbBackup = await this.createDatabaseBackup({ ...options, sendEmail: false });
      
      // Create files backup
      const filesBackup = await this.createFilesBackup({ ...options, sendEmail: false });
      
      // Create archive containing both backups
      const archive = archiver('tar', { gzip: true });
      const output = require('fs').createWriteStream(filePath);
      
      archive.pipe(output);
      
      // Add backup files to archive
      archive.file(path.join(this.backupDir, dbBackup.filename), { name: 'database.sql.gz' });
      archive.file(path.join(this.backupDir, filesBackup.filename), { name: 'files.tar.gz' });
      
      await archive.finalize();
      
      const stats = await fs.stat(filePath);
      
      const backupRecord = await this.saveBackupRecord({
        filename,
        type: 'FULL',
        size: BigInt(stats.size),
        userId: options.userId,
        description: options.description
      });

      if (options.sendEmail) {
        try {
          await this.emailBackup(backupRecord.id, [], 'Full System Backup Created', 'Your full system backup has been created successfully.');
        } catch (emailError) {
          console.warn('Failed to send email notification for full backup:', emailError);
          // Don't fail the backup if email fails
        }
      }

      // Clean up individual backups
      await fs.unlink(path.join(this.backupDir, dbBackup.filename));
      await fs.unlink(path.join(this.backupDir, filesBackup.filename));

      return backupRecord;
    } catch (error) {
      try {
        await fs.unlink(filePath);
      } catch {}
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(backupId: number) {
    const backup = await prisma.backupRecord.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    const filePath = await this.getBackupFilePath(backup.filename);

    if (backup.type === 'DATABASE') {
      return this.restoreDatabase(filePath);
    } else if (backup.type === 'FILES') {
      return this.restoreFiles(filePath);
    } else if (backup.type === 'FULL') {
      return this.restoreFullBackup(filePath);
    }

    throw new Error('Unsupported backup type');
  }

  private async restoreDatabase(filePath: string) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const connection = parseDatabaseConnection(databaseUrl);
    
    // Create current backup before restore
    await this.createDatabaseBackup({
      userId: 1,
      description: 'Auto backup before restore'
    });

    // Restore database (environment-aware)
    const args = ['-h', connection.hostname];
    if (connection.port) {
      args.push('-P', connection.port);
    }
    args.push('-u', connection.username);
    if (connection.password) {
      args.push(`-p${connection.password}`);
    }
    args.push(connection.database);
    await runMysql(args);

    return { success: true, message: 'Database restored successfully' };
  }

  private async restoreFiles(filePath: string) {
    const publicDir = path.join(process.cwd(), 'public');
    
    // Try tar command first (Linux/macOS)
    try {
      const extractCommand = `tar -xzf ${filePath} -C ${publicDir}`;
      await execAsync(extractCommand);
    } catch (tarError) {
      // Fallback to Node.js extraction for Windows
      console.warn('tar command not available, using Node.js extraction');
      const yauzl = require('yauzl');
      const fs = require('fs');
      const path = require('path');
      
      await new Promise((resolve, reject) => {
        yauzl.open(filePath, { lazyEntries: true }, (err: Error | undefined, zipfile: any) => {
          if (err) return reject(err);
          if (!zipfile) return reject(new Error('Failed to open zip file'));
          
          zipfile.readEntry();
          zipfile.on('entry', (entry: any) => {
            if (/\/$/.test(entry.fileName)) {
              zipfile.readEntry();
            } else {
              zipfile.openReadStream(entry, (err: Error | undefined, readStream: any) => {
                if (err) return reject(err);
                
                const outputPath = path.join(publicDir, entry.fileName);
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                readStream.pipe(fs.createWriteStream(outputPath))
                  .on('finish', () => zipfile.readEntry())
                  .on('error', reject);
              });
            }
          });
          zipfile.on('end', resolve);
        });
      });
    }

    return { success: true, message: 'Files restored successfully' };
  }

  private async restoreFullBackup(filePath: string) {
    // Extract to temp directory
    const tempDir = path.join(this.backupDir, 'temp_restore');
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      // Try tar command first (Linux/macOS)
      const extractCommand = `tar -xzf ${filePath} -C ${tempDir}`;
      await execAsync(extractCommand);
    } catch (tarError) {
      // Fallback to Node.js extraction for Windows
      console.warn('tar command not available, using Node.js extraction');
      const yauzl = require('yauzl');
      const fs = require('fs');
      const path = require('path');
      
      await new Promise((resolve, reject) => {
        yauzl.open(filePath, { lazyEntries: true }, (err: Error | undefined, zipfile: any) => {
          if (err) return reject(err);
          if (!zipfile) return reject(new Error('Failed to open zip file'));
          
          zipfile.readEntry();
          zipfile.on('entry', (entry: any) => {
            if (/\/$/.test(entry.fileName)) {
              zipfile.readEntry();
            } else {
              zipfile.openReadStream(entry, (err: Error | undefined, readStream: any) => {
                if (err) return reject(err);
                
                const outputPath = path.join(tempDir, entry.fileName);
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                readStream.pipe(fs.createWriteStream(outputPath))
                  .on('finish', () => zipfile.readEntry())
                  .on('error', reject);
              });
            }
          });
          zipfile.on('end', resolve);
        });
      });
    }

    // Restore database
    await this.restoreDatabase(path.join(tempDir, 'database.sql.gz'));
    
    // Restore files
    await this.restoreFiles(path.join(tempDir, 'files.tar.gz'));

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });

    return { success: true, message: 'Full system restored successfully' };
  }

  // Delete backup
  async deleteBackup(filename: string) {
    const filePath = path.join(this.backupDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete backup file:', error);
    }
  }

  // Get backup file path
  async getBackupFilePath(filename: string): Promise<string> {
    return path.join(this.backupDir, filename);
  }

  // Save backup record to database
  private async saveBackupRecord(data: {
    filename: string;
    type: 'DATABASE' | 'FILES' | 'FULL';
    size: bigint;
    userId: number;
    description?: string;
  }) {
    return await prisma.backupRecord.create({
      data: {
        filename: data.filename,
        type: data.type,
        size: data.size,
        created_by: data.userId,
        description: data.description,
        is_auto: false,
        status: 'COMPLETED'
      }
    });
  }

  // Compress file (cross-platform)
  private async compressFile(filePath: string, method: 'gzip' | 'zip' = 'gzip'): Promise<string> {
    const zlib = await import('zlib');
    const fsModule = await import('fs');
    const compressedPath = filePath + (method === 'gzip' ? '.gz' : '.zip');
    
    if (method === 'gzip') {
      // Use Node.js gzip compression
      const gzip = zlib.createGzip();
      const readStream = fsModule.createReadStream(filePath);
      const writeStream = fsModule.createWriteStream(compressedPath);
      
      await new Promise<void>((resolve, reject) => {
        readStream.on('error', reject);
        writeStream.on('error', reject);
        gzip.on('error', reject);
        
        writeStream.on('finish', async () => {
          // Remove original file after compression (ignore if already gone)
          try {
            await fsModule.promises.unlink(filePath);
          } catch {
            // File might not exist, that's OK
          }
          resolve();
        });
        
        readStream.pipe(gzip).pipe(writeStream);
      });
    }
    
    return compressedPath;
  }

  // Create archive (cross-platform)
  private async createArchive(sourceDir: string, outputPath: string, exclude: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      const archive = archiver('tar', { gzip: true });
      const output = require('fs').createWriteStream(outputPath);
      
      output.on('close', resolve);
      archive.on('error', reject);
      
      archive.pipe(output);
      // Add directory (with exclude support)
      archive.directory(sourceDir, false, (entry: any) => {
        // Skip excluded directories/files
        const entryPath = entry.name;
        return exclude.some(excludePattern => {
          if (excludePattern.endsWith('/')) {
            return entryPath.startsWith(excludePattern);
          }
          return entryPath === excludePattern;
        }) ? false : entry;
      });
      archive.finalize();
    });
  }

  // Email backup
  async emailBackup(backupId: number, recipients: string[] = [], subject?: string, message?: string) {
    const backup = await prisma.backupRecord.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Get email settings (you might want to store these in settings table)
    const emailSettings = await this.getEmailSettings();
    
    if (!emailSettings.enabled) {
      throw new Error('Email delivery not configured');
    }

    const transporter = nodemailer.createTransport({
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort,
      secure: emailSettings.smtpSecure,
      auth: {
        user: emailSettings.smtpUser,
        pass: emailSettings.smtpPass
      }
    });

    const filePath = await this.getBackupFilePath(backup.filename);
    const stats = await fs.stat(filePath);

    // Decompress .gz file to send as .sql
    let attachmentPath = filePath;
    let attachmentFilename = backup.filename;
    
    if (backup.filename.endsWith('.gz')) {
      const zlib = await import('zlib');
      const fsModule = await import('fs');
      const tempSqlPath = filePath.replace('.gz', '');
      
      await new Promise<void>((resolve, reject) => {
        const gunzip = zlib.createGunzip();
        const readStream = fsModule.createReadStream(filePath);
        const writeStream = fsModule.createWriteStream(tempSqlPath);
        
        readStream.on('error', reject);
        writeStream.on('error', reject);
        gunzip.on('error', reject);
        writeStream.on('finish', resolve);
        
        readStream.pipe(gunzip).pipe(writeStream);
      });
      
      attachmentPath = tempSqlPath;
      attachmentFilename = backup.filename.replace('.gz', '');
    }
    
    const attachmentStats = await fs.stat(attachmentPath);

    const emailSubject = subject || `JAJR System Backup - ${attachmentFilename}`;
    const emailMessage = message || `
Backup Details:
- Type: ${backup.type}
- Size: ${(attachmentStats.size / 1024 / 1024).toFixed(2)} MB
- Created: ${backup.created_at}
- Description: ${backup.description || 'No description'}

Download link will be available for 48 hours.
    `;

    const mailOptions = {
      from: emailSettings.fromEmail,
      to: recipients.length > 0 ? recipients : emailSettings.defaultRecipients,
      subject: emailSubject,
      text: emailMessage,
      // Only attach if file is small enough (<20MB)
      attachments: attachmentStats.size < 20 * 1024 * 1024 ? [{
        filename: attachmentFilename,
        path: attachmentPath
      }] : []
    };

    const result = await transporter.sendMail(mailOptions);
    
    // Clean up temporary decompressed file
    if (backup.filename.endsWith('.gz') && attachmentPath !== filePath) {
      try {
        const fsModule = await import('fs');
        await fsModule.promises.unlink(attachmentPath);
      } catch {
        // Ignore cleanup errors
      }
    }
    
    // Update backup record with email delivery info
    await prisma.backupRecord.update({
      where: { id: backupId },
      data: {
        // You might want to add email delivery tracking fields
      }
    });

    return result;
  }

  // Upload to cloud storage
  async uploadToCloud(backupId: number, provider: string, config: any) {
    const backup = await prisma.backupRecord.findUnique({
      where: { id: backupId }
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    const filePath = await this.getBackupFilePath(backup.filename);
    
    let cloudUrl = '';
    
    if (provider === 'AWS_S3') {
      cloudUrl = await this.uploadToS3(filePath, backup.filename, config);
    } else if (provider === 'GOOGLE_DRIVE') {
      cloudUrl = await this.uploadToGoogleDrive(filePath, backup.filename, config);
    }

    // Update backup record with cloud URL
    await prisma.backupRecord.update({
      where: { id: backupId },
      data: {
        cloud_url: cloudUrl,
        cloud_provider: provider
      }
    });

    return { cloudUrl, provider };
  }

  private async uploadToS3(filePath: string, filename: string, config: any): Promise<string> {
    const s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    });

    const fileContent = await fs.readFile(filePath);
    
    const params = {
      Bucket: config.bucket,
      Key: `backups/${filename}`,
      Body: fileContent,
      ContentType: 'application/octet-stream'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  }

  private async uploadToGoogleDrive(filePath: string, filename: string, config: any): Promise<string> {
    const auth = new google.auth.GoogleAuth({
      credentials: config.credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
      name: filename,
      parents: [config.folderId]
    };

    const media = {
      mimeType: 'application/octet-stream',
      body: require('fs').createReadStream(filePath)
    };

    const result = await drive.files.create({
      requestBody: fileMetadata,
      media: media
    });

    return `https://drive.google.com/file/d/${result.data.id}`;
  }

  // Schedule backup
  async scheduleBackup(options: ScheduleOptions) {
    // Cancel existing job if any
    const jobKey = `${options.type}_${options.userId}`;
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
    }

    if (options.enabled) {
      // Schedule new job
      const job = cron.schedule(options.schedule, async () => {
        try {
          let backup;
          switch (options.type) {
            case 'DATABASE':
              backup = await this.createDatabaseBackup({
                userId: options.userId,
                sendEmail: options.emailDelivery.enabled
              });
              break;
            case 'FILES':
              backup = await this.createFilesBackup({
                userId: options.userId,
                sendEmail: options.emailDelivery.enabled
              });
              break;
            case 'FULL':
              backup = await this.createFullBackup({
                userId: options.userId,
                sendEmail: options.emailDelivery.enabled
              });
              break;
          }

          // Upload to cloud if configured
          if (options.cloudStorage?.enabled) {
            await this.uploadToCloud(backup.id, options.cloudStorage.provider, options.cloudStorage.config);
          }

          // Clean up old backups
          await this.cleanupOldBackup(options.retentionDays);
        } catch (error) {
          console.error('Scheduled backup failed:', error);
        }
      });

      this.scheduledJobs.set(jobKey, job);
      job.start();
    }

    return { scheduled: options.enabled, jobKey };
  }

  // Clean up old backups
  private async cleanupOldBackup(retentionDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await prisma.backupRecord.findMany({
      where: {
        created_at: { lt: cutoffDate }
      }
    });

    for (const backup of oldBackups) {
      await this.deleteBackup(backup.filename);
      await prisma.backupRecord.delete({
        where: { id: backup.id }
      });
    }
  }

  // Get backup statistics
  async getBackupStats() {
    const totalBackups = await prisma.backupRecord.count();
    const totalSize = await prisma.backupRecord.aggregate({
      _sum: { size: true }
    });

    const recentBackups = await prisma.backupRecord.findMany({
      where: {
        created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { created_at: 'desc' }
    });

    // Convert BigInt to Number for JSON serialization
    const sizeValue = totalSize._sum.size;
    
    return {
      totalBackups,
      totalSize: sizeValue ? Number(sizeValue) : 0,
      recentBackups: recentBackups.length,
      lastBackup: recentBackups[0] || null
    };
  }

  // Get email settings (you might want to move this to a settings service)
  private async getEmailSettings() {
    // Check if email is configured
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    // Email is considered enabled only if both user and password are set
    const enabled = !!(smtpUser && smtpPass);

    return {
      enabled,
      smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: smtpUser || '',
      smtpPass: smtpPass || '',
      fromEmail: process.env.FROM_EMAIL || 'noreply@jajr-construction.com',
      defaultRecipients: process.env.DEFAULT_RECIPIENTS?.split(',') || []
    };
  }
}

export const backupService = new BackupService();
