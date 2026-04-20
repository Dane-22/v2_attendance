'use client';

import { useState } from 'react';
import { 
  mockFinancialStats, 
  mockTransactions, 
  mockExpenseCategories, 
  mockCashFlow, 
  mockPayrollSummary,
  mockProjectCosts 
} from './data';
import FinanceStats from './components/FinanceStats';
import CashFlowChart from './components/CashFlowChart';
import ExpenseBreakdown from './components/ExpenseBreakdown';
import RecentTransactions from './components/RecentTransactions';
import BudgetTracker from './components/BudgetTracker';
import PayrollSummary from './components/PayrollSummary';
import ProjectCosts from './components/ProjectCosts';
import { 
  DollarSign, 
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  Filter
} from 'lucide-react';

export default function FinancePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('month');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    // Simulate export functionality
    alert('Exporting financial report...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Finance <span className="text-[#facc15]">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Financial overview and analytics for your construction projects
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15] text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white hover:border-[#404040] transition-all ${
              isRefreshing ? 'animate-pulse' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <FinanceStats stats={mockFinancialStats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Chart */}
          <CashFlowChart data={mockCashFlow} />
          
          {/* Recent Transactions */}
          <RecentTransactions transactions={mockTransactions} />
          
          {/* Project Costs */}
          <ProjectCosts projects={mockProjectCosts} />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Expense Breakdown */}
          <ExpenseBreakdown categories={mockExpenseCategories} />
          
          {/* Budget Tracker */}
          <BudgetTracker categories={mockExpenseCategories} />
          
          {/* Payroll Summary */}
          <PayrollSummary payroll={mockPayrollSummary} />
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-[#262626]">
        <p>Financial data is updated in real-time. Last updated: {new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</p>
      </div>
    </div>
  );
}
