'use client';

import { ExpenseCategory } from '../types';
import { formatCurrency } from '../data';
import { Target, AlertTriangle } from 'lucide-react';

interface BudgetTrackerProps {
  categories: ExpenseCategory[];
}

export default function BudgetTracker({ categories }: BudgetTrackerProps) {
  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Target className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Budget Tracker</h3>
          <p className="text-sm text-gray-400">Budget vs Actual spending</p>
        </div>
      </div>

      <div className="space-y-5">
        {categories.map((category, index) => {
          const percentage = (category.amount / category.budget) * 100;
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage > 80 && !isOverBudget;

          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-white font-medium">{category.name}</span>
                  {isOverBudget && (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    / {formatCurrency(category.budget)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget ? 'bg-red-400' : 
                    isNearLimit ? 'bg-yellow-400' : 
                    'bg-green-400'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              {/* Status Text */}
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${
                  isOverBudget ? 'text-red-400' : 
                  isNearLimit ? 'text-yellow-400' : 
                  'text-gray-500'
                }`}>
                  {isOverBudget ? `${(percentage - 100).toFixed(1)}% over budget` :
                   isNearLimit ? 'Near budget limit' :
                   `${(100 - percentage).toFixed(1)}% remaining`}
                </span>
                <span className="text-xs text-gray-500">
                  {percentage.toFixed(0)}% used
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-[#262626]">
        {(() => {
          const totalSpent = categories.reduce((sum, cat) => sum + cat.amount, 0);
          const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
          const overallPercentage = (totalSpent / totalBudget) * 100;
          
          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Overall Budget</span>
                <span className={`text-sm font-bold ${overallPercentage > 100 ? 'text-red-400' : 'text-white'}`}>
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </span>
              </div>
              <div className="h-3 bg-[#262626] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallPercentage > 100 ? 'bg-red-400' : 'bg-[#facc15]'
                  }`}
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                {overallPercentage.toFixed(1)}% of total budget used
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
