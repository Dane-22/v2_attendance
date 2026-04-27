import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import fileCompressionService from '../services/fileCompression.service';
import { logBufferService } from '../services/logBuffer.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const documentController = {
  /**
   * Get all employees with document summary
   */
  getEmployeesWithDocumentSummary: async (req: Request, res: Response) => {
    try {
      const { search, branch_code, page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search as string } },
          { lastName: { contains: search as string } },
          { employeeCode: { contains: search as string } },
        ];
      }
      if (branch_code) {
        where.branchCode = branch_code as string;
      }

      // Get employees with document count
      const employees = await prisma.employee.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      });

      // Get document counts for each employee
      const employeesWithCounts = await Promise.all(
        employees.map(async (employee) => {
          const documentCount = await prisma.document.count({
            where: {
              employeeId: employee.id,
              isArchived: false,
            },
          });

          return {
            ...employee,
            documentCount,
          };
        })
      );

      const total = await prisma.employee.count({ where });

      res.json({
        success: true,
        data: employeesWithCounts,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('[Document] Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get employee details with document list
   */
  getEmployeeDocuments: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const employee = await prisma.employee.findUnique({
        where: { id: Number(id) },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }

      const documents = await prisma.document.findMany({
        where: {
          employeeId: Number(id),
          isArchived: false,
        },
        orderBy: { uploadedAt: 'desc' },
      });

      res.json({
        success: true,
        data: {
          employee,
          documents,
        },
      });
    } catch (error) {
      console.error('[Document] Error fetching employee documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Upload single document
   */
  uploadDocument: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { documentType } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      if (!documentType) {
        return res.status(400).json({
          success: false,
          message: 'Document type is required',
        });
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 50MB limit',
        });
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type',
        });
      }

      // Verify employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: Number(id) },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }

      // Compress file if needed
      const { compressedBuffer, wasCompressed } = await fileCompressionService.compressFile(
        file.buffer,
        file.mimetype
      );

      // Generate file hash
      const fileHash = await fileCompressionService.generateFileHash(compressedBuffer);

      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', '201-files', id);
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const fileName = `${id}_${documentType}_${timestamp}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file
      await fs.writeFile(filePath, compressedBuffer);

      // Get uploader info from token
      const userId = (req as AuthenticatedRequest).admin?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Save document record
      const document = await prisma.document.create({
        data: {
          employeeId: Number(id),
          documentType,
          fileName,
          originalFileName: file.originalname,
          filePath: `/uploads/201-files/${id}/${fileName}`,
          fileSize: compressedBuffer.length,
          mimeType: file.mimetype,
          fileHash,
          isCompressed: wasCompressed,
          uploadedBy: userId,
        },
      });

      // Log activity
      logBufferService.addLog({
        userId,
        userName: (req as AuthenticatedRequest).admin?.name || 'Unknown',
        userRole: (req as AuthenticatedRequest).admin?.role || 'Unknown',
        actionType: 'UPLOAD',
        entityType: 'DOCUMENT',
        entityId: document.id.toString(),
        entityName: file.originalname,
        description: `Uploaded document for employee ${employee.firstName} ${employee.lastName}`,
      });

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: document,
      });
    } catch (error) {
      console.error('[Document] Error uploading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Bulk upload documents
   */
  bulkUploadDocuments: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { typeMapping } = req.body; // Array of { index, documentType }
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded',
        });
      }

      if (!typeMapping || !Array.isArray(typeMapping)) {
        return res.status(400).json({
          success: false,
          message: 'Type mapping is required',
        });
      }

      // Verify employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: Number(id) },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', '201-files', id);
      await fs.mkdir(uploadDir, { recursive: true });

      const userId = (req as AuthenticatedRequest).admin?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const uploadedDocuments = [];
      const errors = [];

      // Process each file
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const mapping = typeMapping[i];

          if (!mapping || !mapping.documentType) {
            errors.push({ file: file.originalname, error: 'Document type not provided' });
            continue;
          }

          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            errors.push({ file: file.originalname, error: 'File size exceeds 50MB limit' });
            continue;
          }

          // Validate MIME type
          if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            errors.push({ file: file.originalname, error: 'Invalid file type' });
            continue;
          }

          // Compress file
          const { compressedBuffer, wasCompressed } = await fileCompressionService.compressFile(
            file.buffer,
            file.mimetype
          );

          // Generate file hash
          const fileHash = await fileCompressionService.generateFileHash(compressedBuffer);

          // Generate filename
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          const fileName = `${id}_${mapping.documentType}_${timestamp}_${i}${ext}`;
          const filePath = path.join(uploadDir, fileName);

          // Save file
          await fs.writeFile(filePath, compressedBuffer);

          // Save document record
          const document = await prisma.document.create({
            data: {
              employeeId: Number(id),
              documentType: mapping.documentType,
              fileName,
              originalFileName: file.originalname,
              filePath: `/uploads/201-files/${id}/${fileName}`,
              fileSize: compressedBuffer.length,
              mimeType: file.mimetype,
              fileHash,
              isCompressed: wasCompressed,
              uploadedBy: userId,
            },
          });

          uploadedDocuments.push(document);
        } catch (error) {
          console.error(`[Document] Error uploading file ${files[i].originalname}:`, error);
          errors.push({
            file: files[i].originalname,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log activity
      logBufferService.addLog({
        userId,
        userName: (req as AuthenticatedRequest).admin?.name || 'Unknown',
        userRole: (req as AuthenticatedRequest).admin?.role || 'Unknown',
        actionType: 'UPLOAD',
        entityType: 'DOCUMENT',
        description: `Bulk uploaded ${uploadedDocuments.length} documents for employee ${employee.firstName} ${employee.lastName}`,
      });

      res.json({
        success: true,
        message: `Successfully uploaded ${uploadedDocuments.length} of ${files.length} documents`,
        data: uploadedDocuments,
        errors,
      });
    } catch (error) {
      console.error('[Document] Error bulk uploading documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk upload documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Download document
   */
  downloadDocument: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id: Number(id) },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      const filePath = path.join(process.cwd(), 'public', document.filePath);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'File not found on disk',
        });
      }

      // Send file
      res.download(filePath, document.originalFileName || document.fileName);
    } catch (error) {
      console.error('[Document] Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Delete document permanently
   */
  deleteDocument: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id: Number(id) },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      // Delete file from disk
      const filePath = path.join(process.cwd(), 'public', document.filePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('[Document] Error deleting file from disk:', error);
      }

      // Delete from database
      await prisma.document.delete({
        where: { id: Number(id) },
      });

      // Log activity
      const userId = (req as AuthenticatedRequest).admin?.id;
      logBufferService.addLog({
        userId,
        userName: (req as AuthenticatedRequest).admin?.name || 'Unknown',
        userRole: (req as AuthenticatedRequest).admin?.role || 'Unknown',
        actionType: 'DELETE',
        entityType: 'DOCUMENT',
        entityId: document.id.toString(),
        entityName: document.fileName,
        description: `Permanently deleted document`,
      });

      res.json({
        success: true,
        message: 'Document deleted permanently',
      });
    } catch (error) {
      console.error('[Document] Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Archive document (soft delete)
   */
  archiveDocument: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id: Number(id) },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      // Move file to archived directory
      const originalPath = path.join(process.cwd(), 'public', document.filePath);
      const archivedDir = path.join(process.cwd(), 'public', 'uploads', '201-files', 'archived', document.employeeId?.toString() || 'unknown');
      await fs.mkdir(archivedDir, { recursive: true });

      const archivedPath = path.join(archivedDir, document.fileName);
      await fs.rename(originalPath, archivedPath);

      // Update database
      const userId = (req as AuthenticatedRequest).admin?.id;
      const updatedDocument = await prisma.document.update({
        where: { id: Number(id) },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          archivedBy: userId,
          filePath: `/uploads/201-files/archived/${document.employeeId}/${document.fileName}`,
        },
      });

      // Log activity
      logBufferService.addLog({
        userId,
        userName: (req as AuthenticatedRequest).admin?.name || 'Unknown',
        userRole: (req as AuthenticatedRequest).admin?.role || 'Unknown',
        actionType: 'UPDATE',
        entityType: 'DOCUMENT',
        entityId: document.id.toString(),
        entityName: document.fileName,
        description: 'Archived document',
      });

      res.json({
        success: true,
        message: 'Document archived successfully',
        data: updatedDocument,
      });
    } catch (error) {
      console.error('[Document] Error archiving document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Unarchive document
   */
  unarchiveDocument: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const document = await prisma.document.findUnique({
        where: { id: Number(id) },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      if (!document.employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot unarchive document without associated employee',
        });
      }

      // Move file back to employee directory
      const archivedPath = path.join(process.cwd(), 'public', document.filePath);
      const employeeDir = path.join(process.cwd(), 'public', 'uploads', '201-files', document.employeeId.toString());
      await fs.mkdir(employeeDir, { recursive: true });

      const restoredPath = path.join(employeeDir, document.fileName);
      await fs.rename(archivedPath, restoredPath);

      // Update database
      const userId = (req as AuthenticatedRequest).admin?.id;
      const updatedDocument = await prisma.document.update({
        where: { id: Number(id) },
        data: {
          isArchived: false,
          archivedAt: null,
          archivedBy: null,
          filePath: `/uploads/201-files/${document.employeeId}/${document.fileName}`,
        },
      });

      // Log activity
      logBufferService.addLog({
        userId,
        userName: (req as AuthenticatedRequest).admin?.name || 'Unknown',
        userRole: (req as AuthenticatedRequest).admin?.role || 'Unknown',
        actionType: 'UPDATE',
        entityType: 'DOCUMENT',
        entityId: document.id.toString(),
        entityName: document.fileName,
        description: 'Unarchived document',
      });

      res.json({
        success: true,
        message: 'Document unarchived successfully',
        data: updatedDocument,
      });
    } catch (error) {
      console.error('[Document] Error unarchiving document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unarchive document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get all archived documents
   */
  getArchivedDocuments: async (req: Request, res: Response) => {
    try {
      const { employee_id, document_type, page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { isArchived: true };
      if (employee_id) {
        where.employeeId = Number(employee_id);
      }
      if (document_type) {
        where.documentType = document_type as string;
      }

      const documents = await prisma.document.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { archivedAt: 'desc' },
      });

      // Fetch employee info for each document
      const documentsWithEmployee = await Promise.all(
        documents.map(async (doc: any) => {
          if (doc.employeeId) {
            const employee = await prisma.employee.findUnique({
              where: { id: doc.employeeId },
              select: { firstName: true, lastName: true, employeeCode: true },
            });
            return { ...doc, employee };
          }
          return { ...doc, employee: null };
        })
      );

      const total = await prisma.document.count({ where });

      res.json({
        success: true,
        data: documentsWithEmployee,
        meta: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('[Document] Error fetching archived documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch archived documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Archive all documents for an employee
   */
  archiveAllEmployeeDocuments: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const documents = await prisma.document.findMany({
        where: {
          employeeId: Number(id),
          isArchived: false,
        },
      });

      if (documents.length === 0) {
        return res.json({
          success: true,
          message: 'No documents to archive',
          data: { archivedCount: 0 },
        });
      }

      const archivedDir = path.join(process.cwd(), 'public', 'uploads', '201-files', 'archived', id);
      await fs.mkdir(archivedDir, { recursive: true });

      const userId = (req as AuthenticatedRequest).admin?.id;
      let archivedCount = 0;

      for (const document of documents) {
        try {
          // Move file to archived directory
          const originalPath = path.join(process.cwd(), 'public', document.filePath);
          const archivedPath = path.join(archivedDir, document.fileName);
          await fs.rename(originalPath, archivedPath);

          // Update database
          await prisma.document.update({
            where: { id: document.id },
            data: {
              isArchived: true,
              archivedAt: new Date(),
              archivedBy: userId,
              filePath: `/uploads/201-files/archived/${id}/${document.fileName}`,
            },
          });

          archivedCount++;
        } catch (error) {
          console.error(`[Document] Error archiving document ${document.id}:`, error);
        }
      }

      // Log activity
      logBufferService.addLog({
        userId,
        userName: (req as AuthenticatedRequest).admin?.name || 'Unknown',
        userRole: (req as AuthenticatedRequest).admin?.role || 'Unknown',
        actionType: 'UPDATE',
        entityType: 'DOCUMENT',
        entityId: id,
        description: `Archived all ${archivedCount} documents for employee`,
      });

      res.json({
        success: true,
        message: `Successfully archived ${archivedCount} documents`,
        data: { archivedCount },
      });
    } catch (error) {
      console.error('[Document] Error archiving all employee documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive all employee documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  /**
   * Get document statistics
   */
  getDocumentStats: async (req: Request, res: Response) => {
    try {
      const totalDocuments = await prisma.document.count({ where: { isArchived: false } });
      const archivedDocuments = await prisma.document.count({ where: { isArchived: true } });

      const documentsByType = await prisma.document.groupBy({
        by: ['documentType'],
        where: { isArchived: false },
        _count: true,
      });

      const employeesWithDocs = await prisma.document.groupBy({
        by: ['employeeId'],
        where: { isArchived: false },
      });

      res.json({
        success: true,
        data: {
          totalDocuments,
          archivedDocuments,
          documentsByType,
          employeesWithDocumentsCount: employeesWithDocs.length,
        },
      });
    } catch (error) {
      console.error('[Document] Error fetching document stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
};

export default documentController;
