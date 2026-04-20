'use client';

import { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../data';
import { 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const statusConfig = {
  COMPLETED: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Completed' },
  PENDING: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
  FAILED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Failed' },
};

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTransactions = transactions.filter(t => 
    filter === 'ALL' || t.type === filter
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
      <div className="p-6 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
              <p className="text-sm text-gray-400">Last {filteredTransactions.length} transactions</p>
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-[#facc15] text-black'
                    : 'bg-[#262626] text-gray-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-[#262626]">
        {filteredTransactions.slice(0, 8).map((transaction) => {
          const status = statusConfig[transaction.status];
          const StatusIcon = status.icon;
          const isExpanded = expandedId === transaction.id;

          return (
            <div 
              key={transaction.id}
              className="p-4 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
              onClick={() => toggleExpand(transaction.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Type Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    transaction.type === 'INCOME' 
                      ? 'bg-green-400/10 text-green-400' 
                      : 'bg-red-400/10 text-red-400'
                  }`}>
                    {transaction.type === 'INCOME' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-white font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-[#262626] rounded text-gray-400">
                        {transaction.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    transaction.type === 'INCOME' ? 'text-green-400' : 'text-white'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1 ${status.bg} ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#262626] grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="text-white ml-2 font-mono">{transaction.id}</span>
                  </div>
                  {transaction.reference && (
                    <div>
                      <span className="text-gray-400">Reference:</span>
                      <span className="text-white ml-2">{transaction.reference}</span>
                    </div>
                  )}
                  {transaction.projectId && (
                    <div>
                      <span className="text-gray-400">Project ID:</span>
                      <span className="text-white ml-2 font-mono">{transaction.projectId}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className={`ml-2 ${status.color}`}>{transaction.status}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="p-4 border-t border-[#262626] text-center">
        <button className="text-sm text-[#facc15] hover:text-yellow-400 transition-colors">
          View All Transactions →
        </button>
      </div>
    </div>
  );
}
