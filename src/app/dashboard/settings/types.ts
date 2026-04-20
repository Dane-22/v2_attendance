export interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logo?: string;
}

export interface WorkingHours {
  start: string;
  end: string;
  gracePeriod: number; // minutes
  overtimeThreshold: number; // minutes
}

export interface PayrollSettings {
  payPeriod: 'weekly' | 'biweekly' | 'monthly';
  payDay: number;
  defaultDailyRate: number;
  overtimeMultiplier: number;
  holidayMultiplier: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  attendanceAlerts: boolean;
  payrollAlerts: boolean;
  systemUpdates: boolean;
  lowBalanceAlerts: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  passwordExpiryDays: number;
  sessionTimeout: number; // minutes
  loginAttempts: number;
  requireStrongPasswords: boolean;
}

export interface SystemSettings {
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  autoLogout: boolean;
  dataRetention: number; // days
}

export type SettingsTab = 
  | 'general' 
  | 'appearance' 
  | 'notifications' 
  | 'security' 
  | 'system' 
  | 'payroll';
