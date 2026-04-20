export interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  pendingPayroll: number;
  outstandingPayments: number;
  monthlyGrowth: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  reference?: string;
  projectId?: string;
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  budget: number;
  color: string;
}

export interface ProjectCost {
  projectId: string;
  projectName: string;
  totalBudget: number;
  spentToDate: number;
  laborCosts: number;
  materialCosts: number;
  otherCosts: number;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
}

export interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PayrollSummary {
  period: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
}

export type ViewPeriod = 'monthly' | 'quarterly' | 'yearly';
