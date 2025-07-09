import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import Constants from 'expo-constants';
import MapScreen from './src/components/MapScreen';
import SafetyGuard from './src/components/SafetyGuard';
import WakeWordDetector from './src/components/WakeWordDetector';

// Set Mapbox access token from Expo config
Mapbox.setAccessToken(Constants.expoConfig?.extra?.EXPO_PUBLIC_MAPBOX_TOKEN || '');

export default function App() {
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [isListening, setIsListening] = useState(true);

  const handleWakeWord = useCallback(() => {
    setWakeWordDetected(true);
    setIsListening(true);
    // You can trigger additional logic here, e.g., open a voice command modal
  }, []);

  const handleSpeedWarning = useCallback((speed: number) => {
    // You can show a modal or notification here
    console.warn('Speed warning:', speed);
  }, []);

  return (
    <View style={styles.container}>
      <MapScreen />
      <SafetyGuard onSpeedWarning={handleSpeedWarning} />
      <WakeWordDetector onWakeWordDetected={handleWakeWord} isListening={isListening} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});