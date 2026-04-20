export interface LogEntry {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 
              'EXPORT' | 'SCAN' | 'APPROVE' | 'REJECT' | 'VIEW';
  entityType: 'EMPLOYEE' | 'ATTENDANCE' | 'PAYROLL' | 'SETTINGS' | 
              'USER' | 'BRANCH' | 'DOCUMENT';
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

export interface LogFilters {
  dateRange: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';
  startDate?: string;
  endDate?: string;
  actionTypes: string[];
  entityTypes: string[];
  userId?: string;
  status: string[];
  searchQuery: string;
}

export type ViewMode = 'table' | 'timeline';
