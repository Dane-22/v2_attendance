import { QRCodeData } from '../types/api.types';
export declare function generateQRCodeData(employeeCode: string, version?: 'V1' | 'V2'): string;
export declare function decodeQRCodeData(qrData: string): QRCodeData;
export declare function verifyQRCodeData(qrData: string, maxAgeMinutes?: number): boolean;
export declare function extractEmployeeCode(qrData: string): string | null;
//# sourceMappingURL=qr.service.d.ts.map