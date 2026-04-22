/**
 * Change Detection Utility
 * Detects and summarizes changes between two objects
 */

export interface ChangeDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

/**
 * Configuration for change detection per entity type
 */
const CHANGE_DETECTION_CONFIG: Record<string, string[]> = {
  EMPLOYEE: ['first_name', 'middle_name', 'last_name', 'email', 'department', 'position', 'branch_name', 'status', 'daily_rate', 'has_deductions', 'has_deduction', 'branch_id'],
  ATTENDANCE: ['status', 'check_in', 'check_out', 'notes'],
  PAYROLL: ['days_worked', 'daily_rate', 'basic_pay', 'overtime_hours', 'overtime_amount', 'performance_allowance', 'gross_pay', 'sss_contribution', 'phic_contribution', 'hdmf_contribution', 'cash_advance', 'total_deductions', 'net_pay', 'status'],
  SETTINGS: ['*'], // All settings
  BRANCH: ['branch_name', 'address', 'contact_number', 'status'],
};

/**
 * Get fields to track for a specific entity type
 */
function getFieldsToTrack(entityType: string): string[] {
  const config = CHANGE_DETECTION_CONFIG[entityType];
  return config || ['*']; // Default to all fields if not configured
}

/**
 * Deep compare two values
 */
function deepCompare(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepCompare(item, b[index]));
    }
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => deepCompare(a[key], b[key]));
  }

  return false;
}

/**
 * Detect changes between two objects
 */
export function detectChanges(
  oldObj: any,
  newObj: any,
  entityType?: string
): ChangeDiff[] {
  const changes: ChangeDiff[] = [];
  const fieldsToTrack = entityType ? getFieldsToTrack(entityType) : ['*'];
  const trackAll = fieldsToTrack.includes('*');

  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

  for (const key of allKeys) {
    // Skip if field is not in tracking list (unless tracking all)
    if (!trackAll && !fieldsToTrack.includes(key)) {
      continue;
    }

    const oldValue = oldObj?.[key];
    const newValue = newObj?.[key];

    // Skip if values are the same
    if (deepCompare(oldValue, newValue)) {
      continue;
    }

    // Determine change type
    let changeType: 'added' | 'removed' | 'modified';
    if (oldValue === undefined || oldValue === null) {
      changeType = 'added';
    } else if (newValue === undefined || newValue === null) {
      changeType = 'removed';
    } else {
      changeType = 'modified';
    }

    changes.push({
      field: key,
      oldValue,
      newValue,
      changeType,
    });
  }

  return changes;
}

/**
 * Summarize changes for log description
 */
export function summarizeChanges(changes: ChangeDiff[]): string {
  if (changes.length === 0) return 'No changes';

  const summaries = changes.map(change => {
    switch (change.changeType) {
      case 'added':
        return `Added ${change.field}`;
      case 'removed':
        return `Removed ${change.field}`;
      case 'modified':
        return `Changed ${change.field}`;
    }
  });

  return summaries.join(', ');
}

/**
 * Format change value for display
 */
export function formatChangeValue(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value.toString();
  return String(value);
}

/**
 * Get human-readable field name
 */
export function getFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    first_name: 'First Name',
    middle_name: 'Middle Name',
    last_name: 'Last Name',
    email: 'Email',
    department: 'Department',
    position: 'Position',
    branch_name: 'Branch Name',
    status: 'Status',
    daily_rate: 'Daily Rate',
    has_deductions: 'Has Deductions',
    has_deduction: 'Has Deduction',
    branch_id: 'Branch ID',
    check_in: 'Check In',
    check_out: 'Check Out',
    notes: 'Notes',
    days_worked: 'Days Worked',
    basic_pay: 'Basic Pay',
    overtime_hours: 'Overtime Hours',
    overtime_amount: 'Overtime Amount',
    performance_allowance: 'Performance Allowance',
    gross_pay: 'Gross Pay',
    sss_contribution: 'SSS Contribution',
    phic_contribution: 'PHIC Contribution',
    hdmf_contribution: 'HDMF Contribution',
    cash_advance: 'Cash Advance',
    total_deductions: 'Total Deductions',
    net_pay: 'Net Pay',
    address: 'Address',
    contact_number: 'Contact Number',
  };

  return fieldNames[field] || field;
}
