'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAppStore } from '@/store/appStore';

interface LayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  hideFooter?: boolean;
  fullWidth?: boolean;
}

export default function Layout({ 
  children, 
  hideSidebar = false, 
  hideFooter = false,
  fullWidth = false 
}: LayoutProps) {
  const { theme, sidebarOpen } = useAppStore();
  const isDark = theme === 'dark';

  // Initialize theme on mount
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Page transition animation
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      gsap.fromTo(
        mainContent,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'} transition-colors duration-300`}>
      {!hideSidebar && <Header />}
      {!hideSidebar && <Sidebar />}

      {/* Main Content Area - Flexbox for maximum width */}
      <main
        className={`main-content flex-1 min-h-screen transition-all duration-300 ${
          !hideSidebar
            ? `pt-16 ${!hideFooter ? 'pb-12' : ''} ${
                sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-20'
              } ml-0`
            : ''
        }`}
      >
        {/* Content Wrapper - Full width with consistent breathing room */}
        <div className={`h-full ${fullWidth ? 'px-6 lg:px-10' : 'px-6 lg:px-10 py-6'}`}>
          {children}
        </div>
      </main>

      {!hideSidebar && !hideFooter && <Footer />}
    </div>
  );
}
