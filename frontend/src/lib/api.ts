import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  clockIn: (data: { qrCodeData: string; notes?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/clock-in', data),
  clockOut: (data: { qrCodeData: string; notes?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/clock-out', data),
  manualClockIn: (data: { employeeId: number; notes?: string; branch_code?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/manual-clock-in', data),
  manualClockOut: (data: { employeeId: number; notes?: string }) =>
    api.post<ApiResponse<Attendance>>('/attendance/manual-clock-out', data),
  getAudit: (params: { date?: string; branch_code?: string; status?: string }) =>
    api.get<ApiResponse<{ date: string; records: { id: number; employeeId: number; name: string; code: string; branch: string; timeIn: string; timeOut: string; hours: string; status: string; rawStatus: string; }[]; stats: { totalRecords: number; currentlyPresent: number; completedShifts: number; absent: number; present: number; late: number; } }>>('/attendance/audit', { params }),
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
    before?: Record<string, any>;
    after?: Record<string, any>;
    changes?: string[];
  };
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  metadata?: Record<string, any>;
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

export default api;
