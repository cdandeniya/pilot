import { useState, useCallback } from 'react';
import Voice from '@react-native-community/voice';
import OpenAI from 'openai';

interface UseVoiceHookReturn {
  isRecording: boolean;
  transcribedText: string;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscription: () => void;
}

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_KEY || '',
});

export const useVoiceHook = (): UseVoiceHookReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');

  const startRecording = useCallback(async () => {
    try {
      setIsRecording(true);
      setTranscribedText('');
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  }, []);

  const clearTranscription = useCallback(() => {
    setTranscribedText('');
  }, []);

  // Set up voice event listeners
  Voice.onSpeechResults = (event) => {
    if (event.value && event.value.length > 0) {
      const text = event.value[0];
      setTranscribedText(text);
      
      // Send to OpenAI for transcription (fallback)
      if (text && openai.apiKey) {
        // This would be used if we want to enhance the transcription
        // For now, we'll use the device's speech recognition
        console.log('Transcribed text:', text);
      }
    }
  };

  Voice.onSpeechError = (error) => {
    console.error('Speech recognition error:', error);
    setIsRecording(false);
  };

  return {
    isRecording,
    transcribedText,
    startRecording,
    stopRecording,
    clearTranscription,
  };
}; 