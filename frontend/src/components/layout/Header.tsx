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
  
  const headerRef = useRef<HTMLElement>(null);
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
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
  
  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
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
      className={`fixed top-0 left-0 right-0 z-50 h-16 ${isDark ? 'bg-[#0a0a0a] border-[#262626]' : 'bg-white border-gray-200'} backdrop-blur-md border-b transition-colors duration-300`}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left - Logo & Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileSidebar}
            className={`p-2 rounded-lg transition-colors lg:hidden ${isDark ? 'hover:bg-[#1a1a1a] text-white' : 'hover:bg-gray-100 text-gray-900'}`}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            {/* JAJR Logo Mark */}
            <div className="w-8 h-8 rounded-lg bg-[#facc15] flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-yellow-500/20">
              J
            </div>
            <span className={`font-semibold text-lg hidden sm:block ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
            className={`p-2.5 rounded-lg transition-all duration-300 ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-[#facc15]" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          {/* Notifications */}
          <button className={`relative p-2.5 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}>
            <Bell className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1a1a1a]' : 'hover:bg-gray-100'}`}
            >
              <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center">
                <User className="w-4 h-4 text-black" />
              </div>
              <div className="hidden md:block text-left">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-[#facc15] capitalize">
                  {user?.role || 'Admin'}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            
            {/* Dropdown Menu */}
            <div className={`absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-2xl transition-all duration-200 z-50 ${profileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} ${isDark ? 'bg-[#141414] border border-[#262626]' : 'bg-white border border-gray-200'}`}>
              <div className={`px-4 py-2 border-b ${isDark ? 'border-[#262626]' : 'border-gray-200'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
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
