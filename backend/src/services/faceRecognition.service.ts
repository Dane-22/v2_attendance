import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.FACE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt facial embedding using AES-256-CBC
 * @param embedding - 128-dimensional facial embedding array
 * @returns Encrypted string (IV + encrypted data)
 */
export async function encryptEmbedding(embedding: number[]): Promise<string> {
  try {
    // Convert embedding array to JSON string
    const embeddingString = JSON.stringify(embedding);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(embeddingString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error(`Failed to encrypt embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt facial embedding using AES-256-CBC
 * @param encrypted - Encrypted string (IV + encrypted data)
 * @returns Decrypted 128-dimensional facial embedding array
 */
export async function decryptEmbedding(encrypted: string): Promise<number[]> {
  try {
    // Split IV and encrypted data
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    // Create decipher
    const key = Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    // Decrypt
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse back to array
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Failed to decrypt embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compare two facial embeddings using Euclidean distance
 * @param embedding1 - First facial embedding
 * @param embedding2 - Second facial embedding
 * @returns Euclidean distance (lower = more similar)
 */
export function compareFaces(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }
  
  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

/**
 * Convert Euclidean distance to confidence score (0-1)
 * @param distance - Euclidean distance between embeddings
 * @returns Confidence score (1 = perfect match, 0 = no match)
 */
export function distanceToConfidence(distance: number): number {
  // Typical face-api.js Euclidean distance range is 0-1 for same person
  // Distance < 0.6 is considered a match
  const maxDistance = 1.0;
  const confidence = Math.max(0, 1 - (distance / maxDistance));
  return confidence;
}

/**
 * Register facial embedding for an employee
 * @param employeeId - Employee database ID
 * @param embedding - 128-dimensional facial embedding array
 * @param consentGiven - Whether employee consented to facial recognition
 */
export async function registerFace(
  employeeId: number,
  embedding: number[],
  consentGiven: boolean
): Promise<void> {
  try {
    // Encrypt embedding
    const encryptedEmbedding = await encryptEmbedding(embedding);
    
    // Update employee record
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        faceEmbedding: encryptedEmbedding,
        faceRegisteredAt: new Date(),
        faceConsentGiven: consentGiven,
        faceDataVersion: 'v1'
      }
    });
  } catch (error) {
    throw new Error(`Failed to register face: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify facial embedding against registered employee
 * @param employeeId - Employee database ID to verify against
 * @param embedding - 128-dimensional facial embedding to verify
 * @param threshold - Confidence threshold (default: 0.7)
 * @returns Verification result with match status and confidence score
 */
export async function verifyFace(
  employeeId: number,
  embedding: number[],
  threshold: number = 0.7
): Promise<{ match: boolean; confidence: number; distance: number }> {
  try {
    // Get employee's registered embedding
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        faceEmbedding: true,
        status: true
      }
    });
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    if (!employee.faceEmbedding) {
      throw new Error('No face data registered for this employee');
    }
    
    if (employee.status !== 'Active') {
      throw new Error('Employee is not active');
    }
    
    // Decrypt registered embedding
    const registeredEmbedding = await decryptEmbedding(employee.faceEmbedding);
    
    // Compare embeddings
    const distance = compareFaces(embedding, registeredEmbedding);
    const confidence = distanceToConfidence(distance);
    
    // Check if confidence meets threshold
    const match = confidence >= threshold;
    
    return {
      match,
      confidence,
      distance
    };
  } catch (error) {
    throw new Error(`Failed to verify face: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if employee has facial data registered
 * @param employeeId - Employee database ID
 * @returns Status object with registration info
 */
export async function getFaceRegistrationStatus(employeeId: number): Promise<{
  registered: boolean;
  consentGiven: boolean;
  registeredAt: Date | null;
  version: string | null;
}> {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        faceEmbedding: true,
        faceRegisteredAt: true,
        faceConsentGiven: true,
        faceDataVersion: true
      }
    });
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    return {
      registered: !!employee.faceEmbedding,
      consentGiven: employee.faceConsentGiven || false,
      registeredAt: employee.faceRegisteredAt || null,
      version: employee.faceDataVersion || null
    };
  } catch (error) {
    throw new Error(`Failed to get face registration status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete facial data for an employee
 * @param employeeId - Employee database ID
 */
export async function deleteFaceData(employeeId: number): Promise<void> {
  try {
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        faceEmbedding: null,
        faceRegisteredAt: null,
        faceConsentGiven: false,
        faceDataVersion: null
      }
    });
  } catch (error) {
    throw new Error(`Failed to delete face data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Log face recognition attempt
 * @param employeeId - Employee database ID
 * @param branchCode - Branch code
 * @param scanResult - Result of the scan (SUCCESS, FAILED, NO_MATCH, LIVENESS_FAILED)
 * @param confidence - Confidence score (if available)
 * @param ipAddress - IP address of the request
 * @param userAgent - User agent string
 */
export async function logFaceRecognition(
  employeeId: number,
  branchCode: string,
  scanResult: string,
  confidence?: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.faceRecognitionLog.create({
      data: {
        employeeId,
        branchCode,
        scanResult,
        confidence,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    // Log failure should not throw error
    console.error('Failed to log face recognition:', error);
  }
}

/**
 * Get face recognition logs for an employee
 * @param employeeId - Employee database ID
 * @param limit - Maximum number of logs to return
 * @returns Array of face recognition logs
 */
export async function getFaceRecognitionLogs(employeeId: number, limit: number = 50) {
  try {
    const logs = await prisma.faceRecognitionLog.findMany({
      where: { employeeId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
    
    return logs;
  } catch (error) {
    throw new Error(`Failed to get face recognition logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
