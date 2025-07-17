import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import TurnByTurnNavigation from '../components/TurnByTurnNavigation';

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
  // Get destination and origin from route params or use defaults
  const destination = route?.params?.destination || {
    latitude: 37.7749,
    longitude: -122.4194,
    title: 'San Francisco, CA',
  };
  const origin = route?.params?.origin;

  const handleCloseNavigation = () => {
    // Navigate back to the previous screen
    if (navigation) {
      navigation.goBack();
    }
  };

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