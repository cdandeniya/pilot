import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    // Set up voice event listeners for wake word detection
    Voice.onSpeechResults = (event) => {
      if (event.value && event.value.length > 0) {
        const text = event.value[0].toLowerCase();
        setLastTranscription(text);
        
        // Simple keyword matching for "hey map ai" or "hey mapai"
        if (text.includes('hey map') || text.includes('hey mapai')) {
          console.log('Wake word detected!');
          onWakeWordDetected();
        }
      }
    };

    Voice.onSpeechError = (error) => {
      console.error('Wake word detection error:', error);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onWakeWordDetected]);

  const startHotMic = async () => {
    try {
      setIsHotMicActive(true);
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting hot mic:', error);
      setIsHotMicActive(false);
    }
  };

  const stopHotMic = async () => {
    try {
      await Voice.stop();
      setIsHotMicActive(false);
    } catch (error) {
      console.error('Error stopping hot mic:', error);
      setIsHotMicActive(false);
    }
  };

  // Start hot mic when component mounts
  useEffect(() => {
    startHotMic();
    
    return () => {
      stopHotMic();
    };
  }, []);

  // Stop hot mic when actively listening
  useEffect(() => {
    if (isListening) {
      stopHotMic();
    } else if (!isHotMicActive) {
      startHotMic();
    }
  }, [isListening, isHotMicActive]);

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        {isHotMicActive ? 'Listening for "Hey MapAI"...' : 'Voice active'}
      </Text>
      {lastTranscription && (
        <Text style={styles.transcriptionText}>
          Last heard: "{lastTranscription}"
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  transcriptionText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default WakeWordDetector; 