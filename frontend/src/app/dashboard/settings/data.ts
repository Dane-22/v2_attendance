import { 
  CompanySettings, 
  WorkingHours, 
  PayrollSettings, 
  NotificationSettings, 
  SecuritySettings, 
  SystemSettings 
} from './types';

export const defaultCompanySettings: CompanySettings = {
  companyName: 'JAJR Construction',
  address: '123 Construction Ave, Manila, Philippines',
  phone: '+63 2 8123 4567',
  email: 'info@jajr-construction.com',
  website: 'www.jajr-construction.com',
  taxId: 'VAT-123-456-789',
};

export const defaultWorkingHours: WorkingHours = {
  start: '08:00',
  end: '17:00',
  gracePeriod: 15,
  overtimeThreshold: 30,
};

export const defaultPayrollSettings: PayrollSettings = {
  payPeriod: 'biweekly',
  payDay: 15,
  defaultDailyRate: 550,
  overtimeMultiplier: 1.5,
  holidayMultiplier: 2.0,
};

export const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  attendanceAlerts: true,
  payrollAlerts: true,
  systemUpdates: true,
  lowBalanceAlerts: true,
};

export const defaultSecuritySettings: SecuritySettings = {
  twoFactorAuth: false,
  passwordExpiryDays: 90,
  sessionTimeout: 30,
  loginAttempts: 5,
  requireStrongPasswords: true,
};

export const defaultSystemSettings: SystemSettings = {
  timezone: 'Asia/Manila',
  dateFormat: 'MM/DD/YYYY',
  currency: 'PHP',
  language: 'en',
  autoLogout: true,
  dataRetention: 365,
};

export const timezones = [
  { value: 'Asia/Manila', label: 'Manila (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
  { value: 'UTC', label: 'UTC' },
];

export const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

export const currencies = [
  { value: 'PHP', label: 'PHP - Philippine Peso', symbol: '₱' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
];

export const languages = [
  { value: 'en', label: 'English' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese' },
];
