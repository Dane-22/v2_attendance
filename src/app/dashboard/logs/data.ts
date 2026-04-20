import { LogEntry } from './types';

export const mockLogs: LogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-04-20T12:45:00Z',
    user: { id: '1', name: 'Admin Super', role: 'Super Admin' },
    actionType: 'CREATE',
    entityType: 'EMPLOYEE',
    entityId: 'E0100',
    entityName: 'Marc Justin Arzadan',
    description: 'Created new employee record with Worker position',
    ipAddress: '192.168.1.100',
    status: 'SUCCESS',
    metadata: { branch: 'Main Office' }
  },
  {
    id: 'log-002',
    timestamp: '2026-04-20T12:30:00Z',
    user: { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
    actionType: 'UPDATE',
    entityType: 'EMPLOYEE',
    entityId: 'E0002',
    entityName: 'Cesar Abubo',
    description: 'Updated daily rate from ₱500.00 to ₱550.00',
    details: {
      before: { dailyRate: 500 },
      after: { dailyRate: 550 }
    },
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  },
  {
    id: 'log-003',
    timestamp: '2026-04-20T12:15:00Z',
    user: { id: '3', name: 'Kyle Arrieta', role: 'Worker' },
    actionType: 'SCAN',
    entityType: 'ATTENDANCE',
    entityId: 'att-456',
    entityName: 'Time In - Site A',
    description: 'Scanned QR code for time in at Site A - JAJR Construction',
    ipAddress: '192.168.1.110',
    status: 'SUCCESS'
  },
  {
    id: 'log-004',
    timestamp: '2026-04-20T11:45:00Z',
    user: { id: '1', name: 'Admin Super', role: 'Super Admin' },
    actionType: 'EXPORT',
    entityType: 'PAYROLL',
    entityName: 'April 2026 Payroll',
    description: 'Exported payroll report for period April 1-15, 2026',
    ipAddress: '192.168.1.100',
    status: 'SUCCESS'
  },
  {
    id: 'log-005',
    timestamp: '2026-04-20T11:30:00Z',
    user: { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
    actionType: 'DELETE',
    entityType: 'EMPLOYEE',
    entityId: 'E0080',
    entityName: 'Jericho Baltazar',
    description: 'Deleted employee record (reason: duplicate entry)',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  },
  {
    id: 'log-006',
    timestamp: '2026-04-20T11:00:00Z',
    user: { id: '1', name: 'Admin Super', role: 'Super Admin' },
    actionType: 'LOGIN',
    entityType: 'USER',
    entityName: 'System Login',
    description: 'User logged in from Chrome on Windows',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'SUCCESS'
  },
  {
    id: 'log-007',
    timestamp: '2026-04-20T10:45:00Z',
    user: { id: '4', name: 'Gin Tyrone Aguino', role: 'Worker' },
    actionType: 'VIEW',
    entityType: 'ATTENDANCE',
    entityName: 'Attendance History',
    description: 'Viewed personal attendance records for March 2026',
    ipAddress: '192.168.1.115',
    status: 'SUCCESS'
  },
  {
    id: 'log-008',
    timestamp: '2026-04-20T10:30:00Z',
    user: { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
    actionType: 'APPROVE',
    entityType: 'ATTENDANCE',
    entityId: 'att-789',
    entityName: 'Attendance Correction',
    description: 'Approved attendance correction for Santi Abubo - April 19, 2026',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  },
  {
    id: 'log-009',
    timestamp: '2026-04-20T10:15:00Z',
    user: { id: '1', name: 'Admin Super', role: 'Super Admin' },
    actionType: 'UPDATE',
    entityType: 'SETTINGS',
    entityName: 'System Settings',
    description: 'Updated default working hours from 8:00 AM - 5:00 PM to 7:00 AM - 4:00 PM',
    details: {
      before: { workStart: '08:00', workEnd: '17:00' },
      after: { workStart: '07:00', workEnd: '16:00' }
    },
    ipAddress: '192.168.1.100',
    status: 'SUCCESS'
  },
  {
    id: 'log-010',
    timestamp: '2026-04-20T10:00:00Z',
    user: { id: '5', name: 'Santi Abubo', role: 'Worker' },
    actionType: 'SCAN',
    entityType: 'ATTENDANCE',
    entityId: 'att-321',
    entityName: 'Time In - Site B',
    description: 'Scanned QR code for time in at Site B - Manila Project',
    ipAddress: '192.168.1.120',
    status: 'FAILED',
    metadata: { reason: 'Outside geofence area' }
  },
  {
    id: 'log-011',
    timestamp: '2026-04-20T09:30:00Z',
    user: { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
    actionType: 'CREATE',
    entityType: 'BRANCH',
    entityId: 'branch-003',
    entityName: 'Cebu Branch',
    description: 'Created new branch location: Cebu City, Philippines',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  },
  {
    id: 'log-012',
    timestamp: '2026-04-20T09:00:00Z',
    user: { id: '1', name: 'Admin Super', role: 'Super Admin' },
    actionType: 'REJECT',
    entityType: 'DOCUMENT',
    entityId: 'doc-555',
    entityName: 'Leave Request - Marlon Aguilar',
    description: 'Rejected leave request: Insufficient leave balance',
    ipAddress: '192.168.1.100',
    status: 'SUCCESS'
  },
  {
    id: 'log-013',
    timestamp: '2026-04-20T08:45:00Z',
    user: { id: '6', name: 'Marlon Aguilar', role: 'Worker' },
    actionType: 'LOGIN',
    entityType: 'USER',
    entityName: 'Mobile App Login',
    description: 'User logged in from JAJR Attendance Mobile App',
    ipAddress: '192.168.1.125',
    userAgent: 'JAJR-App/1.0 (Android 14)',
    status: 'SUCCESS'
  },
  {
    id: 'log-014',
    timestamp: '2026-04-20T08:30:00Z',
    user: { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
    actionType: 'UPDATE',
    entityType: 'EMPLOYEE',
    entityId: 'E0078',
    entityName: 'Kyle Arrieta',
    description: 'Changed position from Worker to Admin',
    details: {
      before: { position: 'Worker' },
      after: { position: 'Admin' }
    },
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  },
  {
    id: 'log-015',
    timestamp: '2026-04-19T17:30:00Z',
    user: { id: '1', name: 'Admin Super', role: 'Super Admin' },
    actionType: 'LOGOUT',
    entityType: 'USER',
    entityName: 'System Logout',
    description: 'User logged out (Session expired)',
    ipAddress: '192.168.1.100',
    status: 'SUCCESS'
  },
  {
    id: 'log-016',
    timestamp: '2026-04-19T16:45:00Z',
    user: { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
    actionType: 'EXPORT',
    entityType: 'ATTENDANCE',
    entityName: 'April Attendance Report',
    description: 'Exported attendance report for all branches - April 1-19, 2026',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  },
  {
    id: 'log-017',
    timestamp: '2026-04-19T15:30:00Z',
    user: { id: '3', name: 'Kyle Arrieta', role: 'Worker' },
    actionType: 'SCAN',
    entityType: 'ATTENDANCE',
    entityId: 'att-654',
    entityName: 'Time Out - Site A',
    description: 'Scanned QR code for time out at Site A',
    ipAddress: '192.168.1.110',
    status: 'SUCCESS'
  },
  {
    id: 'log-018',
    timestamp: '2026-04-19T14:00:00Z',
    user: { id: '1', name: 'Admin Super', role: 'Super Admin' },
    actionType: 'CREATE',
    entityType: 'USER',
    entityId: 'user-007',
    entityName: 'Marc Justin Arzadan',
    description: 'Created new admin user with Super Admin role',
    ipAddress: '192.168.1.100',
    status: 'SUCCESS'
  },
  {
    id: 'log-019',
    timestamp: '2026-04-19T13:30:00Z',
    user: { id: '7', name: 'Cesar Abubo', role: 'Worker' },
    actionType: 'VIEW',
    entityType: 'PAYROLL',
    entityName: 'Payslip March 2026',
    description: 'Viewed and downloaded March 2026 payslip',
    ipAddress: '192.168.1.130',
    status: 'SUCCESS'
  },
  {
    id: 'log-020',
    timestamp: '2026-04-19T12:00:00Z',
    user: { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
    actionType: 'UPDATE',
    entityType: 'EMPLOYEE',
    entityId: 'E0002',
    entityName: 'Cesar Abubo',
    description: 'Reset password to default (jajrconstruction)',
    ipAddress: '192.168.1.105',
    status: 'SUCCESS'
  }
];

export const users = [
  { id: '1', name: 'Admin Super', role: 'Super Admin' },
  { id: '2', name: 'Elaine Aguilar', role: 'Admin' },
  { id: '3', name: 'Kyle Arrieta', role: 'Worker' },
  { id: '4', name: 'Gin Tyrone Aguino', role: 'Worker' },
  { id: '5', name: 'Santi Abubo', role: 'Worker' },
  { id: '6', name: 'Marlon Aguilar', role: 'Worker' },
  { id: '7', name: 'Cesar Abubo', role: 'Worker' },
];
