export type AuthUserType = 'admin' | 'branch';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin' | 'branch';
  branch_code: string | null;
  branch_name?: string | null;
  permissions?: unknown;
  permissions_enabled?: boolean;
  profileImage?: string | null;
  employeeId?: number | null;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
  userType: AuthUserType;
}

export interface AuthState {
  isAuthenticated: boolean;
  isHydrated: boolean;
  userType: AuthUserType | null;
  user: AuthUser | null;
  token: string | null;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  branch_code: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'completed' | null;
  notes: string | null;
}

export interface AttendanceStatsSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
}

export interface AttendanceAuditRecord {
  id: number;
  employeeId: number;
  name: string;
  code: string;
  profileImage: string | null;
  branch: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  status: string;
  rawStatus: string;
}

export interface NotificationItem {
  id: number;
  recipient_type: string;
  recipient_id: number;
  type: 'ATTENDANCE' | 'PAYROLL' | 'SYSTEM' | 'SECURITY' | 'PROJECT' | 'FINANCE' | 'OVERTIME_REQUEST';
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
  byType: Record<string, number>;
}

export interface NotificationsPayload {
  notifications: NotificationItem[];
  stats: NotificationStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BranchSummary {
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
  profileImage: string | null;
  employeeCode: string | null;
  department: string;
  position: string;
  branchName: string;
  branchCode?: string | null;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: string;
  status: string | null;
  attendanceId: number | null;
}

export interface SettingsPayload {
  companyName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  taxId?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  gracePeriod?: number | null;
  overtimeThreshold?: number | null;
  emailNotifications?: boolean | null;
  pushNotifications?: boolean | null;
  attendanceAlerts?: boolean | null;
  payrollAlerts?: boolean | null;
  systemUpdates?: boolean | null;
  lowBalanceAlerts?: boolean | null;
  twoFactorAuth?: boolean | null;
  passwordExpiryDays?: number | null;
  sessionTimeout?: number | null;
  loginAttempts?: number | null;
  requireStrongPasswords?: boolean | null;
  timezone?: string | null;
  dateFormat?: string | null;
  currency?: string | null;
  language?: string | null;
  autoLogout?: boolean | null;
  dataRetention?: number | null;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'limited';
}

export interface LocationError {
  code?: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

export interface LocationValidationResult {
  isValid: boolean;
  distance: number;
  withinRadius: boolean;
  accuracy: number;
  message: string;
}
