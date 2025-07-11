import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

interface VoiceButtonProps {
  isListening: boolean;
  onPress: () => void;
}

export default function VoiceButton({ isListening, onPress }: VoiceButtonProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isListening ? theme.colors.error : theme.colors.primary,
        },
      ]}
      onPress={onPress}
    >
      <MaterialIcons
        name={isListening ? 'stop' : 'mic'}
        size={24}
        color="white"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 