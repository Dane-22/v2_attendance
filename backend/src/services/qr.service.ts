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
  // V1 URL format: https://jajr.com/attendance/E0001 (also jajr.xandree.com)
  const v1Pattern = /^https:\/\/(?:jajr\.com|jajr\.xandree\.com)\/attendance\/([A-Za-z]\d{3,})$/i;
  // Generic path-based URL: any URL ending with /attendance/E0001
  const pathUrlPattern = /\/attendance\/([A-Za-z]\d{3,})$/i;
  // Query param formats: emp_code=E0001, emp=E0001, code=E0001
  const empCodePattern = /[?&]emp_code=([^&\s]+)/i;
  const altCodePattern = /[?&](?:emp|code|id)=([^&\s]+)/i;
  // Pipe-separated format: JAJR-EMP:id|code|name
  const pipePattern = new RegExp(`^${QR_PREFIX}:(\\d+)\\|([^|]+)\\|(.+)$`, 'i');
  // Hash format: JAJR-EMP:E0001:123456789:abcdef123456
  const v2Pattern = new RegExp(`^${QR_PREFIX}:(\\w+):(\\d+):([a-f0-9]{16})$`, 'i');
  // Simple code format: E0001, W0001
  const simplePattern = /^([A-Za-z]\d{3,})$/;

  // Try V1 URL
  const v1Match = qrData.match(v1Pattern) || qrData.match(pathUrlPattern);
  if (v1Match) {
    return {
      version: 'V1',
      employeeCode: v1Match[1].toUpperCase()
    };
  }

  // Try emp_code query param
  const empCodeMatch = qrData.match(empCodePattern);
  if (empCodeMatch) {
    return {
      version: 'V1',
      employeeCode: decodeURIComponent(empCodeMatch[1]).toUpperCase()
    };
  }

  // Try alternative query params
  const altMatch = qrData.match(altCodePattern);
  if (altMatch) {
    return {
      version: 'V1',
      employeeCode: decodeURIComponent(altMatch[1]).toUpperCase()
    };
  }

  // Try pipe format
  const pipeMatch = qrData.match(pipePattern);
  if (pipeMatch) {
    return {
      version: 'V2',
      employeeCode: pipeMatch[2].trim(),
      employeeId: parseInt(pipeMatch[1], 10),
      employeeName: pipeMatch[3].trim()
    };
  }

  // Try V2 hash format
  const v2Match = qrData.match(v2Pattern);
  if (v2Match) {
    return {
      version: 'V2',
      employeeCode: v2Match[1].toUpperCase(),
      timestamp: v2Match[2],
      hash: v2Match[3]
    };
  }

  // Try simple format (just employee code)
  const simpleMatch = qrData.match(simplePattern);
  if (simpleMatch) {
    return {
      version: 'V1',
      employeeCode: simpleMatch[1].toUpperCase()
    };
  }

  // Fallback: anything starting with JAJR-EMP:
  if (qrData.toUpperCase().startsWith(`${QR_PREFIX}:`)) {
    const parts = qrData.split(':');
    if (parts.length >= 2) {
      return {
        version: 'V2',
        employeeCode: parts[1].trim().toUpperCase()
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
