import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'super_admin' | 'branch';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  branch_code?: string;
}

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  
  // Branch
  branchId: string | null;
  setBranchId: (id: string | null) => void;
  
  // Notifications
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  
  // UI State
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
      
      // User
      user: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      isAuthenticated: false,
      
      // Branch
      branchId: null,
      setBranchId: (id) => set({ branchId: id }),
      
      // Notifications
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      
      // UI State
      sidebarOpen: true,
      mobileSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: 'jajr-app-storage',
      partialize: (state) => ({ 
        theme: state.theme, 
        user: state.user,
        branchId: state.branchId,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

// Helper hooks
export const useIsBranchUser = () => {
  const user = useAppStore((state) => state.user);
  return user?.role === 'branch' || /^branch-[a-h]$/i.test(user?.username || '');
};

export const useBranchCode = () => {
  const user = useAppStore((state) => state.user);
  return user?.branch_code || user?.username?.split('-')[1]?.toUpperCase() || 'A';
};
