'use client';

import { useAppStore, useBranchCode } from '@/store/appStore';
import { useTheme } from '@/hooks/useTheme';
import { useQuery } from '@tanstack/react-query';
import { branchApi } from '@/lib/api';
import { MapPin, Server, Shield } from 'lucide-react';

export default function Footer() {
  const { sidebarOpen, theme, user } = useAppStore();
  const { classes } = useTheme();
  const branchCode = useBranchCode();
  const isBranchUser = user?.role === 'branch' || /^branch-[a-h]$/i.test(user?.username || '');

  // Fetch branch name from API
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await branchApi.getAll();
      return response.data?.data || [];
    },
    enabled: isBranchUser,
  });

  const branchName = branchesData?.find((b: any) => b.code === branchCode)?.shortName || branchCode;
  const isDark = theme === 'dark';
  
  return (
    <footer
      className={`fixed bottom-0 right-0 z-30 h-12 ${sidebarOpen ? 'left-[280px]' : 'left-20'} backdrop-blur-md border-t transition-all duration-300 ${classes.bg} ${classes.border}`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left - System Info */}
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 text-xs ${classes.textMuted}`}>
            <Server className="w-3.5 h-3.5" />
            <span>System v2.0</span>
          </div>
          
          <div className={`hidden sm:flex items-center gap-2 text-xs ${classes.textMuted}`}>
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Connection</span>
          </div>
        </div>
        
        {/* Center - Copyright */}
        <div className={`hidden md:block text-xs ${classes.textMuted}`}>
          © 2026 JAJR Construction. All rights reserved.
        </div>
        
        {/* Right - Branch Location */}
        <div className={`flex items-center gap-2 text-xs ${classes.text}`}>
          <MapPin className="w-3.5 h-3.5 text-[#facc15]" />
          <span className="font-medium">
            {isBranchUser ? `Branch ${branchCode}: ${branchName}` : 'Admin Dashboard'}
          </span>
        </div>
      </div>
    </footer>
  );
}
