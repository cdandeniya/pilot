import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';

interface MapScreenProps {
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onLocationUpdate }) => {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(newLocation);
      onLocationUpdate?.(newLocation);
    })();
  }, [onLocationUpdate]);

  if (!userLocation) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera
          zoomLevel={15}
          centerCoordinate={[userLocation.longitude, userLocation.latitude]}
        />
        <Mapbox.PointAnnotation
          id="userLocation"
          coordinate={[userLocation.longitude, userLocation.latitude]}
        >
          <Mapbox.Callout title="You are here" />
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen; 