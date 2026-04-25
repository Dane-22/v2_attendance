import { useAppStore } from '@/store/appStore';
import { getThemeClasses } from '@/lib/theme';

export const useTheme = () => {
  const theme = useAppStore((state) => state.theme);
  const classes = getThemeClasses(theme);
  
  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    classes,
  };
};
