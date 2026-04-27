export type DocumentType = 'RESUME' | 'SSS' | 'TIN' | 'PHILHEALTH' | 'BIRTH_CERTIFICATE' | 'PDS' | 'COVER_LETTER' | 'APPLICATION_LETTER' | 'CLEARANCE';

export interface Document {
  id: number;
  employeeId: number | null;
  documentType: DocumentType;
  fileName: string;
  originalFileName: string | null;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileHash: string | null;
  isCompressed: boolean;
  uploadedBy: number;
  uploadedAt: string;
  isArchived: boolean;
  archivedAt: string | null;
  archivedBy: number | null;
}

export interface EmployeeSummary {
  id: number;
  employeeCode: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  department: string | null;
  position: string | null;
  branchName: string | null;
  branchCode: string | null;
  status: string | null;
  documentCount: number;
}

export interface DocumentFilter {
  search?: string;
  branch_code?: string;
  documentCount?: string;
}

export interface ViewMode {
  mode: 'grid' | 'list' | 'details';
}
