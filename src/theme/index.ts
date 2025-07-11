import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB',
    primaryContainer: '#DBEAFE',
    secondary: '#F59E0B',
    secondaryContainer: '#FEF3C7',
    surface: '#FFFFFF',
    background: '#F8FAFC',
    error: '#DC2626',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1F2937',
    onBackground: '#1F2937',
    outline: '#E5E7EB',
    surfaceVariant: '#F3F4F6',
    onSurfaceVariant: '#6B7280',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      fontFamily: 'System',
      fontSize: 32,
      fontWeight: '700',
    },
    displayMedium: {
      fontFamily: 'System',
      fontSize: 28,
      fontWeight: '600',
    },
    displaySmall: {
      fontFamily: 'System',
      fontSize: 24,
      fontWeight: '600',
    },
    headlineLarge: {
      fontFamily: 'System',
      fontSize: 22,
      fontWeight: '600',
    },
    headlineMedium: {
      fontFamily: 'System',
      fontSize: 20,
      fontWeight: '600',
    },
    headlineSmall: {
      fontFamily: 'System',
      fontSize: 18,
      fontWeight: '600',
    },
    titleLarge: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '600',
    },
    titleMedium: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '500',
    },
    titleSmall: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '500',
    },
    bodyLarge: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: '400',
    },
    bodyMedium: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '400',
    },
    bodySmall: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '400',
    },
    labelLarge: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: '500',
    },
    labelMedium: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: '500',
    },
    labelSmall: {
      fontFamily: 'System',
      fontSize: 10,
      fontWeight: '500',
    },
  },
  roundness: 12,
}; 