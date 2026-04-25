'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { 
  Moon, 
  Sun, 
  Bell, 
  User, 
  ChevronDown,
  LogOut,
  Menu
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useTheme } from '@/hooks/useTheme';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function Header() {
  const { 
    theme, 
    toggleTheme, 
    user, 
    unreadCount, 
    toggleSidebar,
    toggleMobileSidebar,
    setUser 
  } = useAppStore();
  
  const { classes } = useTheme();
  
  const headerRef = useRef<HTMLElement>(null);
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Fetch real unread count
  useUnreadCount();
  
  // Animate header on mount
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, []);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Animate theme toggle
  const handleThemeToggle = () => {
    if (themeBtnRef.current) {
      gsap.to(themeBtnRef.current, {
        rotation: theme === 'dark' ? 180 : -180,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(themeBtnRef.current, { rotation: 0 });
          toggleTheme();
        }
      });
    } else {
      toggleTheme();
    }
  };
  
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  const isDark = theme === 'dark';
  
  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 h-16 ${classes.header} backdrop-blur-md border-b transition-colors duration-300`}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left - Logo & Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileSidebar}
            className={`p-2 rounded-lg transition-colors lg:hidden ${classes.hover} ${classes.text}`}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            {/* JAJR Logo Mark */}
            <div className="w-8 h-8 rounded-lg bg-[#facc15] flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-yellow-500/20">
              J
            </div>
            <span className={`font-semibold text-lg hidden sm:block ${classes.text}`}>
              JAJR <span className="text-[#facc15]">Attendance</span>
            </span>
          </div>
        </div>
        
        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            ref={themeBtnRef}
            onClick={handleThemeToggle}
            className={`p-2.5 rounded-lg transition-all duration-300 ${classes.hover}`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-[#facc15]" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative p-2.5 rounded-lg transition-colors ${classes.hover}`}
            >
              <Bell className={`w-5 h-5 ${classes.textMuted}`} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown 
              isOpen={notificationsOpen} 
              onClose={() => setNotificationsOpen(false)} 
            />
          </div>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${classes.hover}`}
            >
              <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center">
                <User className="w-4 h-4 text-black" />
              </div>
              <div className="hidden md:block text-left">
                <p className={`text-sm font-medium ${classes.text}`}>
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-[#facc15] capitalize">
                  {user?.role || 'Admin'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 ${classes.textMuted}`} />
            </button>
            
            {/* Dropdown Menu */}
            <div className={`absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-2xl transition-all duration-200 z-50 ${profileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} ${classes.bgCard} ${classes.border}`}>
              <div className={`px-4 py-2 border-b ${classes.border}`}>
                <p className={`text-sm font-medium ${classes.text}`}>{user?.name}</p>
                <p className={`text-xs ${classes.textMuted}`}>{user?.email}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
