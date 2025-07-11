import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import SearchBar from '../components/SearchBar';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE = 37.7749;
const LONGITUDE = -122.4194;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface SelectedLocation {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
}

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      
      const initialRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(initialRegion);
    })();
  }, []);

  const handleLocationSelect = (data: any, details: any) => {
    if (details && details.geometry && details.geometry.location) {
      const { lat, lng } = details.geometry.location;
      const newRegion: Region = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01 * ASPECT_RATIO,
      };
      
      setSelectedLocation({
        latitude: lat,
        longitude: lng,
        title: data.structured_formatting?.main_text || data.description,
        description: data.structured_formatting?.secondary_text || '',
      });
      
      setRegion(newRegion);
      
      // Animate map to new location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      
      Alert.alert(
        'Location Selected',
        `Selected: ${data.structured_formatting?.main_text || data.description}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleVoiceSearch = () => {
    Alert.alert(
      'Voice Search',
      'Voice search functionality coming soon!',
      [{ text: 'OK' }]
    );
  };

  const initialRegion: Region = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  } : {
    latitude: LATITUDE,
    longitude: LONGITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        region={region || undefined}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor="#2563EB"
        loadingBackgroundColor="#ffffff"
        onMapReady={() => console.log('Map is ready')}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title={selectedLocation.title}
            description={selectedLocation.description}
            pinColor="#2563EB"
          />
        )}
      </MapView>
      
      <SearchBar 
        onLocationSelect={handleLocationSelect}
        onVoiceSearch={handleVoiceSearch}
      />
      
      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>{selectedLocation.title}</Text>
          <Text style={styles.locationDescription}>{selectedLocation.description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 