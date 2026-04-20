'use client';

import { ExpenseCategory } from '../types';
import { formatCurrency } from '../data';
import { PieChart, AlertCircle } from 'lucide-react';

interface ExpenseBreakdownProps {
  categories: ExpenseCategory[];
}

export default function ExpenseBreakdown({ categories }: ExpenseBreakdownProps) {
  const totalExpenses = categories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);

  // Calculate SVG circle segments for donut chart
  const calculateSegments = () => {
    let currentOffset = 0;
    const circumference = 2 * Math.PI * 70; // radius = 70
    
    return categories.map((category) => {
      const percentage = (category.amount / totalExpenses) * 100;
      const segmentLength = (percentage / 100) * circumference;
      const segment = {
        ...category,
        percentage,
        offset: currentOffset,
        dashArray: `${segmentLength} ${circumference - segmentLength}`,
      };
      currentOffset -= segmentLength;
      return segment;
    });
  };

  const segments = calculateSegments();

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Expense Breakdown</h3>
          <p className="text-sm text-gray-400">By category</p>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {segments.map((segment, index) => (
              <circle
                key={index}
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={segment.color}
                strokeWidth="20"
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.offset}
                className="transition-all duration-500"
              />
            ))}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-gray-400">Total</span>
            <span className="text-xl font-bold text-white">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-3">
        {segments.map((category, index) => {
          const isOverBudget = category.amount > category.budget;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <p className="text-sm text-white font-medium">{category.name}</p>
                  <p className="text-xs text-gray-400">
                    {category.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white font-medium">
                  {formatCurrency(category.amount)}
                </p>
                <div className="flex items-center gap-1 justify-end">
                  {isOverBudget && (
                    <AlertCircle className="w-3 h-3 text-red-400" />
                  )}
                  <p className={`text-xs ${isOverBudget ? 'text-red-400' : 'text-gray-500'}`}>
                    Budget: {formatCurrency(category.budget)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget Summary */}
      <div className="mt-6 pt-4 border-t border-[#262626]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Total Budget</span>
          <span className="text-sm text-white font-medium">{formatCurrency(totalBudget)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-400">Remaining</span>
          <span className={`text-sm font-medium ${totalBudget - totalExpenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalBudget - totalExpenses)}
          </span>
        </div>
        <div className="mt-3">
          <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                totalExpenses / totalBudget > 1 ? 'bg-red-400' : 'bg-[#facc15]'
              }`}
              style={{ width: `${Math.min((totalExpenses / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {((totalExpenses / totalBudget) * 100).toFixed(1)}% used
          </p>
        </div>
      </div>
    </div>
  );
}
