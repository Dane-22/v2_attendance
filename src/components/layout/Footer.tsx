'use client';

import { useAppStore, useBranchCode } from '@/store/appStore';
import { MapPin, Server, Shield } from 'lucide-react';

const branchNames: Record<string, string> = {
  'A': 'Sto. Rosario',
  'B': 'BCDA',
  'C': 'Sundara',
  'D': 'Panicsican',
  'E': 'Main Office',
  'F': 'Capitol',
  'H': 'Testing Branch',
};

export default function Footer() {
  const { sidebarOpen, theme, user } = useAppStore();
  const branchCode = useBranchCode();
  const branchName = branchNames[branchCode] || branchCode;
  const isBranchUser = user?.role === 'branch' || /^branch-[a-h]$/i.test(user?.username || '');
  const isDark = theme === 'dark';
  
  return (
    <footer
      className={`fixed bottom-0 right-0 z-30 h-12 ${sidebarOpen ? 'left-[280px]' : 'left-20'} backdrop-blur-md border-t transition-all duration-300 ${isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-gray-200'}`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left - System Info */}
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Server className="w-3.5 h-3.5" />
            <span>System v2.0</span>
          </div>
          
          <div className={`hidden sm:flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Connection</span>
          </div>
        </div>
        
        {/* Center - Copyright */}
        <div className={`hidden md:block text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          © 2026 JAJR Construction. All rights reserved.
        </div>
        
        {/* Right - Branch Location */}
        <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <MapPin className="w-3.5 h-3.5 text-[#facc15]" />
          <span className="font-medium">
            {isBranchUser ? `Branch ${branchCode}: ${branchName}` : 'Admin Dashboard'}
          </span>
        </div>
      </div>
    </footer>
  );
}
