import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import SearchBar from '../components/SearchBar';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  Navigation: { destination: { latitude: number; longitude: number; title: string } };
};

export default function HomeScreen() {
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

  // Add state for navigation destination
  const [navigationDestination, setNavigationDestination] = useState<POI | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  // Add state for search bar text
  const [searchText, setSearchText] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Add state for favorites and recents
  const [favorites, setFavorites] = useState<POI[]>([]);
  const [recents, setRecents] = useState<POI[]>([]);

  // Load favorites and recents from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      const favs = await AsyncStorage.getItem('favorites');
      const recs = await AsyncStorage.getItem('recents');
      if (favs) setFavorites(JSON.parse(favs));
      if (recs) setRecents(JSON.parse(recs));
    })();
  }, []);

  // Save favorites and recents to AsyncStorage when they change
  useEffect(() => {
    AsyncStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    AsyncStorage.setItem('recents', JSON.stringify(recents));
  }, [recents]);

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

  return (
    <View style={{ flex: 1 }}>
      {/* Google Places Search Bar */}
      <SearchBar onLocationSelect={handleLocationSelect} onSearchResults={handleSearchResults} />
      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <View style={{ position: 'absolute', top: 110, left: 20, right: 20, zIndex: 1100, backgroundColor: 'white', borderRadius: 12, maxHeight: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
          {favorites.length > 0 && <Text style={{ fontWeight: 'bold', fontSize: 16, margin: 12 }}>⭐ Favorites</Text>}
          {favorites.map(fav => (
            <TouchableOpacity
              key={`fav-${fav.id}`}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
              onPress={() => handleLocationSelect(
                { description: fav.title },
                { place_id: fav.id, name: fav.title, formatted_address: fav.description, geometry: { location: fav.coordinate } }
              )}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1F2937', marginBottom: 2 }}>{fav.title}</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>{fav.description}</Text>
            </TouchableOpacity>
          ))}
          {recents.length > 0 && <Text style={{ fontWeight: 'bold', fontSize: 16, margin: 12 }}>🕑 Recent</Text>}
          {recents.map(rec => (
            <TouchableOpacity
              key={`rec-${rec.id}`}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
              onPress={() => handleLocationSelect(
                { description: rec.title },
                { place_id: rec.id, name: rec.title, formatted_address: rec.description, geometry: { location: rec.coordinate } }
              )}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1F2937', marginBottom: 2 }}>{rec.title}</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>{rec.description}</Text>
            </TouchableOpacity>
          ))}
          {searchResults.map(result => (
            <TouchableOpacity
              key={result.id}
              style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
              onPress={async () => {
                // Fetch details for the selected place
                try {
                  const detailsResponse = await axios.get(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${result.placeId}&fields=name,formatted_address,geometry&key=${GOOGLE_PLACES_API_KEY}`
                  );
                  const details = detailsResponse.data.result;
                  handleLocationSelect(
                    { description: result.title },
                    {
                      place_id: result.placeId,
                      name: result.title,
                      formatted_address: result.description,
                      geometry: details.geometry,
                    }
                  );
                  setShowResults(false);
                  setSearchText('');
                } catch (error) {
                  console.error('Failed to fetch place details:', error);
                }
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#1F2937', marginBottom: 2 }}>{result.title}</Text>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>{result.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* MapView with Google provider and overlays */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        region={initialRegion || region}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
        showsTraffic={trafficEnabled}
        showsIndoors
        showsBuildings
        showsPointsOfInterest
        onPoiClick={e => {
          const native = e.nativeEvent;
          const poi: POI = {
            id: native.placeId ? hashCode(native.placeId) : 0,
            title: native.name || 'POI',
            description: '',
            coordinate: native.coordinate,
          };
          handlePOIPress(poi);
        }}
        onMapReady={() => console.log('Map is ready')}
      >
        {/* User location marker */}
        {initialRegion && (
          <Marker
            coordinate={{
              latitude: initialRegion.latitude,
              longitude: initialRegion.longitude,
            }}
            title="You are here"
            description="Current Location"
            pinColor="blue"
          />
        )}
        {/* POI Markers */}
        {POIS.map(poi => (
          <Marker
            key={poi.id}
            coordinate={poi.coordinate}
            title={poi.title}
            description={poi.description}
            onPress={() => handlePOIPress(poi)}
          />
        ))}
        {searchResults.map(result => (
          <Marker
            key={result.id}
            coordinate={result.coordinate}
            title={result.title}
            description={result.description}
            onPress={() => handlePOIPress({ id: hashCode(result.placeId || `${result.coordinate.latitude},${result.coordinate.longitude}`), title: result.title, description: result.description, coordinate: result.coordinate })}
          />
        ))}
      </MapView>

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
        <View style={{ position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center', zIndex: 200 }}>
          <TouchableOpacity
            style={{ backgroundColor: '#2563EB', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 32, elevation: 4 }}
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
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
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