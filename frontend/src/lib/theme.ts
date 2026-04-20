// Cyber-Future Theme Configuration for JAJR Attendance
// Based on reference: Dark neutral grays with yellow/gold accents

export const colors = {
  // Primary Accent - Yellow/Gold (from reference)
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
    950: '#422006',
  },
  
  // Safety Orange - JAJR Industrial Branding (for alerts)
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  },
  
  // Dark Mode Colors (from reference)
  dark: {
    bg: '#0a0a0a',        // Main background
    card: '#141414',      // Card backgrounds
    cardHover: '#1a1a1a', // Card hover state
    border: '#262626',    // Borders
    borderHover: '#404040', // Border hover
    surface: '#171717',   // Elevated surfaces
    sidebar: '#0f0f0f',   // Sidebar background
  },
  
  // Neutral Grays
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
  
  // Legacy colors for compatibility
  teal: {
    50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
    400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
    800: '#115e59', 900: '#134e4a', 950: '#042f2e',
  },
  
  navy: {
    50: '#f0f4f8', 100: '#d9e2ec', 200: '#bcccdc', 300: '#9fb3c8',
    400: '#829ab1', 500: '#627d98', 600: '#486581', 700: '#334e68',
    800: '#243b53', 900: '#102a43', 950: '#0a192f',
  },
  
  slate: {
    50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
    400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
    800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
};

// Cyber Gradient Utilities
export const gradients = {
  // Yellow/Gold Accent Gradients (from reference)
  cyber: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400',
  cyberVertical: 'bg-gradient-to-b from-yellow-400 via-yellow-500 to-orange-400',
  
  // Dark Mode Gradients (neutral dark from reference)
  darkHeader: 'bg-[#0a0a0a]',
  darkSidebar: 'bg-[#0f0f0f]',
  
  // Light Mode Gradients
  lightHeader: 'bg-white',
  lightSidebar: 'bg-gray-50',
  
  // Neon Glows (yellow theme from reference)
  yellowGlow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]',
  orangeGlow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]',
  successGlow: 'shadow-[0_0_30px_rgba(34,197,94,0.6)]',
  errorGlow: 'shadow-[0_0_30px_rgba(239,68,68,0.6)]',
  
  // Legacy
  tealGlow: 'shadow-[0_0_20px_rgba(20,184,166,0.5)]',
};

// Theme Classes Generator - Based on reference design
export const getThemeClasses = (theme: 'dark' | 'light') => {
  if (theme === 'dark') {
    return {
      // Background
      bg: 'bg-[#0a0a0a]',
      bgCard: 'bg-[#141414]',
      bgCardHover: 'bg-[#1a1a1a]',
      bgSidebar: 'bg-[#0f0f0f]',
      bgSurface: 'bg-[#171717]',
      
      // Text
      text: 'text-white',
      textMuted: 'text-gray-400',
      textAccent: 'text-yellow-400',
      
      // Borders
      border: 'border-[#262626]',
      borderHover: 'border-[#404040]',
      borderAccent: 'border-yellow-500',
      
      // Gradients
      header: gradients.darkHeader,
      sidebar: gradients.darkSidebar,
      
      // Hover States
      hover: 'hover:bg-[#1a1a1a]',
      hoverAccent: 'hover:bg-yellow-500/10',
      
      // Active States (yellow accent from reference)
      active: 'bg-yellow-500/10 text-yellow-400 border-l-2 border-yellow-400',
    };
  }
  
  return {
    // Light Mode
    bg: 'bg-gray-50',
    bgCard: 'bg-white',
    bgCardHover: 'bg-gray-50',
    bgSidebar: 'bg-white',
    bgSurface: 'bg-white',
    
    // Text
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    textAccent: 'text-yellow-600',
    
    // Borders
    border: 'border-gray-200',
    borderHover: 'border-gray-300',
    borderAccent: 'border-yellow-500',
    
    // Gradients
    header: gradients.lightHeader,
    sidebar: gradients.lightSidebar,
    
    // Hover States
    hover: 'hover:bg-gray-100',
    hoverAccent: 'hover:bg-yellow-50',
    
    // Active States
    active: 'bg-yellow-50 text-yellow-700 border-l-2 border-yellow-500',
  };
};

// Status Colors
export const statusColors = {
  success: {
    bg: 'bg-green-500',
    text: 'text-green-400',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',
  },
  error: {
    bg: 'bg-red-500',
    text: 'text-red-400',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.5)]',
  },
  warning: {
    bg: 'bg-orange-500',
    text: 'text-orange-400',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.5)]',
  },
  info: {
    bg: 'bg-teal-500',
    text: 'text-teal-400',
    glow: 'shadow-[0_0_20px_rgba(20,184,166,0.5)]',
  },
};
