export type ThemeColors = {
  bg: string;
  bgElevated: string;
  bgSubtle: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
};

const light: ThemeColors = {
  bg: '#F8FAFC',
  bgElevated: '#FFFFFF',
  bgSubtle: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  border: '#E5E7EB',
  borderSubtle: '#EEF2F6',
  accent: '#F97316',
  accentText: '#FFFFFF',
  accentSoft: 'rgba(249, 115, 22, 0.14)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#DC2626',
  overlay: 'rgba(0, 0, 0, 0.15)',
};

const dark: ThemeColors = {
  bg: '#0B0F19',
  bgElevated: '#111827',
  bgSubtle: '#0F172A',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textInverse: '#0B0F19',
  border: '#1F2937',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  accent: '#F97316',
  accentText: '#FFFFFF',
  accentSoft: 'rgba(249, 115, 22, 0.22)',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#FCA5A5',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const themes = { light, dark };

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const font = {
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 22,
    xl: 28,
    xxl: 34,
  },
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
};

export type AppTheme = {
  dark: boolean;
  color: ThemeColors;
  space: typeof space;
  radius: typeof radius;
  font: typeof font;
  shadow: typeof shadow;
};
