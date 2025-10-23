import { useTheme } from '@/contexts/ThemeContext';

/**
 * Web-specific useColorScheme that uses the custom theme context
 */
export function useColorScheme() {
  const { isDark } = useTheme();
  return isDark ? 'dark' : 'light';
}
