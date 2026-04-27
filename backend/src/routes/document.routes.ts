import express from 'express';
import multer from 'multer';
import documentController from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/role.middleware';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Apply authentication and Super Admin middleware to all routes
router.use(authenticate, requireSuperAdmin);

// Get document statistics (must come before /:id)
router.get('/stats', documentController.getDocumentStats);

// Get all archived documents (must come before /:id)
router.get('/archived', documentController.getArchivedDocuments);

// Get all employees with document summary
router.get('/employees', documentController.getEmployeesWithDocumentSummary);

// Get employee details with document list
router.get('/employees/:id', documentController.getEmployeeDocuments);

// Get all documents for an employee
router.get('/employees/:id/documents', documentController.getEmployeeDocuments);

// Upload single document
router.post('/employees/:id/documents', upload.single('file'), documentController.uploadDocument);

// Bulk upload documents
router.post('/employees/:id/documents/bulk', upload.array('files', 10), documentController.bulkUploadDocuments);

// Archive all documents for an employee
router.post('/employees/:id/archive-all', documentController.archiveAllEmployeeDocuments);

// Download document
router.get('/:id', documentController.downloadDocument);

// Delete document permanently
router.delete('/:id', documentController.deleteDocument);

// Archive document
router.post('/:id/archive', documentController.archiveDocument);

// Unarchive document
router.post('/:id/unarchive', documentController.unarchiveDocument);

export default router;
