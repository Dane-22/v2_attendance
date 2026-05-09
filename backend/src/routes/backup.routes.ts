import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { backupController } from '../controllers/backup.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

// Apply authentication to all backup routes
router.use(authenticate);
router.use(requireAdmin);

// Validation rules
const createBackupValidation = [
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('sendEmail must be a boolean')
];

const scheduleBackupValidation = [
  body('type')
    .isIn(['DATABASE', 'FILES', 'FULL'])
    .withMessage('Type must be DATABASE, FILES, or FULL'),
  body('schedule')
    .isString()
    .withMessage('Schedule must be a cron expression'),
  body('enabled')
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
  body('retentionDays')
    .isInt({ min: 1, max: 365 })
    .withMessage('Retention days must be between 1 and 365'),
  body('emailDelivery.enabled')
    .isBoolean()
    .withMessage('Email delivery enabled must be a boolean'),
  body('emailDelivery.recipients')
    .isArray()
    .withMessage('Recipients must be an array'),
  body('emailDelivery.recipients.*')
    .isEmail()
    .withMessage('Each recipient must be a valid email'),
  body('cloudStorage.enabled')
    .optional()
    .isBoolean()
    .withMessage('Cloud storage enabled must be a boolean'),
  body('cloudStorage.provider')
    .optional()
    .isIn(['AWS_S3', 'GOOGLE_DRIVE', 'DROPBOX'])
    .withMessage('Provider must be AWS_S3, GOOGLE_DRIVE, or DROPBOX')
];

const emailBackupValidation = [
  body('backupId')
    .isInt({ min: 1 })
    .withMessage('Backup ID must be a positive integer'),
  body('recipients')
    .isArray()
    .withMessage('Recipients must be an array'),
  body('recipients.*')
    .isEmail()
    .withMessage('Each recipient must be a valid email'),
  body('subject')
    .optional()
    .isString()
    .withMessage('Subject must be a string'),
  body('message')
    .optional()
    .isString()
    .withMessage('Message must be a string')
];

const restoreBackupValidation = [
  body('backupId')
    .isInt({ min: 1 })
    .withMessage('Backup ID must be a positive integer'),
  body('confirmPassword')
    .equals('RESTORE_CONFIRMED')
    .withMessage('Restore confirmation required')
];

const cloudUploadValidation = [
  body('backupId')
    .isInt({ min: 1 })
    .withMessage('Backup ID must be a positive integer'),
  body('provider')
    .isIn(['AWS_S3', 'GOOGLE_DRIVE', 'DROPBOX'])
    .withMessage('Provider must be AWS_S3, GOOGLE_DRIVE, or DROPBOX'),
  body('config')
    .isObject()
    .withMessage('Config must be an object')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['DATABASE', 'FILES', 'FULL'])
    .withMessage('Type must be DATABASE, FILES, or FULL'),
  query('status')
    .optional()
    .isIn(['COMPLETED', 'FAILED', 'PENDING', 'IN_PROGRESS'])
    .withMessage('Status must be a valid backup status')
];

// Routes

/**
 * @swagger
 * /api/backup/database:
 *   post:
 *     summary: Create database backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Optional description for the backup
 *               sendEmail:
 *                 type: boolean
 *                 description: Whether to send backup via email
 *     responses:
 *       200:
 *         description: Database backup created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/database', createBackupValidation, backupController.createDatabaseBackup);

/**
 * @swagger
 * /api/backup/files:
 *   post:
 *     summary: Create files backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               sendEmail:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Files backup created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/files', createBackupValidation, backupController.createFilesBackup);

/**
 * @swagger
 * /api/backup/full:
 *   post:
 *     summary: Create full system backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               sendEmail:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Full backup created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/full', createBackupValidation, backupController.createFullBackup);

/**
 * @swagger
 * /api/backup/list:
 *   get:
 *     summary: List all backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DATABASE, FILES, FULL]
 *         description: Filter by backup type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMPLETED, FAILED, PENDING, IN_PROGRESS]
 *         description: Filter by backup status
 *     responses:
 *       200:
 *         description: List of backups
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get('/list', paginationValidation, backupController.listBackups);

/**
 * @swagger
 * /api/backup/download/{id}:
 *   get:
 *     summary: Download backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Backup ID
 *     responses:
 *       200:
 *         description: Backup file download
 *       404:
 *         description: Backup not found
 *       500:
 *         description: Server error
 */
router.get('/download/:id', idValidation, backupController.downloadBackup);

/**
 * @swagger
 * /api/backup/restore:
 *   post:
 *     summary: Restore from backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupId
 *               - confirmPassword
 *             properties:
 *               backupId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the backup to restore
 *               confirmPassword:
 *                 type: string
 *                 enum: [RESTORE_CONFIRMED]
 *                 description: Confirmation password
 *     responses:
 *       200:
 *         description: Backup restored successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/restore', restoreBackupValidation, backupController.restoreBackup);

/**
 * @swagger
 * /api/backup/{id}:
 *   delete:
 *     summary: Delete backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Backup ID
 *     responses:
 *       200:
 *         description: Backup deleted successfully
 *       404:
 *         description: Backup not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', idValidation, backupController.deleteBackup);

/**
 * @swagger
 * /api/backup/schedule:
 *   post:
 *     summary: Schedule backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - schedule
 *               - enabled
 *               - retentionDays
 *               - emailDelivery
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [DATABASE, FILES, FULL]
 *               schedule:
 *                 type: string
 *                 description: Cron expression
 *               enabled:
 *                 type: boolean
 *               retentionDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *               emailDelivery:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   recipients:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: email
 *                   subject:
 *                     type: string
 *               cloudStorage:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   provider:
 *                     type: string
 *                     enum: [AWS_S3, GOOGLE_DRIVE, DROPBOX]
 *                   config:
 *                     type: object
 *     responses:
 *       200:
 *         description: Backup schedule updated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/schedule', scheduleBackupValidation, backupController.scheduleBackup);

/**
 * @swagger
 * /api/backup/cloud-upload:
 *   post:
 *     summary: Upload backup to cloud storage
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupId
 *               - provider
 *               - config
 *             properties:
 *               backupId:
 *                 type: integer
 *                 minimum: 1
 *               provider:
 *                 type: string
 *                 enum: [AWS_S3, GOOGLE_DRIVE, DROPBOX]
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Backup uploaded to cloud successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/cloud-upload', cloudUploadValidation, backupController.uploadToCloud);

/**
 * @swagger
 * /api/backup/email-delivery:
 *   post:
 *     summary: Send backup via email
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - backupId
 *               - recipients
 *             properties:
 *               backupId:
 *                 type: integer
 *                 minimum: 1
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Backup sent via email successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/email-delivery', emailBackupValidation, backupController.emailBackup);

/**
 * @swagger
 * /api/backup/stats:
 *   get:
 *     summary: Get backup statistics
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup statistics
 *       500:
 *         description: Server error
 */
router.get('/stats', backupController.getBackupStats);

export default router;
