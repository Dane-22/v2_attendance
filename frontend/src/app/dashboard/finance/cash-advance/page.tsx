'use client';

import { Wallet } from 'lucide-react';

export default function CashAdvancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#facc15] flex items-center justify-center shadow-lg shadow-yellow-500/20">
          <Wallet className="w-5 h-5 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            Finance <span className="text-[#facc15]">Cash Advance</span>
          </h1>
          <p className="text-sm text-gray-400">Placeholder page. Cash advance module coming soon.</p>
        </div>
      </div>

      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <p className="text-sm text-gray-300">
          This section will contain cash advance requests, approvals, balances, and history.
        </p>
      </div>
    </div>
  );
}
