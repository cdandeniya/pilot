import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Dimensions, ActivityIndicator, Animated, FlatList } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// 1. Add imports for new theme/colors and logo asset
import { colors, glassmorphism } from '../theme';
import { Svg, Defs, LinearGradient, RadialGradient, Stop, Ellipse, Path, Circle } from 'react-native-svg';
// 1. Remove import of SvgUri (not used)
// import SvgUri from 'react-native-svg-uri';

const { width, height } = Dimensions.get('window');

const LAYERS = [
  { key: 'standard', label: 'Normal', mapType: 'standard' as const, icon: 'layers' as const },
  { key: 'satellite', label: 'Satellite', mapType: 'satellite' as const, icon: 'satellite' as const },
  { key: 'terrain', label: 'Terrain', mapType: 'terrain' as const, icon: 'terrain' as const },
  { key: 'hybrid', label: 'Hybrid', mapType: 'hybrid' as const, icon: 'layers-clear' as const },
];

interface POI {
  id: number;
  title: string;
  description: string;
  coordinate: { latitude: number; longitude: number };
}

interface POIDetails extends POI {
  rating: number;
  photos: any[];
  hours: string;
  reviews: number;
}

interface SearchResult {
  id: string;
  title: string;
  description: string;
  coordinate: { latitude: number; longitude: number };
  placeId?: string;
}

// Define the navigation param list
type RootStackParamList = {
  Home: undefined;
  Navigation: { destination: { latitude: number; longitude: number; title: string }; origin?: { latitude: number; longitude: number } };
};

// Custom dark map style (Google Maps)
const CRUISE_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#181A20' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A5A6B2' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#181A20' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#23235B' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3B3B98' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#23235B' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#23235B' }] },
];

export default function HomeScreen() {
  // All useState, useRef, useEffect, Animated.Value hooks at the very top
  const [mapType, setMapType] = useState<typeof LAYERS[number]['mapType']>('standard');
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [transitEnabled, setTransitEnabled] = useState(false);
  const [bicyclingEnabled, setBicyclingEnabled] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [poiDetails, setPoiDetails] = useState<POIDetails | null>(null);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [navigationDestination, setNavigationDestination] = useState<POI | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [favorites, setFavorites] = useState<POI[]>([]);
  const [recents, setRecents] = useState<POI[]>([]);
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  // Add to favorites
  const addToFavorites = (poi: POI) => {
    if (!favorites.find(f => f.id === poi.id)) {
      setFavorites([poi, ...favorites]);
    }
  };
  // Remove from favorites
  const removeFromFavorites = (poi: POI) => {
    setFavorites(favorites.filter(f => f.id !== poi.id));
  };
  // Add to recents
  const addToRecents = (poi: POI) => {
    setRecents([poi, ...recents.filter(r => r.id !== poi.id)].slice(0, 10)); // keep max 10
  };

  useEffect(() => {
    (async () => {
      const favs = await AsyncStorage.getItem('favorites');
      const recs = await AsyncStorage.getItem('recents');
      if (favs) setFavorites(JSON.parse(favs));
      if (recs) setRecents(JSON.parse(recs));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    AsyncStorage.setItem('recents', JSON.stringify(recents));
  }, [recents]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setLocationLoading(false);
    })();
  }, []);

  useEffect(() => {
    Animated.spring(buttonsAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }, []);

  // All hooks are now at the very top. Now do the loading check.
  if (locationLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  // Dummy POIs for demo; replace with real data/fetch
  const POIS: POI[] = [
    { id: 1, title: 'Golden Gate Bridge', description: 'Famous bridge in SF', coordinate: { latitude: 37.8199, longitude: -122.4783 } },
    { id: 2, title: 'Ferry Building', description: 'Marketplace & landmark', coordinate: { latitude: 37.7955, longitude: -122.3937 } },
  ];

  const handleLayerSelect = (layer: typeof LAYERS[number]) => {
    setMapType(layer.mapType);
    setShowLayerModal(false);
  };

  const handlePOIPress = (poi: POI) => {
    setSelectedPOI(poi);
    setPoiDetails({ ...poi, rating: 4.7, photos: [], hours: 'Open 9am-5pm', reviews: 123 }); // Replace with real details
    setNavigationDestination(poi);
  };

  const GOOGLE_PLACES_API_KEY = 'AIzaSyC_7hSdv0LHeOEnldEbM5JFIRKpxL_LZMo';

  const handleLocationSelect = async (data: any, details: any) => {
    if (details?.geometry?.location) {
      const { lat, lng } = details.geometry.location;
      const poi = {
        id: hashCode(details.place_id || `${lat},${lng}`),
        title: details.name || data.description || 'Destination',
        description: details.formatted_address || '',
        coordinate: { latitude: lat, longitude: lng },
      };
      setRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSelectedPOI(poi);
      // Fetch real POI details from Google Places Details API
      let realDetails = null;
      try {
        const placeId = details.place_id;
        if (placeId) {
          const resp = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,photos,opening_hours,review,user_ratings_total,formatted_address&key=${GOOGLE_PLACES_API_KEY}`);
          realDetails = resp.data.result;
        }
      } catch (e) {
        console.error('Failed to fetch POI details', e);
      }
      setPoiDetails({
        ...poi,
        rating: realDetails?.rating || 4.7,
        photos: realDetails?.photos || [],
        hours: realDetails?.opening_hours?.weekday_text?.join(', ') || 'N/A',
        reviews: realDetails?.user_ratings_total || 0,
      });
      setNavigationDestination(poi);
      addToRecents(poi);
    }
  };

  const handleSearchResults = async (text: string) => {
    setSearchText(text);
    if (text.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_API_KEY}&location=${initialRegion?.latitude || 37.7749},${initialRegion?.longitude || -122.4194}&radius=50000`
      );
      if (response.data.results) {
        const searchMarkers = response.data.results.map((result: any, index: number) => ({
          id: `search-${index}`,
          title: result.name,
          description: result.formatted_address,
          coordinate: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          placeId: result.place_id,
        }));
        setSearchResults(searchMarkers);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Local hashCode function for string to number
  function hashCode(str: string): number {
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // Helper to flatten glassmorphism into style objects
  const glassyStyle = {
    backgroundColor: colors.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    // overflow and backdropFilter are not supported in React Native
  };
  const shadowStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  };



  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Blurred/gradient overlay for depth */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
        backgroundColor: 'rgba(24,26,32,0.18)',
      }} />
      {/* Cruise logo watermark (top left) */}
      <View style={{ position: 'absolute', top: 32, left: 24, zIndex: 100, opacity: 0.18 }}>
        <Svg width={48} height={48} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="pinGradient" x1="100" y1="30" x2="100" y2="170" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#4B9EDB" />
              <Stop offset="50%" stopColor="#3B3B98" />
              <Stop offset="100%" stopColor="#1DE9B6" />
            </LinearGradient>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#F7B731" stopOpacity="1" />
              <Stop offset="100%" stopColor="#F7B731" stopOpacity="0" />
            </RadialGradient>
            <LinearGradient id="wave" x1="80" y1="110" x2="120" y2="140" gradientUnits="userSpaceOnUse">
              <Stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="100" cy="185" rx="20" ry="8" fill="#000" fillOpacity="0.15" />
          <Path d="M100 35c-28 0-51 21-51 50 0 34 38 74 49 85a5 5 0 0 0 6 0c11-11 49-51 49-85 0-29-23-50-51-50z" fill="url(#pinGradient)" />
          <Path d="M80 120 Q100 140 120 120" stroke="url(#wave)" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Circle cx="100" cy="90" r="18" fill="#F7B731" />
          <Circle cx="100" cy="90" r="28" fill="url(#glow)" />
        </Svg>
      </View>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        region={initialRegion || region}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={CRUISE_MAP_STYLE}
      >
        {/* Markers for POIs */}
        {POIS.map((poi) => (
          <Marker
            key={poi.id}
            coordinate={poi.coordinate}
            title={poi.title}
            description={poi.description}
            onPress={() => handlePOIPress(poi)}
          />
        ))}
      </MapView>

      {/* Glassy floating search bar */}
      <View style={[
        {
          position: 'absolute',
          top: 54,
          left: 24,
          right: 24,
          zIndex: 10,
          flexDirection: 'column',
          alignItems: 'center',
        },
        glassyStyle,
        shadowStyle,
      ]}>
        <SearchBar
          onLocationSelect={handleLocationSelect}
          onVoiceSearch={() => {}}
          onSearchResults={handleSearchResults}
          searchText={searchText}
          onSearchTextChange={setSearchText}
        />
        {/* Welcome message/tagline */}
        <Text style={{
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: '500',
          marginTop: 6,
          marginBottom: 2,
          letterSpacing: 1,
          textAlign: 'center',
          textShadowColor: colors.background,
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }}>
          Cruise: Your Conversational Copilot
        </Text>
      </View>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <View style={[
          {
            position: 'absolute',
            top: 180,
            left: 24,
            right: 24,
            zIndex: 15,
            maxHeight: 300,
          },
          glassyStyle,
          shadowStyle,
        ]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item: SearchResult) => item.id}
            renderItem={({ item }: { item: SearchResult }) => (
              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.1)',
                }}
                onPress={() => {
                  // Create a POI from search result
                  const poi = {
                    id: hashCode(item.placeId || item.id),
                    title: item.title,
                    description: item.description,
                    coordinate: item.coordinate,
                  };
                  setSelectedPOI(poi);
                  setNavigationDestination(poi);
                  setShowResults(false);
                  setSearchText('');
                  
                  // Animate map to the selected location
                  mapRef.current?.animateToRegion({
                    latitude: item.coordinate.latitude,
                    longitude: item.coordinate.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  });
                }}
              >
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: colors.text,
                  marginBottom: 2,
                }}>
                  {item.title}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                }}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            style={{
              borderRadius: 16,
              backgroundColor: 'transparent',
            }}
          />
        </View>
      )}

      {/* Animated quick-access floating buttons (right side) */}
      <Animated.View style={{
        position: 'absolute',
        right: 20,
        top: 140,
        zIndex: 20,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        opacity: buttonsAnim,
        transform: [{ scale: buttonsAnim }],
      }}>
        {/* Layers button */}
        <TouchableOpacity style={[
          {
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
          },
          glassyStyle,
          shadowStyle,
        ]} onPress={() => setShowLayerModal(true)}>
          <Ionicons name="layers" size={28} color={colors.primary} />
        </TouchableOpacity>
        {/* Recenter button */}
        <TouchableOpacity style={[
          {
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
          },
          glassyStyle,
          shadowStyle,
        ]} onPress={() => {
          if (initialRegion) mapRef.current?.animateToRegion(initialRegion);
        }}>
          <Ionicons name="locate" size={28} color={colors.primary} />
        </TouchableOpacity>
        {/* Report button */}
        <TouchableOpacity style={[
          {
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 8,
          },
          glassyStyle,
          shadowStyle,
        ]} onPress={() => {}}>
          <MaterialIcons name="report-problem" size={28} color={colors.warning} />
        </TouchableOpacity>
        {/* Voice assistant button */}
        <TouchableOpacity style={[
          {
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
          },
          glassyStyle,
          shadowStyle,
        ]} onPress={() => {}}>
          <Ionicons name="mic" size={28} color={colors.accent} />
        </TouchableOpacity>
      </Animated.View>

      {/* Placeholder for animated POI card (bottom) */}
      {/* To be implemented in next step */}

      {/* Branding: Cruise logo watermark (optional) */}
      {/* <SvgUri source={require('../../assets/locator-pin.svg')} width={48} height={48} style={{ position: 'absolute', left: 24, bottom: 24, opacity: 0.12 }} /> */}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={() => {
          if (initialRegion) {
            mapRef.current?.animateToRegion(initialRegion);
          }
        }}>
          <Ionicons name="locate" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setShowLayerModal(true)}>
          <MaterialIcons name="layers" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => setTrafficEnabled(t => !t)}>
          <MaterialIcons name="traffic" size={24} color={trafficEnabled ? '#10B981' : '#374151'} />
        </TouchableOpacity>
        {/* Add more FABs for features like favorites, share, etc. */}
      </View>

      {/* Map Layer Modal */}
      <Modal visible={showLayerModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowLayerModal(false)}>
          <View style={styles.layerModal}>
            {LAYERS.map(layer => (
              <TouchableOpacity key={layer.key} style={styles.layerOption} onPress={() => handleLayerSelect(layer)}>
                <MaterialIcons name={layer.icon} size={22} color={mapType === layer.mapType ? '#2563EB' : '#374151'} />
                <Text style={{ marginLeft: 12, color: mapType === layer.mapType ? '#2563EB' : '#374151' }}>{layer.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* POI Details Bottom Sheet/Card */}
      <Modal visible={!!selectedPOI} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelectedPOI(null)}>
          <View style={styles.poiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.poiTitle}>{poiDetails?.title}</Text>
              <TouchableOpacity onPress={() => {
                if (favorites.find(f => f.id === selectedPOI?.id)) {
                  removeFromFavorites(selectedPOI!);
                } else {
                  addToFavorites(selectedPOI!);
                }
              }}>
                <Ionicons name={favorites.find(f => f.id === selectedPOI?.id) ? 'star' : 'star-outline'} size={28} color="#FBBF24" />
              </TouchableOpacity>
            </View>
            <Text style={styles.poiDesc}>{poiDetails?.description}</Text>
            <Text style={styles.poiInfo}>Rating: {poiDetails?.rating} | {poiDetails?.hours}</Text>
            <Text style={styles.poiInfo}>Reviews: {poiDetails?.reviews}</Text>
            {/* Add photos, actions, etc. */}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Start Navigation Button */}
      {navigationDestination && (
        <View style={{ 
          position: 'absolute', 
          bottom: 120, 
          left: 0, 
          right: 0, 
          alignItems: 'center', 
          zIndex: 200 
        }}>
          <TouchableOpacity
            style={{ 
              backgroundColor: colors.primary, 
              borderRadius: 24, 
              paddingVertical: 16, 
              paddingHorizontal: 32, 
              elevation: 8,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            onPress={() => {
              navigation.navigate('Navigation', {
                destination: {
                  latitude: navigationDestination.coordinate.latitude,
                  longitude: navigationDestination.coordinate.longitude,
                  title: navigationDestination.title,
                },
                origin: initialRegion ? {
                  latitude: initialRegion.latitude,
                  longitude: initialRegion.longitude,
                } : undefined,
              });
            }}
          >
            <Text style={{ 
              color: '#fff', 
              fontWeight: 'bold', 
              fontSize: 18,
              textAlign: 'center',
            }}>
              🚗 Start Navigation to {navigationDestination.title}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tap to dismiss search results overlay */}
      {showResults && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 14,
          }}
          onPress={() => {
            setShowResults(false);
            setSearchText('');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  layerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  layerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  poiCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 180,
  },
  poiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  poiDesc: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  poiInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});