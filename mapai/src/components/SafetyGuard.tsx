import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';

interface SafetyGuardProps {
  onSpeedWarning?: (speed: number) => void;
}

const SafetyGuard: React.FC<SafetyGuardProps> = ({ onSpeedWarning }) => {
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [screenTouchCount, setScreenTouchCount] = useState(0);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startSpeedMonitoring = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied for speed monitoring');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const speed = location.coords.speed || 0;
          setCurrentSpeed(speed);
          
          // Convert m/s to mph (1 m/s ≈ 2.237 mph)
          const speedMph = speed * 2.237;
          
          if (speedMph > 5 && screenTouchCount > 0) {
            console.warn(`Safety warning: ${speedMph.toFixed(1)} mph and screen touched`);
            setIsWarningActive(true);
            onSpeedWarning?.(speedMph);
          }
        }
      );
    };

    startSpeedMonitoring();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [screenTouchCount, onSpeedWarning]);

  const handleScreenTouch = () => {
    setScreenTouchCount(prev => prev + 1);
    
    // Reset touch count after 5 seconds
    setTimeout(() => {
      setScreenTouchCount(0);
    }, 5000);
  };

  const dismissWarning = () => {
    setIsWarningActive(false);
  };

  return (
    <View style={styles.container} onTouchStart={handleScreenTouch}>
      {isWarningActive && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Safety Warning: Driving at {currentSpeed * 2.237} mph
          </Text>
          <TouchableOpacity onPress={dismissWarning} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  dismissText: {
    color: 'white',
    fontSize: 12,
  },
});

export default SafetyGuard; 