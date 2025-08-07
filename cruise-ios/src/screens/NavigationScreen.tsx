import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import TurnByTurnNavigation from '../components/TurnByTurnNavigation';
import VoiceAssistant from '../services/VoiceAssistant';

interface NavigationScreenProps {
  route?: {
    params?: {
      destination?: {
        latitude: number;
        longitude: number;
        title: string;
      };
      origin?: {
        latitude: number;
        longitude: number;
      };
    };
  };
  navigation?: any;
}

export default function NavigationScreen({ route, navigation }: NavigationScreenProps) {
  const destination = route?.params?.destination || {
    latitude: 37.7749,
    longitude: -122.4194,
    title: 'San Francisco, CA',
  };
  const origin = route?.params?.origin;

  const handleCloseNavigation = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  // Set up voice assistant for driving mode
  useEffect(() => {
    // Enable driving mode in voice assistant
    VoiceAssistant.setDrivingState(true);
    
    // Announce that navigation is ready
    VoiceAssistant.speak(`Navigation ready. You can now use voice commands while driving. Say "Hey Cruise" followed by your request.`);
    
    return () => {
      // Disable driving mode when leaving navigation
      VoiceAssistant.setDrivingState(false);
    };
  }, []);

  return (
    <View style={styles.container}>
      <TurnByTurnNavigation
        destination={destination}
        origin={origin}
        onClose={handleCloseNavigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
}); 