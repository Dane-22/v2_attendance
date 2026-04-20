'use client';

import { PayrollSummary as PayrollSummaryType } from '../types';
import { formatCurrency } from '../data';
import { 
  Users, 
  Wallet, 
  MinusCircle, 
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface PayrollSummaryProps {
  payroll: PayrollSummaryType;
}

const statusConfig = {
  PENDING: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending Processing' },
  PROCESSING: { icon: AlertCircle, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Processing' },
  COMPLETED: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Completed' },
};

export default function PayrollSummary({ payroll }: PayrollSummaryProps) {
  const status = statusConfig[payroll.status];
  const StatusIcon = status.icon;

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Payroll Summary</h3>
            <p className="text-sm text-gray-400">{payroll.period}</p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.bg} ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Employees</span>
          </div>
          <p className="text-2xl font-bold text-white">{payroll.totalEmployees}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Gross Pay</span>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(payroll.totalGrossPay)}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MinusCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Deductions</span>
          </div>
          <p className="text-xl font-bold text-red-400">-{formatCurrency(payroll.totalDeductions)}</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#facc15]" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Net Pay</span>
          </div>
          <p className="text-xl font-bold text-[#facc15]">{formatCurrency(payroll.totalNetPay)}</p>
        </div>
      </div>

      {/* Breakdown Bar */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Payroll Breakdown</span>
          <span className="text-gray-400">
            Deductions: {((payroll.totalDeductions / payroll.totalGrossPay) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-[#262626] rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-green-400"
            style={{ width: `${(payroll.totalNetPay / payroll.totalGrossPay) * 100}%` }}
          />
          <div 
            className="h-full bg-red-400"
            style={{ width: `${(payroll.totalDeductions / payroll.totalGrossPay) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-gray-400">Net Pay</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-gray-400">Deductions</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
        {payroll.status === 'PENDING' ? 'Process Payroll' : 'View Details'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
