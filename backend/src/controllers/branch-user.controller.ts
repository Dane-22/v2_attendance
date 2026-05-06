import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ApiResponse, PaginatedResponse } from '../types/api.types';
import { logCreate, logUpdate, logDelete } from '../services/activityLogger.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for branch user profile image uploads
const uploadDir = path.join(process.cwd(), 'assets', 'profile-images', 'branch-users');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const adminId = req.params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${adminId}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Password complexity validation
const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
};

export const getAllBranchUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const branchCode = req.query.branch_code as string;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } }
      ];
    }

    if (branchCode) {
      where.branch_code = branchCode;
    }

    const [admins, total] = await Promise.all([
      prisma.admins.findMany({
        where: {
          ...where,
          branch_code: { not: null }
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          username: true,
          name: true,
          branch_code: true,
          role: true,
          created_at: true
        }
      }),
      prisma.admins.count({
        where: {
          ...where,
          branch_code: { not: null }
        }
      })
    ]);

    // Get branch names from branches table
    const branchCodes = admins.map(a => a.branch_code).filter(Boolean);
    const branches = await prisma.branches.findMany({
      where: { branch_code: { in: branchCodes as string[] } },
      select: { branch_code: true, branch_name: true }
    });

    const branchMap = new Map(branches.map(b => [b.branch_code, b.branch_name]));

    const branchUsers = admins.map(admin => ({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      branch_code: admin.branch_code,
      branch_name: branchMap.get(admin.branch_code || '') || '',
      role: admin.role,
      created_at: admin.created_at
    }));

    const response = {
      success: true,
      message: 'Branch users retrieved successfully',
      data: branchUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    } as PaginatedResponse<any>;

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createBranchUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { password, branch_name, address, contact_number } = req.body;

    // Validation
    if (!password || !branch_name) {
      throw new AppError('Password and branch name are required', 400);
    }

    // Validate password complexity
    if (!validatePassword(password)) {
      throw new AppError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number', 400);
    }

    // Auto-generate branch code (sequential letter)
    const existingAdmins = await prisma.admins.findMany({
      where: { branch_code: { not: null } },
      select: { branch_code: true },
      orderBy: { branch_code: 'asc' }
    });

    const usedCodes = new Set(existingAdmins.map(b => b.branch_code?.toUpperCase()));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let nextCode = 'A';
    for (let i = 0; i < alphabet.length; i++) {
      if (!usedCodes.has(alphabet[i])) {
        nextCode = alphabet[i];
        break;
      }
    }

    // If all single letters are used, try AA, AB, AC pattern
    if (usedCodes.has(nextCode)) {
      for (let i = 0; i < alphabet.length; i++) {
        for (let j = 0; j < alphabet.length; j++) {
          const doubleCode = alphabet[i] + alphabet[j];
          if (!usedCodes.has(doubleCode)) {
            nextCode = doubleCode;
            break;
          }
        }
        if (nextCode !== 'A') break;
      }
    }

    // Auto-generate username and name
    const autoUsername = `branch-${nextCode.toLowerCase()}`;
    const autoName = `Branch ${nextCode}`;

    // Check username uniqueness in admins table
    const existingAdmin = await prisma.admins.findUnique({
      where: { username: autoUsername }
    });
    if (existingAdmin) {
      throw new AppError('Username already exists', 409);
    }

    // Check branch code uniqueness in branches table
    const existingBranch = await prisma.branches.findUnique({
      where: { branch_code: nextCode }
    });
    if (existingBranch) {
      throw new AppError('Branch code already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin record
    const admin = await prisma.admins.create({
      data: {
        username: autoUsername,
        password: hashedPassword,
        name: autoName,
        email: `${autoUsername}@branch.local`,
        role: null,
        branch_code: nextCode,
        permissions_enabled: false,
        permissions: '[]'
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        branch_code: true,
        created_at: true
      }
    });

    // Create branch record
    const branch = await prisma.branches.create({
      data: {
        branch_code: nextCode,
        branch_name: branch_name,
        address: address || null,
        contact_number: contact_number || null,
        status: 'Active'
      },
      select: {
        id: true,
        branch_code: true,
        branch_name: true,
        address: true,
        contact_number: true,
        status: true,
        created_at: true
      }
    });

    // Log admin creation
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ADMIN',
      entityId: admin.id.toString(),
      entityName: admin.username,
      description: `Created new branch admin: ${admin.username} for branch ${nextCode}`,
      detailsAfter: admin,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Log branch creation
    await logCreate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'BRANCH',
      entityId: branch.id.toString(),
      entityName: branch.branch_name,
      description: `Created new branch: ${branch.branch_name} (${nextCode})`,
      detailsAfter: branch,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<{ admin: typeof admin; branch: typeof branch }> = {
      success: true,
      message: 'Branch user created successfully',
      data: {
        admin,
        branch
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateBranchUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { password, branch_name, address, contact_number } = req.body;

    const existingAdmin = await prisma.admins.findUnique({
      where: { id }
    });

    if (!existingAdmin || !existingAdmin.branch_code) {
      throw new AppError('Branch user not found', 404);
    }

    // Prepare admin update data
    const adminUpdateData: any = {};
    if (password) {
      if (!validatePassword(password)) {
        throw new AppError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number', 400);
      }
      adminUpdateData.password = await bcrypt.hash(password, 10);
    }

    // Prepare branch update data
    const branchUpdateData: any = {};
    if (branch_name) branchUpdateData.branch_name = branch_name;
    if (address !== undefined) branchUpdateData.address = address || null;
    if (contact_number !== undefined) branchUpdateData.contact_number = contact_number || null;

    // Update admin record
    const admin = await prisma.admins.update({
      where: { id },
      data: adminUpdateData,
      select: {
        id: true,
        username: true,
        name: true,
        branch_code: true,
        role: true,
        created_at: true
      }
    });

    // Check if branch exists before updating
    const existingBranch = await prisma.branches.findUnique({
      where: { branch_code: existingAdmin.branch_code }
    });

    let branch;
    if (existingBranch) {
      // Only update branch if it exists and there's data to update
      if (Object.keys(branchUpdateData).length > 0) {
        branch = await prisma.branches.update({
          where: { branch_code: existingAdmin.branch_code },
          data: branchUpdateData,
          select: {
            id: true,
            branch_code: true,
            branch_name: true,
            address: true,
            contact_number: true,
            status: true,
            created_at: true
          }
        });
      } else {
        branch = existingBranch;
      }
    } else {
      // If branch doesn't exist, create it with default values
      branch = await prisma.branches.create({
        data: {
          branch_code: existingAdmin.branch_code,
          branch_name: branch_name || existingAdmin.username,
          address: address || null,
          contact_number: contact_number || null,
          status: 'Active'
        },
        select: {
          id: true,
          branch_code: true,
          branch_name: true,
          address: true,
          contact_number: true,
          status: true,
          created_at: true
        }
      });
    }

    // Log admin update
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ADMIN',
      entityId: admin.id.toString(),
      entityName: admin.username,
      description: `Updated branch admin: ${admin.username}`,
      detailsBefore: existingAdmin,
      detailsAfter: admin,
      changes: Object.keys(adminUpdateData),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Log branch update
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'BRANCH',
      entityId: branch.id.toString(),
      entityName: branch.branch_name,
      description: `Updated branch: ${branch.branch_name}`,
      detailsBefore: { branch_code: existingAdmin.branch_code },
      detailsAfter: branch,
      changes: Object.keys(branchUpdateData),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<{ admin: typeof admin; branch: typeof branch }> = {
      success: true,
      message: 'Branch user updated successfully',
      data: {
        admin,
        branch
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteBranchUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const existingAdmin = await prisma.admins.findUnique({
      where: { id }
    });

    if (!existingAdmin || !existingAdmin.branch_code) {
      throw new AppError('Branch user not found', 404);
    }

    const branchCode = existingAdmin.branch_code;

    // Delete admin record
    await prisma.admins.delete({ where: { id } });

    // Delete branch record
    await prisma.branches.delete({
      where: { branch_code: branchCode }
    });

    // Log admin deletion
    await logDelete({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ADMIN',
      entityId: existingAdmin.id.toString(),
      entityName: existingAdmin.username,
      description: `Deleted branch admin: ${existingAdmin.username} from branch ${branchCode}`,
      detailsBefore: existingAdmin,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Log branch deletion
    await logDelete({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'BRANCH',
      entityId: branchCode,
      entityName: `Branch ${branchCode}`,
      description: `Deleted branch: ${branchCode}`,
      detailsBefore: { branch_code: branchCode },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Branch user deleted successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const admin = await prisma.admins.findUnique({
      where: { id }
    });

    if (!admin) {
      throw new AppError('Branch user not found', 404);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Generate the image URL path
    const imagePath = `/assets/profile-images/branch-users/${req.file.filename}`;

    // Update admin with new profile image
    const updatedAdmin = await prisma.admins.update({
      where: { id },
      data: { profileImage: imagePath },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        branch_code: true,
        permissions: true,
        permissions_enabled: true,
        profileImage: true,
        created_at: true,
        updated_at: true
      }
    });

    // Log profile image update
    await logUpdate({
      userId: req.admin?.id || 0,
      userName: req.admin?.name || 'unknown',
      userRole: req.admin?.role || 'admin',
      entityType: 'ADMIN',
      entityId: admin.id.toString(),
      entityName: admin.name,
      description: `Updated profile image for branch user: ${admin.username}`,
      detailsBefore: { profileImage: admin.profileImage },
      detailsAfter: { profileImage: imagePath },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const response: ApiResponse<typeof updatedAdmin> = {
      success: true,
      message: 'Profile image uploaded successfully',
      data: updatedAdmin
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Export upload middleware for use in routes
export const uploadMiddleware = upload.single('profileImage');
