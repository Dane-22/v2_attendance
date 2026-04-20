'use client';

import { FinancialStats } from '../types';
import { formatCurrency, formatPercentage } from '../data';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface FinanceStatsProps {
  stats: FinancialStats;
}

export default function FinanceStats({ stats }: FinanceStatsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: formatPercentage(stats.monthlyGrowth),
      isPositive: stats.monthlyGrowth >= 0,
      icon: DollarSign,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/30',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      change: 'Budget: ' + formatCurrency(stats.totalExpenses * 1.15),
      isPositive: false,
      icon: CreditCard,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
      borderColor: 'border-red-500/30',
    },
    {
      title: 'Net Income',
      value: formatCurrency(stats.netIncome),
      change: ((stats.netIncome / stats.totalRevenue) * 100).toFixed(1) + '% margin',
      isPositive: stats.netIncome > 0,
      icon: TrendingUp,
      iconBg: 'bg-[#facc15]/10',
      iconColor: 'text-[#facc15]',
      borderColor: 'border-[#facc15]/30',
    },
    {
      title: 'Pending Payroll',
      value: formatCurrency(stats.pendingPayroll),
      change: 'Due: Apr 30, 2026',
      isPositive: true,
      icon: Wallet,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-[#141414] rounded-xl border ${card.borderColor} p-6 hover:border-[#404040] transition-all duration-300 hover:shadow-lg hover:shadow-${card.iconColor.split('-')[1]}-500/5`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl lg:text-3xl font-bold text-white mt-2">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.iconBg} border ${card.borderColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {card.isPositive ? (
                <ArrowUpRight className={`w-4 h-4 ${card.iconColor}`} />
              ) : (
                <ArrowDownRight className={`w-4 h-4 ${card.iconColor}`} />
              )}
              <span className={`text-sm ${card.iconColor}`}>{card.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
