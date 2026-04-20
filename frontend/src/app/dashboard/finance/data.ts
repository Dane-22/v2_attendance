import { FinancialStats, Transaction, ExpenseCategory, ProjectCost, CashFlowData, PayrollSummary } from './types';

export const mockFinancialStats: FinancialStats = {
  totalRevenue: 1250000,
  totalExpenses: 875000,
  netIncome: 375000,
  pendingPayroll: 185000,
  outstandingPayments: 125000,
  monthlyGrowth: 12.5,
};

export const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    date: '2026-04-20',
    type: 'INCOME',
    category: 'Project Payment',
    description: 'Manila Tower Project - Milestone 3',
    amount: 250000,
    status: 'COMPLETED',
    reference: 'INV-2026-001',
    projectId: 'proj-001',
  },
  {
    id: 'txn-002',
    date: '2026-04-19',
    type: 'EXPENSE',
    category: 'Materials',
    description: 'Steel beams and concrete - Supplier A',
    amount: 45000,
    status: 'COMPLETED',
    reference: 'PO-2026-045',
  },
  {
    id: 'txn-003',
    date: '2026-04-18',
    type: 'EXPENSE',
    category: 'Payroll',
    description: 'Bi-weekly payroll - April 1-15',
    amount: 185000,
    status: 'COMPLETED',
  },
  {
    id: 'txn-004',
    date: '2026-04-17',
    type: 'INCOME',
    category: 'Project Payment',
    description: 'Cebu Commercial Complex - Phase 1',
    amount: 180000,
    status: 'COMPLETED',
    reference: 'INV-2026-002',
    projectId: 'proj-002',
  },
  {
    id: 'txn-005',
    date: '2026-04-16',
    type: 'EXPENSE',
    category: 'Equipment',
    description: 'Crane rental - 2 weeks',
    amount: 28000,
    status: 'COMPLETED',
    reference: 'REN-2026-012',
  },
  {
    id: 'txn-006',
    date: '2026-04-15',
    type: 'EXPENSE',
    category: 'Utilities',
    description: 'Site electricity and water - April',
    amount: 8500,
    status: 'COMPLETED',
  },
  {
    id: 'txn-007',
    date: '2026-04-14',
    type: 'EXPENSE',
    category: 'Transportation',
    description: 'Fuel and logistics - Site A & B',
    amount: 12000,
    status: 'COMPLETED',
  },
  {
    id: 'txn-008',
    date: '2026-04-13',
    type: 'INCOME',
    category: 'Consultation',
    description: 'Architectural consultation fees',
    amount: 35000,
    status: 'COMPLETED',
  },
  {
    id: 'txn-009',
    date: '2026-04-12',
    type: 'EXPENSE',
    category: 'Materials',
    description: 'Plumbing supplies - Manila Tower',
    amount: 22000,
    status: 'PENDING',
    projectId: 'proj-001',
  },
  {
    id: 'txn-010',
    date: '2026-04-11',
    type: 'EXPENSE',
    category: 'Others',
    description: 'Office supplies and administrative',
    amount: 3500,
    status: 'COMPLETED',
  },
  {
    id: 'txn-011',
    date: '2026-04-10',
    type: 'INCOME',
    category: 'Project Payment',
    description: 'Residential Complex - Down payment',
    amount: 150000,
    status: 'PENDING',
    reference: 'INV-2026-003',
    projectId: 'proj-003',
  },
  {
    id: 'txn-012',
    date: '2026-04-09',
    type: 'EXPENSE',
    category: 'Equipment',
    description: 'Safety equipment purchase',
    amount: 15000,
    status: 'COMPLETED',
  },
];

export const mockExpenseCategories: ExpenseCategory[] = [
  { name: 'Payroll', amount: 520000, budget: 550000, color: '#facc15' },
  { name: 'Materials', amount: 180000, budget: 200000, color: '#3b82f6' },
  { name: 'Equipment', amount: 85000, budget: 100000, color: '#8b5cf6' },
  { name: 'Utilities', amount: 45000, budget: 40000, color: '#06b6d4' },
  { name: 'Transportation', amount: 35000, budget: 30000, color: '#f97316' },
  { name: 'Others', amount: 10000, budget: 15000, color: '#6b7280' },
];

export const mockProjectCosts: ProjectCost[] = [
  {
    projectId: 'proj-001',
    projectName: 'Manila Tower Construction',
    totalBudget: 2500000,
    spentToDate: 1850000,
    laborCosts: 980000,
    materialCosts: 720000,
    otherCosts: 150000,
    progress: 74,
    status: 'ACTIVE',
  },
  {
    projectId: 'proj-002',
    projectName: 'Cebu Commercial Complex',
    totalBudget: 1800000,
    spentToDate: 920000,
    laborCosts: 480000,
    materialCosts: 350000,
    otherCosts: 90000,
    progress: 51,
    status: 'ACTIVE',
  },
  {
    projectId: 'proj-003',
    projectName: 'Davao Residential Estate',
    totalBudget: 1200000,
    spentToDate: 180000,
    laborCosts: 120000,
    materialCosts: 45000,
    otherCosts: 15000,
    progress: 15,
    status: 'ACTIVE',
  },
  {
    projectId: 'proj-004',
    projectName: 'Quezon City Office Building',
    totalBudget: 3200000,
    spentToDate: 3100000,
    laborCosts: 1650000,
    materialCosts: 1200000,
    otherCosts: 250000,
    progress: 97,
    status: 'COMPLETED',
  },
];

export const mockCashFlow: CashFlowData[] = [
  { month: 'Jan', income: 850000, expenses: 620000, net: 230000 },
  { month: 'Feb', income: 920000, expenses: 680000, net: 240000 },
  { month: 'Mar', income: 1100000, expenses: 750000, net: 350000 },
  { month: 'Apr', income: 1250000, expenses: 875000, net: 375000 },
  { month: 'May', income: 1180000, expenses: 820000, net: 360000 },
  { month: 'Jun', income: 1350000, expenses: 900000, net: 450000 },
];

export const mockPayrollSummary: PayrollSummary = {
  period: 'April 16-30, 2026',
  totalEmployees: 78,
  totalGrossPay: 198500,
  totalDeductions: 24500,
  totalNetPay: 174000,
  status: 'PENDING',
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};
