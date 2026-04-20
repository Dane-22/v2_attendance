import crypto from 'crypto';
import { QRCodeData } from '../types/api.types';

const QR_PREFIX = process.env.QR_PREFIX || 'JAJR-EMP';

export function generateQRCodeData(employeeCode: string, version: 'V1' | 'V2' = 'V2'): string {
  if (version === 'V1') {
    return `https://jajr.com/attendance/${employeeCode}`;
  }

  const timestamp = Date.now().toString();
  const hash = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
    .update(`${employeeCode}:${timestamp}`)
    .digest('hex')
    .substring(0, 16);

  return `${QR_PREFIX}:${employeeCode}:${timestamp}:${hash}`;
}

export function decodeQRCodeData(qrData: string): QRCodeData {
  const v1Pattern = /^https:\/\/jajr\.com\/attendance\/(\w+)$/;
  const v2Pattern = new RegExp(`^${QR_PREFIX}:(\\w+):(\\d+):([a-f0-9]{16})$`);
  // Pipe-separated format: JAJR-EMP:id|code|name
  const pipePattern = new RegExp(`^${QR_PREFIX}:(\\d+)\\|([^|]+)\\|(.+)$`);

  const v1Match = qrData.match(v1Pattern);
  if (v1Match) {
    return {
      version: 'V1',
      employeeCode: v1Match[1]
    };
  }

  const v2Match = qrData.match(v2Pattern);
  if (v2Match) {
    return {
      version: 'V2',
      employeeCode: v2Match[1],
      timestamp: v2Match[2],
      hash: v2Match[3]
    };
  }

  // Handle pipe-separated format from employee QR codes
  const pipeMatch = qrData.match(pipePattern);
  if (pipeMatch) {
    return {
      version: 'V2',
      employeeCode: pipeMatch[2], // Return the employee code (second field)
      employeeId: parseInt(pipeMatch[1], 10),
      employeeName: pipeMatch[3]
    };
  }

  if (qrData.startsWith(`${QR_PREFIX}:`)) {
    const parts = qrData.split(':');
    if (parts.length >= 2) {
      return {
        version: 'V2',
        employeeCode: parts[1]
      };
    }
  }

  throw new Error('Invalid QR code format');
}

export function verifyQRCodeData(qrData: string, maxAgeMinutes: number = 5): boolean {
  try {
    const decoded = decodeQRCodeData(qrData);

    if (decoded.version === 'V1') {
      return true;
    }

    if (decoded.timestamp && decoded.hash) {
      const timestamp = parseInt(decoded.timestamp);
      const now = Date.now();
      const ageMs = now - timestamp;
      const maxAgeMs = maxAgeMinutes * 60 * 1000;

      if (ageMs > maxAgeMs) {
        return false;
      }

      const expectedHash = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
        .update(`${decoded.employeeCode}:${decoded.timestamp}`)
        .digest('hex')
        .substring(0, 16);

      return decoded.hash === expectedHash;
    }

    return true;
  } catch {
    return false;
  }
}

export function extractEmployeeCode(qrData: string): string | null {
  try {
    const decoded = decodeQRCodeData(qrData);
    return decoded.employeeCode;
  } catch {
    return null;
  }
}
