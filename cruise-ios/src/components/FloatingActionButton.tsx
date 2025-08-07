import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows, borderRadius, spacing } from '../theme';

interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  style?: any;
  disabled?: boolean;
}

export default function FloatingActionButton({
  icon,
  onPress,
  size = 'medium',
  variant = 'primary',
  style,
  disabled = false,
}: FloatingActionButtonProps) {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return 48;
      case 'large':
        return 64;
      default:
        return 56;
    }
  };

  const getGradientColors = () => {
    switch (variant) {
      case 'secondary':
        return colors.gradientAccent;
      case 'success':
        return colors.gradientSuccess;
      case 'danger':
        return colors.gradientDanger;
      default:
        return colors.gradientPrimary;
    }
  };

  const buttonSize = getSize();
  const gradientColors = getGradientColors();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? [colors.textTertiary, colors.textTertiary] : gradientColors}
          style={[
            styles.gradient,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={buttonSize * 0.4}
            color={colors.textInverse}
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...shadows.lg,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 