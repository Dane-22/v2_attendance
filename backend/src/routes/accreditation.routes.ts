import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'accreditation');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `accreditation-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Upload accreditation document
router.post(
  '/suppliers/:supplierId/accreditation/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { userId } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Check if supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) },
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      // Delete previous accreditation if exists
      await prisma.supplierAccreditation.deleteMany({
        where: { supplierId: parseInt(supplierId) },
      });

      // Create new accreditation record
      const accreditation = await prisma.supplierAccreditation.create({
        data: {
          supplierId: parseInt(supplierId),
          status: 'PENDING_VERIFICATION',
          documentPath: `/uploads/accreditation/${req.file.filename}`,
          documentType: req.file.mimetype,
          uploadedBy: parseInt(userId || '1'),
        },
      });

      // Update supplier accreditation status
      await prisma.supplier.update({
        where: { id: parseInt(supplierId) },
        data: { accreditationStatus: 'PENDING_VERIFICATION' },
      });

      res.json({
        success: true,
        message: 'Accreditation document uploaded successfully',
        accreditation,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get supplier accreditation status
router.get('/suppliers/:supplierId/accreditation', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(supplierId) },
      include: { accreditation: true },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({
      success: true,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        accreditationStatus: supplier.accreditationStatus,
        accreditation: supplier.accreditation,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify accreditation (admin only)
router.put(
  '/suppliers/:supplierId/accreditation/verify',
  async (req: Request, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { approved, rejectionReason, verifiedBy, expiryDate } = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) },
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      const newStatus = approved ? 'ACCREDITED' : 'REJECTED';

      // Update accreditation record
      const accreditation = await prisma.supplierAccreditation.updateMany(
        {
          where: { supplierId: parseInt(supplierId) },
          data: {
            status: newStatus,
            verifiedAt: new Date(),
            verifiedBy: verifiedBy ? parseInt(verifiedBy) : undefined,
            rejectionReason: rejectionReason || null,
          },
        }
      );

      // Update supplier status
      await prisma.supplier.update({
        where: { id: parseInt(supplierId) },
        data: {
          accreditationStatus: newStatus as any,
          accreditationExpiry: approved && expiryDate ? new Date(expiryDate) : null,
        },
      });

      res.json({
        success: true,
        message: `Accreditation ${approved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create purchase order with accreditation check
router.post('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const {
      supplierId,
      projectId,
      projectName,
      items,
      subtotal,
      tax,
      total,
      deliveryDate,
      requestedBy,
    } = req.body;

    // Get supplier and check accreditation
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const accreditationStatus = supplier.accreditationStatus;
    const requiresManualApproval = accreditationStatus !== 'ACCREDITED';
    const poStatus = requiresManualApproval ? 'REQUIRES_APPROVAL' : 'PENDING';

    // Generate PO number
    const poCount = await prisma.purchaseOrder.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(3, '0')}`;

    // Create purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        projectId,
        projectName,
        status: poStatus as any,
        accreditationStatus: accreditationStatus as any,
        requiresManualApproval,
        subtotal: parseFloat(subtotal),
        tax: parseFloat(tax),
        total: parseFloat(total),
        orderDate: new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        requestedBy: parseInt(requestedBy || '1'),
        items: {
          create: items.map((item: any) => ({
            itemName: item.name,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            unitPrice: parseFloat(item.unitPrice),
            total: parseFloat(item.quantity) * parseFloat(item.unitPrice),
          })),
        },
      },
      include: { items: true },
    });

    res.json({
      success: true,
      message: 'Purchase order created successfully',
      purchaseOrder,
      requiresApproval: requiresManualApproval,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all purchase orders
router.get('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { status, supplierId, requiresApproval } = req.query;

    let where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = parseInt(supplierId as string);
    if (requiresApproval === 'true') where.requiresManualApproval = true;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        items: true,
        supplier: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update purchase order status
router.patch('/purchase-orders/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, approvedBy, rejectionReason } = req.body;

    const order = await prisma.purchaseOrder.update({
      where: { id: parseInt(orderId) },
      data: {
        status: status as any,
        approvedBy: approvedBy ? parseInt(approvedBy) : undefined,
        approvedAt: new Date(),
        rejectionReason: rejectionReason || null,
        requiresManualApproval: false,
      },
    });

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
