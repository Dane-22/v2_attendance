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

export interface BackupSettings {
  emailDelivery: {
    enabled: boolean;
    recipients: string[];
    subject?: string;
    message?: string;
  };
  cloudStorage: {
    enabled: boolean;
    provider: 'AWS_S3' | 'GOOGLE_DRIVE' | 'DROPBOX';
    config?: {
      accessKeyId?: string;
      secretAccessKey?: string;
      region?: string;
      bucket?: string;
      credentials?: any;
      folderId?: string;
    };
  };
  schedule: {
    type: 'DATABASE' | 'FILES' | 'FULL';
    cron: string;
    enabled: boolean;
    retentionDays: number;
  };
}

export interface BackupRecord {
  id: number;
  filename: string;
  type: 'DATABASE' | 'FILES' | 'FULL';
  size: number;
  created_at: Date;
  created_by: number;
  description?: string;
  is_auto: boolean;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'IN_PROGRESS';
  cloud_url?: string;
  cloud_provider?: string;
  download_count: number;
  last_downloaded?: Date;
}

export type SettingsTab = 
  | 'general' 
  | 'appearance' 
  | 'notifications' 
  | 'security' 
  | 'system' 
  | 'payroll'
  | 'backup';
