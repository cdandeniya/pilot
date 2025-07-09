import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Voice from '@react-native-community/voice';

interface WakeWordDetectorProps {
  onWakeWordDetected: () => void;
  isListening: boolean;
}

const WakeWordDetector: React.FC<WakeWordDetectorProps> = ({
  onWakeWordDetected,
  isListening,
}) => {
  const [isHotMicActive, setIsHotMicActive] = useState(false);
  const [lastTranscription, setLastTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionActive = useRef(false);
  const cleanupTimeout = useRef<NodeJS.Timeout | null>(null);

  // Helper to safely start recognition
  const startHotMic = async () => {
    if (recognitionActive.current) {
      console.log('WakeWordDetector: Recognition already active, skipping start');
      return;
    }

    try {
      console.log('WakeWordDetector: Starting recognition...');
      
      // Always destroy first to ensure clean state
      await Voice.destroy();
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      recognitionActive.current = true;
      await Voice.start('en-US');
      setIsHotMicActive(true);
      setError(null);
      console.log('WakeWordDetector: Recognition started successfully');
    } catch (err) {
      console.error('WakeWordDetector: Failed to start recognition:', err);
      recognitionActive.current = false;
      setIsHotMicActive(false);
      setError(err instanceof Error ? err.message : 'Failed to start recognition');
    }
  };

  // Helper to safely stop recognition
  const stopHotMic = async () => {
    if (!recognitionActive.current) {
      console.log('WakeWordDetector: Recognition not active, skipping stop');
      return;
    }

    try {
      console.log('WakeWordDetector: Stopping recognition...');
      await Voice.stop();
      await Voice.destroy();
      recognitionActive.current = false;
      setIsHotMicActive(false);
      console.log('WakeWordDetector: Recognition stopped successfully');
    } catch (err) {
      console.error('WakeWordDetector: Failed to stop recognition:', err);
      // Force cleanup even if stop fails
      recognitionActive.current = false;
      setIsHotMicActive(false);
    }
  };

  // Handle recognition results
  const handleSpeechResults = (event: any) => {
    console.log('WakeWordDetector: Speech results:', event);
    const transcription = event.value?.[0] || '';
    setLastTranscription(transcription);
    
    // Check for wake word (customize this logic)
    if (transcription.toLowerCase().includes('hey') || 
        transcription.toLowerCase().includes('hello') ||
        transcription.toLowerCase().includes('wake')) {
      console.log('WakeWordDetector: Wake word detected!');
      onWakeWordDetected();
    }
  };

  // Handle recognition errors
  const handleSpeechError = (event: any) => {
    console.log('WakeWordDetector: Speech error:', event);
    setError(event.error?.message || 'Speech recognition error');
    
    // Clean up and restart after a delay
    if (recognitionActive.current) {
      stopHotMic().then(() => {
        // Restart after delay to avoid rapid restart loops
        if (cleanupTimeout.current) {
          clearTimeout(cleanupTimeout.current);
        }
        cleanupTimeout.current = setTimeout(() => {
          if (isListening) {
            startHotMic();
          }
        }, 2000);
      });
    }
  };

  // Handle recognition end
  const handleSpeechEnd = () => {
    console.log('WakeWordDetector: Speech recognition ended');
    recognitionActive.current = false;
    setIsHotMicActive(false);
    
    // Restart if we should still be listening
    if (isListening) {
      setTimeout(() => {
        if (isListening && !recognitionActive.current) {
          startHotMic();
        }
      }, 1000);
    }
  };

  // Set up Voice event listeners
  useEffect(() => {
    console.log('WakeWordDetector: Setting up Voice event listeners');
    
    Voice.onSpeechStart = () => console.log('WakeWordDetector: Speech started');
    Voice.onSpeechEnd = handleSpeechEnd;
    Voice.onSpeechError = handleSpeechError;
    Voice.onSpeechResults = handleSpeechResults;
    Voice.onSpeechPartialResults = (event) => {
      console.log('WakeWordDetector: Partial results:', event);
    };

    return () => {
      console.log('WakeWordDetector: Cleaning up Voice event listeners');
      Voice.destroy();
      if (cleanupTimeout.current) {
        clearTimeout(cleanupTimeout.current);
      }
    };
  }, []);

  // Handle isListening prop changes
  useEffect(() => {
    console.log('WakeWordDetector: isListening changed to:', isListening);
    
    if (isListening && !recognitionActive.current) {
      startHotMic();
    } else if (!isListening && recognitionActive.current) {
      stopHotMic();
    }
  }, [isListening]);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {isHotMicActive ? 'Listening...' : 'Not listening'}
      </Text>
      {lastTranscription && (
        <Text style={styles.transcription}>
          Heard: "{lastTranscription}"
        </Text>
      )}
      {error && (
        <Text style={styles.error}>
          Error: {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  status: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  transcription: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default WakeWordDetector; 