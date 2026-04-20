export interface Document {
  id: string;
  name: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'OTHER';
  category: 'CONTRACT' | 'INVOICE' | 'REPORT' | 'PAYSLIP' | 'PERMIT' | 'OTHER';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  projectId?: string;
  projectName?: string;
  employeeId?: string;
  employeeName?: string;
  url: string;
  isArchived: boolean;
}

export interface DocumentCategory {
  id: string;
  name: string;
  count: number;
  icon: string;
  color: string;
}

export type DocumentSortBy = 'name' | 'date' | 'size';
export type DocumentViewMode = 'grid' | 'list';
