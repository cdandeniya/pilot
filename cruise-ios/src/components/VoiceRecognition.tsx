import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import VoiceAssistant, { VoiceResponse } from '../services/VoiceAssistant';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../theme';

interface VoiceRecognitionProps {
  onNavigationRequest?: (destination: { latitude: number; longitude: number; title: string }) => void;
  onSearchRequest?: (places: Array<{ name: string; place_id: string; location: { lat: number; lng: number } }>) => void;
}

export default function VoiceRecognition({ onNavigationRequest, onSearchRequest }: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [isAlwaysListening, setIsAlwaysListening] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize audio session
    initializeAudio();
    
    // Set up voice assistant callbacks
    VoiceAssistant.setOnVoiceResult(handleVoiceResponse);
    
    return () => {
      // Cleanup
      stopListening();
      VoiceAssistant.destroy();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('❌ Audio initialization error:', error);
    }
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setIsProcessing(false);
      setRecognizedText('');
      setLastResponse(null);
      setWakeWordDetected(false);
      setIsAlwaysListening(true);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start continuous listening
      await VoiceAssistant.startListening();
      
    } catch (error) {
      console.error('❌ Error starting voice recognition:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setIsAlwaysListening(false);
    setWakeWordDetected(false);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    VoiceAssistant.stopListening();
  };

  const handleVoiceResponse = async (response: VoiceResponse) => {
    setIsProcessing(false);
    setLastResponse(response);
    
    // Check if wake word was detected
    if (VoiceAssistant.isWakeWordDetected()) {
      setWakeWordDetected(true);
      setTimeout(() => setWakeWordDetected(false), 3000);
    }

    // Handle different response types
    switch (response.type) {
      case 'navigation':
        if (response.navigationRequest) {
          // Simulate navigation request
          console.log('🚗 Navigation requested:', response.navigationRequest);
        }
        break;
      case 'search':
        if (response.searchRequest) {
          // Simulate search request
          console.log('🔍 Search requested:', response.searchRequest);
        }
        break;
      case 'conversation':
        // Speak the response
        await VoiceAssistant.speak(response.content);
        break;
    }
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getButtonIcon = () => {
    if (wakeWordDetected) return 'mic';
    if (isProcessing) return 'hourglass';
    if (isListening) return 'mic-off';
    return 'mic';
  };

  const getButtonColor = () => {
    if (wakeWordDetected) return colors.success;
    if (isProcessing) return colors.warning;
    if (isListening) return colors.primary;
    return colors.gray;
  };

  const getStatusText = () => {
    if (wakeWordDetected) return 'Wake word detected!';
    if (isAlwaysListening) return 'Always listening - say "Hey Cruise"';
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening...';
    return 'Tap to start listening';
  };

  const testWakeWord = () => {
    VoiceAssistant.testWakeWord();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.voiceButton,
          { backgroundColor: getButtonColor() },
          { transform: [{ scale: pulseAnim }] }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons name={getButtonIcon() as any} size={24} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.statusText}>{getStatusText()}</Text>
      
      {/* Test button for wake word */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={testWakeWord}
      >
        <Text style={styles.testButtonText}>Test "Hey Cruise"</Text>
      </TouchableOpacity>
      
      {recognizedText ? (
        <Text style={styles.recognizedText}>"{recognizedText}"</Text>
      ) : null}
      
      {lastResponse && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>{lastResponse.content}</Text>
          {lastResponse.suggestions && lastResponse.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {lastResponse.suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => {
                    VoiceAssistant.processVoiceInput(suggestion);
                  }}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.md,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: fontSizes.sm,
    fontWeight: '500' as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  recognizedText: {
    fontSize: fontSizes.base,
    fontWeight: '600' as any,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  responseContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows.small,
    maxWidth: 300,
  },
  responseText: {
    fontSize: fontSizes.base,
    fontWeight: '500' as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  suggestionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  suggestionText: {
    fontSize: fontSizes.sm,
    fontWeight: '500' as any,
    color: 'white',
  },
  testButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  testButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600' as any,
    color: 'white',
  },
}); 