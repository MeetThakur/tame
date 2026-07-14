import { useColorScheme } from 'react-native';
import { useTameStore } from '../store/useTameStore';

export const COLORS = {
  dark: {
    background: '#0E0E0E',
    surface: '#1A1A1A',
    surfaceRaised: '#242424',
    border: '#2E2E2E',
    textPrimary: '#F0F0F0',
    textSecondary: '#888888',
    accent: '#C8F560',
    destructive: '#FF4D4D',
  },
  light: {
    background: '#F7F7F5',
    surface: '#FFFFFF',
    surfaceRaised: '#F0F0ED',
    border: '#E5E5E0',
    textPrimary: '#111111',
    textSecondary: '#7A7A7A',
    accent: '#C8F560',
    destructive: '#FF4D4D',
  },
};

export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const TYPOGRAPHY = {
  headingLg: {
    fontSize: 22,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600' as const,
  },
  headingSm: {
    fontSize: 16,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400' as const,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_300Light',
    fontWeight: '300' as const,
  },
  tag: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_500Medium',
    fontWeight: '500' as const,
  },
};

export const LAYOUT = {
  borderRadius: 12,
  cardRadius: 12,
  thumbnailRadius: 8,
};

export function useThemeColors() {
  const storeTheme = useTameStore((state) => state.theme);
  const systemScheme = useColorScheme();
  
  const activeScheme = (storeTheme === 'system' ? (systemScheme || 'dark') : storeTheme) as 'dark' | 'light';
  return COLORS[activeScheme] || COLORS.dark;
}

