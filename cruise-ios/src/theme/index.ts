// Modern Cruise-inspired theme for the app
export const colors = {
  // Primary brand colors
  primary: '#6366F1', // Modern indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  
  // Accent colors
  accent: '#8B5CF6', // Modern purple
  accentLight: '#A78BFA',
  accentDark: '#7C3AED',
  
  // Background colors
  background: '#F8FAFC', // Very light gray-blue
  backgroundDark: '#1E293B', // Dark mode background
  card: 'rgba(255,255,255,0.95)', // Glassy white
  cardDark: 'rgba(30,41,59,0.95)', // Dark glass
  
  // Glass effects
  glass: 'rgba(255,255,255,0.9)',
  glassDark: 'rgba(30,41,59,0.9)',
  glassBlur: 'rgba(255,255,255,0.8)',
  
  // Text colors
  text: '#1E293B', // Dark slate
  textSecondary: '#64748B', // Medium slate
  textTertiary: '#94A3B8', // Light slate
  textInverse: '#FFFFFF',
  
  // Status colors
  success: '#10B981', // Modern green
  successLight: '#34D399',
  successDark: '#059669',
  warning: '#F59E0B', // Modern amber
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  danger: '#EF4444', // Modern red
  dangerLight: '#F87171',
  dangerDark: '#DC2626',
  info: '#3B82F6', // Modern blue
  infoLight: '#60A5FA',
  infoDark: '#2563EB',
  
  // Traffic colors
  trafficHeavy: '#EF4444',
  trafficModerate: '#F59E0B',
  trafficLight: '#10B981',
  
  // Special colors
  favorite: '#F59E0B', // Gold
  border: '#E2E8F0', // Light border
  borderDark: '#334155',
  
  // Status backgrounds
  dangerLight: 'rgba(239,68,68,0.1)',
  successLight: 'rgba(16,185,129,0.1)',
  warningLight: 'rgba(245,158,11,0.1)',
  infoLight: 'rgba(59,130,246,0.1)',
  
  // Gradients
  gradientPrimary: ['#6366F1', '#8B5CF6'],
  gradientAccent: ['#8B5CF6', '#EC4899'],
  gradientSuccess: ['#10B981', '#34D399'],
  gradientDanger: ['#EF4444', '#F87171'],
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const fontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const glassmorphism = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.2)',
  ...shadows.lg,
};

export const glassmorphismDark = {
  backgroundColor: 'rgba(30,41,59,0.95)',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  ...shadows.lg,
};

// Animation presets
export const animations = {
  spring: {
    tension: 100,
    friction: 8,
  },
  timing: {
    duration: 300,
  },
};

// Layout constants
export const layout = {
  headerHeight: 60,
  tabBarHeight: 80,
  searchBarHeight: 56,
  buttonHeight: 48,
  cardPadding: 16,
  screenPadding: 20,
}; 