'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  Building2,
  ScanLine,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Bell,
  FileText,
  Activity,
  ShoppingCart,
  Settings,
  LogOut
} from 'lucide-react';
import { useAppStore, useIsBranchUser, useBranchCode } from '@/store/appStore';
import { notificationStats } from '@/app/dashboard/notifications/data';

// Navigation item type
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  primary?: boolean;
  badge?: number;
  hasSubmenu?: boolean;
}

interface SubNavItem {
  name: string;
  href: string;
}

// Navigation items by role
const getAdminNavItems = (unreadCount: number): NavItem[] => [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Site Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
  { name: 'Notification', href: '/dashboard/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
  { name: 'Employee List', href: '/dashboard/employees', icon: Users },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Activity Logs', href: '/dashboard/logs', icon: Activity },
  { name: 'Attendance Audit', href: '/dashboard/attendance-audit', icon: FileSearch },
  { name: 'Finance', href: '/dashboard/finance', icon: Wallet, hasSubmenu: true },
  { name: 'Procurement', href: '/dashboard/procurement', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const branchNavItems: NavItem[] = [
  { name: 'Scanner', href: '/branch/qr-scanner', icon: ScanLine, primary: true },
  { name: "Today's Attendance", href: '/branch/attendance', icon: Clock },
];

const financeSubItems: SubNavItem[] = [
  { name: 'Payroll', href: '/dashboard/payroll' },
  { name: 'Overtime', href: '/dashboard/finance/overtime' },
  { name: 'Billing', href: '/dashboard/finance/billing' },
  { name: 'Cash Advance', href: '/dashboard/finance/cash-advance' },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, mobileSidebarOpen, setMobileSidebarOpen, theme, user } = useAppStore();
  const isDark = theme === 'dark';
  const isBranchUser = useIsBranchUser();
  const branchCode = useBranchCode();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  
  const [unreadCount, setUnreadCount] = useState(notificationStats.unread);
  
  const navItems = isBranchUser ? branchNavItems : getAdminNavItems(unreadCount);
  
  // Close mobile sidebar when navigating
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);
  
  // Animate sidebar on mount
  useEffect(() => {
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.2 }
      );
    }
  }, []);
  
  // Animate nav items stagger
  useEffect(() => {
    if (navItemsRef.current) {
      const items = navItemsRef.current.querySelectorAll('.nav-item');
      gsap.fromTo(
        items,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.4 }
      );
    }
  }, []);
  
  // Handle sidebar toggle animation
  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: sidebarOpen ? 280 : 80,
        duration: 0.4,
        ease: 'power3.inOut'
      });
    }
  }, [sidebarOpen]);
  
  return (
    <>
      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={`hidden lg:block fixed left-0 top-16 bottom-0 z-40 backdrop-blur-xl border-r transition-all duration-300 ${sidebarOpen ? 'w-[280px]' : 'w-20'} ${isDark ? 'bg-[#0f0f0f] border-[#262626]' : 'bg-white border-gray-200'}`}
      >
        {/* Toggle Button - Desktop Only */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#facc15] text-black flex items-center justify-center shadow-lg shadow-yellow-500/30 hover:bg-yellow-400 transition-colors z-50"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        <SidebarContent 
          navItems={navItems} 
          isBranchUser={isBranchUser} 
          branchCode={branchCode} 
          sidebarOpen={sidebarOpen}
          navItemsRef={navItemsRef}
          isDark={isDark}
        />
      </aside>
      
      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-16 bottom-0 z-40 backdrop-blur-xl border-r transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-[280px] ${isDark ? 'bg-[#0f0f0f] border-[#262626]' : 'bg-white border-gray-200'}`}
      >
        <SidebarContent 
          navItems={navItems} 
          isBranchUser={isBranchUser} 
          branchCode={branchCode} 
          sidebarOpen={true}
          navItemsRef={navItemsRef}
          isDark={isDark}
        />
      </aside>
    </>
  );
}

// Extract sidebar content into reusable component
function SidebarContent({ 
  navItems, 
  isBranchUser, 
  branchCode, 
  sidebarOpen,
  navItemsRef,
  isDark
}: { 
  navItems: NavItem[]; 
  isBranchUser: boolean; 
  branchCode: string; 
  sidebarOpen: boolean;
  navItemsRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
}) {
  const pathname = usePathname();
  const setUser = useAppStore((state) => state.setUser);
  
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  const [financeOpen, setFinanceOpen] = useState(() => {
    const isFinanceRoute = pathname === '/dashboard/finance' || pathname?.startsWith('/dashboard/finance/');
    const isPayrollRoute = pathname === '/dashboard/payroll' || pathname?.startsWith('/dashboard/payroll/');
    return isFinanceRoute || isPayrollRoute;
  });

  useEffect(() => {
    const isFinanceRoute = pathname === '/dashboard/finance' || pathname?.startsWith('/dashboard/finance/');
    const isPayrollRoute = pathname === '/dashboard/payroll' || pathname?.startsWith('/dashboard/payroll/');
    if (isFinanceRoute || isPayrollRoute) {
      setFinanceOpen(true);
    }
  }, [pathname]);
  
  return (
    <div className="h-full flex flex-col py-6">
      {/* Company Branding */}
      {!isBranchUser && sidebarOpen && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#facc15] flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-yellow-500/20">
              J
            </div>
            <div>
              <p className="text-sm font-bold text-[#facc15]">JAJR Company</p>
              <p className="text-[10px] text-gray-500">Owned by Xandree</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Branch Badge for Branch Users */}
      {isBranchUser && (
        <div className={`px-4 mb-6 ${sidebarOpen ? '' : 'px-2'}`}>
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-[#facc15]/10 border border-[#facc15]/30 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-lg bg-[#facc15] flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-yellow-500/30">
              {branchCode}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-xs text-[#facc15] font-medium uppercase tracking-wider">Branch</p>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{branchCode}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav ref={navItemsRef} className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const isPrimary = item.primary;
          const isFinance = item.name === 'Finance' && item.hasSubmenu;
          const isFinanceActive =
            pathname === '/dashboard/finance' ||
            pathname?.startsWith('/dashboard/finance/') ||
            pathname === '/dashboard/payroll' ||
            pathname?.startsWith('/dashboard/payroll/');
          
          if (isFinance && sidebarOpen) {
            return (
              <div key={item.name} className="nav-item">
                <button
                  type="button"
                  onClick={() => setFinanceOpen((v) => !v)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                    isFinanceActive
                      ? 'bg-[#facc15]/10 text-[#facc15] border-l-2 border-[#facc15]'
                      : isDark
                        ? 'hover:bg-[#1a1a1a] text-gray-300'
                        : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  aria-expanded={financeOpen}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isFinanceActive
                      ? 'text-[#facc15]'
                      : isDark
                        ? 'text-gray-400 group-hover:text-[#facc15]'
                        : 'text-gray-500 group-hover:text-[#facc15]'
                  }`} />
                  <span className={`font-medium text-sm whitespace-nowrap flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                  {financeOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {financeOpen && (
                  <div className="mt-1 ml-6 space-y-1">
                    {financeSubItems.map((subItem) => {
                      const subActive = pathname === subItem.href || pathname?.startsWith(subItem.href + '/');
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                            subActive
                              ? 'text-[#facc15] bg-[#facc15]/10'
                              : isDark
                                ? 'text-gray-300 hover:bg-[#1a1a1a]'
                                : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="whitespace-nowrap">{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? isPrimary
                    ? 'bg-[#facc15] text-black shadow-lg shadow-yellow-500/30'
                    : 'bg-[#facc15]/10 text-[#facc15] border-l-2 border-[#facc15]'
                  : isDark 
                    ? 'hover:bg-[#1a1a1a] text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
              } ${sidebarOpen ? '' : 'justify-center'}`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? (isPrimary ? 'text-black' : 'text-[#facc15]') : isDark ? 'text-gray-400 group-hover:text-[#facc15]' : 'text-gray-500 group-hover:text-[#facc15]'}`} />
              {sidebarOpen && (
                <span className={`font-medium text-sm whitespace-nowrap flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
              )}
              {/* Badge for notifications */}
              {sidebarOpen && item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
              {/* Submenu indicator */}
              {sidebarOpen && item.hasSubmenu && (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Log Out */}
      {sidebarOpen && (
        <div className={`px-4 pt-4 mt-4 border-t ${isDark ? 'border-[#262626]' : 'border-gray-200'}`}>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl w-full transition-colors ${isDark ? 'hover:bg-[#1a1a1a] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
