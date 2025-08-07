import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  onPress,
  disabled = false,
}: CardProps) {
  const getCardStyle = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          ...shadows.md,
        };
      case 'elevated':
        return {
          backgroundColor: colors.card,
          ...shadows.lg,
        };
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          backgroundColor: colors.card,
          ...shadows.sm,
        };
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'large':
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  const cardStyle = [
    styles.container,
    getCardStyle(),
    {
      padding: getPadding(),
      opacity: disabled ? 0.6 : 1,
    },
    style,
  ];

  if (onPress) {
    const TouchableOpacity = require('react-native').TouchableOpacity;
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
}); 