'use client';

import { useState } from 'react';
import { CashFlowData, ViewPeriod } from '../types';
import { formatCurrency } from '../data';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

interface CashFlowChartProps {
  data: CashFlowData[];
}

export default function CashFlowChart({ data }: CashFlowChartProps) {
  const [period, setPeriod] = useState<ViewPeriod>('monthly');
  const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses)));

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Cash Flow Overview</h3>
            <p className="text-sm text-gray-400">Income vs Expenses trend</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['monthly', 'quarterly', 'yearly'] as ViewPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-[#facc15] text-black'
                  : 'bg-[#262626] text-gray-400 hover:text-white'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-sm text-gray-400">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-sm text-gray-400">Expenses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#facc15]" />
          <span className="text-sm text-gray-400">Net</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 font-medium w-12">{item.month}</span>
              <div className="flex-1 mx-4">
                <div className="flex items-center gap-2">
                  {/* Income Bar */}
                  <div
                    className="h-6 bg-green-400 rounded-l-lg transition-all duration-500"
                    style={{ width: `${(item.income / maxValue) * 40}%` }}
                    title={`Income: ${formatCurrency(item.income)}`}
                  />
                  {/* Expense Bar */}
                  <div
                    className="h-6 bg-red-400 rounded-r-lg transition-all duration-500"
                    style={{ width: `${(item.expenses / maxValue) * 40}%` }}
                    title={`Expenses: ${formatCurrency(item.expenses)}`}
                  />
                </div>
              </div>
              <div className="text-right w-32">
                <span className={`text-sm font-medium ${item.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(item.net)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#262626]">
        {(() => {
          const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
          const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
          const totalNet = data.reduce((sum, d) => sum + d.net, 0);
          
          return [
            { label: 'Total Income', value: formatCurrency(totalIncome), color: 'text-green-400' },
            { label: 'Total Expenses', value: formatCurrency(totalExpenses), color: 'text-red-400' },
            { label: 'Net Profit', value: formatCurrency(totalNet), color: totalNet >= 0 ? 'text-[#facc15]' : 'text-red-400' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color} mt-1`}>{stat.value}</p>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
