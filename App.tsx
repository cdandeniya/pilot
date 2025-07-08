import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, Alert } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import MapScreen from './src/components/MapScreen';
import WakeWordDetector from './src/components/WakeWordDetector';
import SafetyGuard from './src/components/SafetyGuard';
import { useVoiceHook } from './src/hooks/useVoiceHook';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize Mapbox with your token
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const {
    isRecording,
    transcribedText,
    startRecording,
    stopRecording,
    clearTranscription,
  } = useVoiceHook();

  const handleWakeWordDetected = async () => {
    console.log('Wake word detected! Starting recording...');
    setIsListening(true);
    await startRecording();
    
    // Stop recording after 5 seconds
    setTimeout(async () => {
      await stopRecording();
      setIsListening(false);
      console.log('Recording stopped. Transcribed text:', transcribedText);
    }, 5000);
  };

  const handleLocationUpdate = (location: { latitude: number; longitude: number }) => {
    setCurrentLocation(location);
  };

  const handleSpeedWarning = (speed: number) => {
    Alert.alert(
      'Safety Warning',
      `You are driving at ${speed.toFixed(1)} mph. Please focus on the road.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <SafetyGuard onSpeedWarning={handleSpeedWarning} />
      <MapScreen onLocationUpdate={handleLocationUpdate} />
      <WakeWordDetector
        onWakeWordDetected={handleWakeWordDetected}
        isListening={isListening}
      />
      {isListening && (
        <View style={styles.listeningOverlay}>
          <Text style={styles.listeningText}>🎤 Listening...</Text>
        </View>
      )}
      {transcribedText && (
        <View style={styles.transcriptionOverlay}>
          <Text style={styles.transcriptionText}>"{transcribedText}"</Text>
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listeningOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
  },
  listeningText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transcriptionOverlay: {
    position: 'absolute',
    top: 160,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
  },
  transcriptionText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
});
