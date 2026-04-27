import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log('[API] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('[API] Using API_URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Employee {
  id: number;
  employeeCode: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  branchName: string | null;
  branchCode: string | null;
  status: string | null;
  dailyRate: number | null;
  performanceAllowance: number | null;
  hasDeductions: boolean | null;
  hasDeduction: boolean | null;
  profileImage: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Attendance {
  id: number;
  employeeId: number;
  branch_code: string | null;
  date: Date;
  check_in: Date | null;
  check_out: Date | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface PayrollRecord {
  id: number;
  employeeId: number;
  branch_code: string;
  payroll_week_start: Date;
  payroll_week_end: Date;
  week_number: number;
  days_worked: number | null;
  daily_rate: number | null;
  basic_pay: number | null;
  overtime_hours: number | null;
  overtime_amount: number | null;
  performance_allowance: number | null;
  grossPay: number | null;
  sss_contribution: number | null;
  phic_contribution: number | null;
  hdmf_contribution: number | null;
  cash_advance: number | null;
  total_deductions: number | null;
  netPay: number | null;
  status: 'draft' | 'processed';
  createdAt: Date | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    branch_code?: string;
  };
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', credentials),
};

export const employeeApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; department?: string }) =>
    api.get<PaginatedResponse<Employee[]>>('/employees', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<Employee>>(`/employees/${id}`),
  create: (data: Partial<Employee>) =>
    api.post<ApiResponse<Employee>>('/employees', data),
  update: (id: number, data: Partial<Employee>) =>
    api.put<ApiResponse<Employee>>(`/employees/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/employees/${id}`),
  generateQR: (id: number) =>
    api.get<ApiResponse<{ employeeId: number; employeeCode: string | null; qrData: string }>>(`/employees/${id}/qr`),
  uploadProfileImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    return api.post<ApiResponse<Employee>>(`/employees/${id}/upload-profile-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  transfer: (id: number, data: { branchCode: string; reason?: string }) =>
    api.patch<ApiResponse<{ employee: Employee; previousBranch: string | null }>>(`/employees/${id}/transfer`, data),
};

export const attendanceApi = {
  getAll: (params?: { page?: number; limit?: number; employeeId?: number; startDate?: string; endDate?: string }) =>
    api.get<PaginatedResponse<Attendance[]>>('/attendance', { params }),
  getMyAttendance: (params?: { page?: number; limit?: number; employeeId: number; startDate?: string; endDate?: string }) =>
    api.get<PaginatedResponse<Attendance[]>>('/attendance/my', { params }),
  getStats: (params: { employeeId: number; startDate?: string; endDate?: string }) =>
    api.get<ApiResponse<{ period: { start: string; end: string }; stats: { totalDays: number; presentDays: number; absentDays: number; lateDays: number; totalHours: number; overtimeHours: number; averageHoursPerDay: number; } }>>('/attendance/stats', { params }),
  getToday: (params: { employeeId: number }) =>
    api.get<ApiResponse<Attendance | null>>('/attendance/today', { params }),
  clock: (data: { qrCodeData: string; notes?: string; branch_code?: string }) =>
    api.post<ApiResponse<any>>('/attendance/clock', data),
  clockIn: (data: { qrCodeData: string; notes?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/clock-in', data),
  clockOut: (data: { qrCodeData: string; notes?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/clock-out', data),
  manualClockIn: (data: { employeeId: number; notes?: string; branch_code?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/manual-clock-in', data),
  manualClockInWithTransfer: (data: { employeeId: number; notes?: string; branch_code?: string }) =>
    api.post<ApiResponse<{ attendance: Attendance; employee: any; previousBranch: string | null }>>('/attendance/manual-clock-in-with-transfer', data).then(res => res.data),
  manualClockOut: (data: { employeeId: number; notes?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/manual-clock-out', data),
  getAudit: (params: { date?: string; branch_code?: string; status?: string }) =>
    api.get<ApiResponse<{ date: string; records: { id: number; employeeId: number; name: string; code: string; branch: string; timeIn: string; timeOut: string; hours: string; status: string; rawStatus: string; }[]; stats: { totalRecords: number; currentlyPresent: number; completedShifts: number; absent: number; present: number; late: number; } }>>('/attendance/audit', { params }),
  markAbsent: (data: { branch_code: string }) =>
    api.post<ApiResponse<{ markedCount: number }>>('/attendance/mark-absent', data),
  markIndividualAbsent: (employeeId: number) =>
    api.post<ApiResponse<Attendance>>(`/attendance/mark-absent/${employeeId}`),
};

export const payrollApi = {
  getAll: (params?: { page?: number; limit?: number; employeeId?: number; status?: string }) =>
    api.get<PaginatedResponse<PayrollRecord[]>>('/payroll', { params }),
  getMyPayroll: (params?: { page?: number; limit?: number; employeeId: number }) =>
    api.get<PaginatedResponse<PayrollRecord[]>>('/payroll/my', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<PayrollRecord>>(`/payroll/${id}`),
  calculate: (data: { employeeId: number; weekStart: string; weekEnd: string }) =>
    api.post<ApiResponse<PayrollRecord>>('/payroll/calculate', data),
  process: (id: number) =>
    api.post<ApiResponse<PayrollRecord>>(`/payroll/${id}/process`),
  updateStatus: (id: number, status: 'draft' | 'processed') =>
    api.patch<ApiResponse<PayrollRecord>>(`/payroll/${id}/status`, { status }),
};

export const qrApi = {
  decode: (qrData: string) =>
    api.post<ApiResponse<{ decoded: { version: string; employeeCode: string; timestamp?: string; hash?: string }; employee: Employee | null; isValid: boolean }>>('/qr/decode', { qrData }),
  verify: (qrData: string) =>
    api.post<ApiResponse<{ isValid: boolean; isExpired: boolean; employeeExists: boolean; employeeActive: boolean; version: string }>>('/qr/verify', { qrData }),
};

export interface LogEntry {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'SCAN' | 'APPROVE' | 'REJECT' | 'VIEW';
  entityType: 'EMPLOYEE' | 'ATTENDANCE' | 'PAYROLL' | 'SETTINGS' | 'USER' | 'BRANCH' | 'DOCUMENT';
  entityId?: string;
  entityName?: string;
  description: string;
  details?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    changes?: string[];
  };
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  metadata?: Record<string, unknown>;
}

export const logsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    dateRange?: string;
    startDate?: string;
    endDate?: string;
    actionTypes?: string;
    entityTypes?: string;
    userId?: string;
    status?: string;
    searchQuery?: string;
  }) =>
    api.get<ApiResponse<{ logs: LogEntry[]; total: number; page: number; totalPages: number }>>('/logs', { params }),
  create: (data: Partial<LogEntry>) =>
    api.post<ApiResponse<LogEntry>>('/logs', data),
  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/logs/${id}`),
};

export interface Branch {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
}

export interface BranchEmployee {
  id: number;
  name: string;
  avatar: string;
  employeeCode: string | null;
  department: string;
  position: string;
  branchName: string;
  branchCode: string | null;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: string;
  status: string | null;
  attendanceId: number | null;
}

export const branchApi = {
  getAll: () =>
    api.get<ApiResponse<Branch[]>>('/branches'),
  getEmployees: (branchCode: string) =>
    api.get<ApiResponse<BranchEmployee[]>>(`/branches/${branchCode}/employees`),
};

// Notification types
export interface Notification {
  id: number;
  recipient_type: string;
  recipient_id: number;
  type: 'ATTENDANCE' | 'PAYROLL' | 'SYSTEM' | 'SECURITY' | 'PROJECT' | 'FINANCE';
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  is_urgent: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  byType: {
    ATTENDANCE: number;
    PAYROLL: number;
    SYSTEM: number;
    SECURITY: number;
    PROJECT: number;
    FINANCE: number;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  stats: NotificationStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type NotificationFilter = 'ALL' | 'UNREAD' | 'URGENT' | 'ATTENDANCE' | 'PAYROLL' | 'SYSTEM' | 'FINANCE' | 'PROJECT' | 'SECURITY';

export const notificationApi = {
  getNotifications: (params?: { page?: number; limit?: number; filter?: NotificationFilter }) =>
    api.get<ApiResponse<NotificationsResponse>>('/notifications', { params }),

  getUnreadCount: () =>
    api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count'),

  markAsRead: (id: number) =>
    api.put<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<ApiResponse<{ markedCount: number }>>('/notifications/read-all'),

  deleteNotification: (id: number) =>
    api.delete<ApiResponse<void>>(`/notifications/${id}`),

  clearAll: () =>
    api.delete<ApiResponse<{ clearedCount: number }>>('/notifications/clear-all'),

  createTestNotification: (data: { type: string; isUrgent?: boolean }) =>
    api.post<ApiResponse<Notification>>('/notifications/test', data),
};

export interface Document {
  id: number;
  employeeId: number | null;
  documentType: 'RESUME' | 'SSS' | 'TIN' | 'PHILHEALTH' | 'BIRTH_CERTIFICATE' | 'PDS' | 'COVER_LETTER' | 'APPLICATION_LETTER' | 'CLEARANCE';
  fileName: string;
  originalFileName: string | null;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileHash: string | null;
  isCompressed: boolean;
  uploadedBy: number;
  uploadedAt: Date;
  isArchived: boolean;
  archivedAt: Date | null;
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

export const documentApi = {
  getEmployees: (params?: { page?: number; limit?: number; search?: string; branch_code?: string }) =>
    api.get<PaginatedResponse<EmployeeSummary[]>>('/documents/employees', { params }),

  getEmployeeDocuments: (employeeId: number) =>
    api.get<ApiResponse<{ employee: Employee; documents: Document[] }>>(`/documents/employees/${employeeId}`),

  uploadDocument: (employeeId: number, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return api.post<ApiResponse<Document>>(`/documents/employees/${employeeId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  bulkUploadDocuments: (employeeId: number, files: File[], typeMapping: Array<{ index: number; documentType: string }>) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('typeMapping', JSON.stringify(typeMapping));
    return api.post<ApiResponse<Document[]>>(`/documents/employees/${employeeId}/documents/bulk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  downloadDocument: (documentId: number) =>
    api.get(`/documents/${documentId}`, { responseType: 'blob' }),

  deleteDocument: (documentId: number) =>
    api.delete<ApiResponse<null>>(`/documents/${documentId}`),

  archiveDocument: (documentId: number) =>
    api.post<ApiResponse<Document>>(`/documents/${documentId}/archive`),

  unarchiveDocument: (documentId: number) =>
    api.post<ApiResponse<Document>>(`/documents/${documentId}/unarchive`),

  getArchivedDocuments: (params?: { page?: number; limit?: number; employee_id?: number; document_type?: string }) =>
    api.get<PaginatedResponse<Document[]>>(`/documents/archived`, { params }),

  archiveAllEmployeeDocuments: (employeeId: number) =>
    api.post<ApiResponse<{ archivedCount: number }>>(`/documents/employees/${employeeId}/archive-all`),

  getDocumentStats: () =>
    api.get<ApiResponse<{ totalDocuments: number; archivedDocuments: number; documentsByType: any[]; employeesWithDocumentsCount: number }>>('/documents/stats'),
};

// Admin types
export interface Admin {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  branch_code: string | null;
  permissions: any;
  permissions_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminRequest {
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  branch_code?: string;
  permissions?: any;
  permissions_enabled?: boolean;
}

export interface UpdateAdminRequest {
  username?: string;
  password?: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'super_admin';
  branch_code?: string;
  permissions?: any;
  permissions_enabled?: boolean;
}

export const adminApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<PaginatedResponse<Admin[]>>('/admins', { params }),
  create: (data: CreateAdminRequest) =>
    api.post<ApiResponse<Admin>>('/admins', data),
  update: (id: number, data: UpdateAdminRequest) =>
    api.put<ApiResponse<Admin>>(`/admins/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/admins/${id}`),
};

// Branch User types
export interface BranchUser {
  id: number;
  username: string;
  name: string;
  branch_code: string;
  branch_name: string;
  role: string;
  created_at: string;
}

export interface CreateBranchUserRequest {
  password: string;
  branch_name: string;
  address?: string;
  contact_number?: string;
}

export interface UpdateBranchUserRequest {
  password?: string;
  branch_name?: string;
  address?: string;
  contact_number?: string;
}

export const branchUserApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; branch_code?: string }) =>
    api.get<PaginatedResponse<BranchUser[]>>('/branch-users', { params }),
  create: (data: CreateBranchUserRequest) =>
    api.post<ApiResponse<{ admin: any; branch: any }>>('/branch-users', data),
  update: (id: number, data: UpdateBranchUserRequest) =>
    api.put<ApiResponse<{ admin: any; branch: any }>>(`/branch-users/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/branch-users/${id}`),
};

export const branchesApi = {
  getAll: () =>
    api.get<ApiResponse<{ id: number; code: string; name: string }[]>>('/branches'),
};

export default api;
