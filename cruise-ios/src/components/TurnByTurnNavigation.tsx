import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  Marker,
  Region,
  Polyline,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Constants from 'expo-constants';
import SearchBar from '../components/SearchBar';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
  startLocation: { latitude: number; longitude: number };
  endLocation: { latitude: number; longitude: number };
  polyline: Array<{ latitude: number; longitude: number }>;
}

interface RouteData {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  steps: NavigationStep[];
  totalDistance: string;
  totalDuration: string;
  overviewPolyline?: Array<{ latitude: number; longitude: number }>;
}

interface TurnByTurnNavigationProps {
  destination: { latitude: number; longitude: number; title: string };
  origin?: { latitude: number; longitude: number };
  onClose: () => void;
  waypoints?: Array<{ latitude: number; longitude: number; title?: string }>;
}

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

// Add a polyline decoder (Google encoded polyline algorithm)
function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push(makeCoords(lat / 1e5, lng / 1e5));
  }
  return points;
}

// Add geocoding helper
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status === 'OK' && data.results.length > 0) {
    const loc = data.results[0].geometry.location;
    return { latitude: loc.lat, longitude: loc.lng };
  }
  return null;
}

// Helper to validate destination
function isValidDestination(dest: any) {
  return dest && typeof dest.latitude === 'number' && typeof dest.longitude === 'number' && Math.abs(dest.latitude) > 0.1 && Math.abs(dest.longitude) > 0.1;
}

// Update fetchDirections types
async function fetchDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints: Array<{ latitude: number; longitude: number }> = [],
  trafficModel: string = ''
): Promise<any> {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;
  let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}&alternatives=true`;
  if (waypoints.length > 0) {
    const waypointsStr = waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
    url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
  }
  if (trafficModel) {
    url += `&traffic_model=${trafficModel}`;
    url += `&departure_time=now`;
  }
  
  console.log('🔍 Fetching directions from:', url);
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('🔍 Directions API response:', {
    status: data.status,
    routes_count: data.routes?.length || 0,
    has_overview_polyline: !!data.routes?.[0]?.overview_polyline,
    overview_polyline_length: data.routes?.[0]?.overview_polyline?.points?.length || 0,
    steps_count: data.routes?.[0]?.legs?.[0]?.steps?.length || 0,
    first_step_polyline: data.routes?.[0]?.legs?.[0]?.steps?.[0]?.polyline?.points?.substring(0, 50) + '...',
  });
  
  if (data.status !== 'OK') {
    console.error('❌ Directions API error:', data.error_message || 'Unknown error');
    throw new Error(data.error_message || 'Failed to fetch directions');
  }
  
  return data;
}

function isValidLocation(loc: any) {
  if (!loc) return false;
  // If it's a LocationObject, use .coords
  if (loc.coords) {
    return (
      typeof loc.coords.latitude === 'number' &&
      typeof loc.coords.longitude === 'number' &&
      Math.abs(loc.coords.latitude) > 0.1 &&
      Math.abs(loc.coords.longitude) > 0.1
    );
  }
  // If it's a plain { latitude, longitude } object
  return (
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    Math.abs(loc.latitude) > 0.1 &&
    Math.abs(loc.longitude) > 0.1
  );
}

const DEFAULT_LOCATION = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 5,
    altitude: 0,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
};

const TRAFFIC_REROUTE_INTERVAL = 30000; // 30 seconds

// When constructing LocationObjectCoords, always provide all required fields
function makeCoords(lat: number, lng: number): Location.LocationObjectCoords {
  return {
    latitude: lat,
    longitude: lng,
    accuracy: 5,
    altitude: 0,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  };
}

// Helper to create full LocationObjectCoords
function makeFullCoords(lat: number, lng: number) {
  return {
    latitude: lat,
    longitude: lng,
    accuracy: 5,
    altitude: 0,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  };
}

export default function TurnByTurnNavigation({
  destination,
  origin,
  onClose,
  waypoints = [],
}: TurnByTurnNavigationProps) {
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [region, setRegion] = useState<Region | null>(null);
  const [navigationRegion, setNavigationRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);
  const locationWatcherRef = useRef<Location.LocationSubscription | null>(null);
  const debugIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debug mode for testing
  const [debugMode, setDebugMode] = useState(false);
  const [simulatedLocation, setSimulatedLocation] = useState<Location.LocationObject | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // New state for enhanced engagement
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number | null>(null);
  const [nextInstruction, setNextInstruction] = useState<string | null>(null);
  const [instructionAnimation] = useState(new Animated.Value(1));
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnnouncedStep, setLastAnnouncedStep] = useState(-1);
  const [lastVibrationTime, setLastVibrationTime] = useState(0);
  const [rerouting, setRerouting] = useState(false);
  const [lastRouteDuration, setLastRouteDuration] = useState<string | null>(null);
  const rerouteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation values for smooth transitions
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Add at the top of the component
  const currentStepIndexRef = useRef(0);
  const [flattenedRoute, setFlattenedRoute] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [stepEndIndices, setStepEndIndices] = useState<number[]>([]);

  // Add state for alternative routes
  const [allRoutes, setAllRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // After setting routeData, flatten the polyline and store step end indices
  useEffect(() => {
    if (!routeData) return;
    // Flatten all step polylines into a single array
    let points: Array<{ latitude: number; longitude: number }> = [];
    let indices: number[] = [];
    routeData.steps.forEach((step) => {
      if (step.polyline.length > 0) {
        // Avoid duplicating points at step boundaries
        if (points.length > 0 && points[points.length - 1].latitude === step.polyline[0].latitude && points[points.length - 1].longitude === step.polyline[0].longitude) {
          points = points.concat(step.polyline.slice(1));
        } else {
          points = points.concat(step.polyline);
        }
        indices.push(points.length - 1);
      }
    });
    setFlattenedRoute(points);
    setStepEndIndices(indices);
  }, [routeData]);

  // Ref for current polyline index
  const polylineIndexRef = useRef(0);

  // Add a ref to track the last used location for route calculation
  const lastRouteOriginRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Add pendingNavigation state
  const [pendingNavigation, setPendingNavigation] = useState(false);

  // Helper to compare locations
  function locationsAreClose(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    if (!a || !b) return false;
    const dLat = a.latitude - b.latitude;
    const dLng = a.longitude - b.longitude;
    return Math.abs(dLat) < 0.0001 && Math.abs(dLng) < 0.0001;
  }

  // In useEffect, recalculate route if currentLocation changes significantly
  useEffect(() => {
    if (currentLocation && isValidLocation(currentLocation)) {
      const coords = currentLocation.coords || currentLocation;
      if (!lastRouteOriginRef.current || !locationsAreClose(coords, lastRouteOriginRef.current)) {
        lastRouteOriginRef.current = { latitude: coords.latitude, longitude: coords.longitude };
        setRouteData(null); // Clear old route
        // FIX: Pass the full currentLocation object, not a custom object
        calculateRoute(currentLocation, destination);
      }
    }
  }, [currentLocation, destination]);

  // Get current location and start navigation
  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      setLocationError(null);
      // When using origin, always provide all required fields
      if (origin && isValidLocation(origin)) {
        const coords = {
          latitude: origin.latitude,
          longitude: origin.longitude,
          accuracy: 5,
          altitude: 0,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        };
        setCurrentLocation({ coords, timestamp: Date.now() });
        setLocationLoading(false);
        await calculateRoute({ coords, timestamp: Date.now() }, destination);
        return;
      }
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is required for navigation.');
        setCurrentLocation(DEFAULT_LOCATION);
        setLocationLoading(false);
        await calculateRoute(DEFAULT_LOCATION, destination);
      } else {
        try {
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCurrentLocation(location);
          setLocationLoading(false);
          await calculateRoute(location, destination);
        } catch (e) {
          setLocationError('Could not get your current location. Using default location.');
          setCurrentLocation(DEFAULT_LOCATION);
          setLocationLoading(false);
          await calculateRoute(DEFAULT_LOCATION, destination);
        }
      }
    })();
    return () => {
      if (locationWatcherRef.current) {
        locationWatcherRef.current.remove();
      }
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
      }
    };
  }, [destination, origin]);

  // Start location tracking when navigation begins
  useEffect(() => {
    const handleNavigationStart = async () => {
      if (isNavigating && currentLocation) {
        if (!debugMode) {
          await startLocationTracking();
        }
        // Animate UI elements in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        stopLocationTracking();
        stopDebugLocationTracking();
        // Animate UI elements out
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    };

    handleNavigationStart();
  }, [isNavigating, currentLocation, debugMode]);

  // Start navigation when routeData is ready and pendingNavigation is true
  useEffect(() => {
    if (pendingNavigation && routeData) {
      setIsNavigating(true);
      setPendingNavigation(false);
    }
  }, [pendingNavigation, routeData]);

  // Add state for waypoints UI
  const [localWaypoints, setLocalWaypoints] = useState(waypoints);
  const [addingWaypoint, setAddingWaypoint] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState<{ latitude: number; longitude: number; title?: string } | null>(null);
  const [waypointSearchVisible, setWaypointSearchVisible] = useState(false);

  // Handler for adding a waypoint from search
  const handleWaypointSelect = (data: any, details: any) => {
    if (details && details.geometry && details.geometry.location) {
      setLocalWaypoints([
        ...localWaypoints,
        {
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
          title: details.name || data.structured_formatting?.main_text || data.description,
        },
      ]);
      setWaypointSearchVisible(false);
    }
  };

  // Add UI for adding/removing waypoints before navigation starts
  {!isNavigating && (
    <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 12, margin: 12, elevation: 2 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Stops (Waypoints)</Text>
      {localWaypoints.length === 0 && <Text style={{ color: '#888' }}>No stops added.</Text>}
      {localWaypoints.map((wp, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ flex: 1 }}>{wp.title || `${wp.latitude.toFixed(4)}, ${wp.longitude.toFixed(4)}`}</Text>
          <TouchableOpacity onPress={() => setLocalWaypoints(localWaypoints.filter((_, i) => i !== idx))}>
            <Text style={{ color: '#e11d48', fontWeight: 'bold', marginLeft: 8 }}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      {waypointSearchVisible ? (
        <View style={{ marginTop: 8 }}>
          <SearchBar onLocationSelect={handleWaypointSelect} />
          <TouchableOpacity onPress={() => setWaypointSearchVisible(false)} style={{ marginTop: 8 }}>
            <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setWaypointSearchVisible(true)} style={{ marginTop: 8 }}>
          <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Add Stop</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={{
          marginTop: 16,
          backgroundColor: '#2563EB',
          borderRadius: 8,
          paddingVertical: 12,
          alignItems: 'center',
        }}
        onPress={() => setPendingNavigation(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Start Navigation</Text>
      </TouchableOpacity>
    </View>
  )}

  // Update calculateRoute to use waypoints
  const calculateRoute = async (
    origin: Location.LocationObject,
    dest: { latitude?: number; longitude?: number; title?: string } | string,
    waypointsArr: Array<{ latitude: number; longitude: number }> = localWaypoints
  ) => {
    let destinationCoords: { latitude: number; longitude: number } | null = null;
    if (typeof dest === 'string') {
      destinationCoords = await geocodeAddress(dest);
      if (!destinationCoords) {
        Alert.alert('Destination Error', 'Could not geocode the destination address. Please check the address and try again.');
        return;
      }
    } else if (!isValidDestination(dest)) {
      // Try geocoding by title if available
      if (dest && dest.title) {
        destinationCoords = await geocodeAddress(dest.title);
        if (!destinationCoords) {
          Alert.alert('Destination Error', 'Could not geocode the destination title. Please check the address and try again.');
          return;
        }
      } else {
        Alert.alert('Destination Error', 'Invalid destination coordinates.');
        return;
      }
    } else {
      destinationCoords = { latitude: dest.latitude ?? 0, longitude: dest.longitude ?? 0 };
    }

    if (!destinationCoords) {
      Alert.alert('Destination Error', 'Could not resolve destination coordinates.');
      return;
    }

    // Validate origin
    const originCoords = origin.coords || origin;
    if (!originCoords || typeof originCoords.latitude !== 'number' || typeof originCoords.longitude !== 'number' || isNaN(originCoords.latitude) || isNaN(originCoords.longitude) || Math.abs(originCoords.latitude) < 0.1 || Math.abs(originCoords.longitude) < 0.1) {
      Alert.alert('Location Error', 'Could not get a valid starting location. Please enable location services or set a location in the simulator.');
      return;
    }

    // Now call fetchDirections with valid coordinates and waypoints
    try {
      console.log('Directions API call:', {
        origin: originCoords,
        destination: destinationCoords
      });
      if (GOOGLE_MAPS_API_KEY) {
        // Use real Google Directions API
        const data = await fetchDirections(originCoords, destinationCoords, waypointsArr, 'best_guess');
        setAllRoutes(data.routes);
        const mainRoute = data.routes[selectedRouteIndex] || data.routes[0];
        const leg = mainRoute.legs[0];
        console.log('🔍 Directions API response:', {
          start_location: leg.start_location,
          end_location: leg.end_location,
          steps: leg.steps.map((s: any) => ({
            start: s.start_location,
            end: s.end_location,
            instruction: s.html_instructions
          }))
        });
        // Use overview polyline if available
        let overviewPolyline: Array<{ latitude: number; longitude: number }> = [];
        if (mainRoute.overview_polyline && mainRoute.overview_polyline.points) {
          console.log('🔍 Decoding overview polyline:', {
            encoded_length: mainRoute.overview_polyline.points.length,
            preview: mainRoute.overview_polyline.points.substring(0, 100) + '...'
          });
          overviewPolyline = decodePolyline(mainRoute.overview_polyline.points);
          console.log('🔍 Decoded overview polyline:', {
            points_count: overviewPolyline.length,
            first_point: overviewPolyline[0],
            last_point: overviewPolyline[overviewPolyline.length - 1]
          });
        } else {
          console.warn('⚠️ No overview polyline found in API response');
        }
        // Defensive: Check overview polyline
        if (!overviewPolyline || overviewPolyline.length === 0 || overviewPolyline.some(pt => typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number' || isNaN(pt.latitude) || isNaN(pt.longitude))) {
          Alert.alert('Route Error', 'The route polyline is invalid or empty. Please try a different destination.');
          console.error('❌ Invalid overview polyline:', overviewPolyline);
          return;
        }
        // Defensive: Check all steps
        for (const step of leg.steps) {
          if (!step.start_location || !step.end_location ||
              typeof step.start_location.lat !== 'number' || typeof step.start_location.lng !== 'number' ||
              typeof step.end_location.lat !== 'number' || typeof step.end_location.lng !== 'number' ||
              isNaN(step.start_location.lat) || isNaN(step.start_location.lng) ||
              isNaN(step.end_location.lat) || isNaN(step.end_location.lng)) {
            Alert.alert('Route Error', 'A step in the route is missing valid coordinates.');
            console.error('❌ Invalid step:', step);
            return;
          }
          const stepPolyline = decodePolyline(step.polyline.points);
          if (!Array.isArray(stepPolyline) || stepPolyline.length === 0 || stepPolyline.some(pt => typeof pt.latitude !== 'number' || typeof pt.longitude !== 'number' || isNaN(pt.latitude) || isNaN(pt.longitude))) {
            Alert.alert('Route Error', 'A step polyline is invalid or empty.');
            console.error('❌ Invalid step polyline:', stepPolyline, step);
            return;
          }
        }
        const newRouteData = {
          origin: leg.start_location,
          destination: leg.end_location,
          totalDistance: leg.distance.text,
          totalDuration: leg.duration.text,
          steps: (leg.steps as any[]).map((step: any) => {
            const stepPolyline = decodePolyline(step.polyline.points);
            console.log('🔍 Step polyline:', {
              instruction: step.html_instructions.replace(/<[^>]+>/g, ''),
              encoded_length: step.polyline.points.length,
              decoded_points: stepPolyline.length,
              first_point: stepPolyline[0],
              last_point: stepPolyline[stepPolyline.length - 1]
            });
            return {
              instruction: step.html_instructions.replace(/<[^>]+>/g, ''),
              distance: step.distance.text,
              duration: step.duration.text,
              maneuver: step.maneuver || 'straight',
              startLocation: makeCoords(step.start_location.lat, step.start_location.lng),
              endLocation: makeCoords(step.end_location.lat, step.end_location.lng),
              polyline: stepPolyline,
            };
          }),
          overviewPolyline,
        };
        setRegion({
          latitude: (((typeof newRouteData.origin.latitude === 'number' ? newRouteData.origin.latitude : 0) + (typeof newRouteData.destination.latitude === 'number' ? newRouteData.destination.latitude : 0)) / 2) || 0,
          longitude: (((typeof newRouteData.origin.longitude === 'number' ? newRouteData.origin.longitude : 0) + (typeof newRouteData.destination.longitude === 'number' ? newRouteData.destination.longitude : 0)) / 2) || 0,
          latitudeDelta: Math.abs((typeof newRouteData.origin.latitude === 'number' ? newRouteData.origin.latitude : 0) - (typeof newRouteData.destination.latitude === 'number' ? newRouteData.destination.latitude : 0)) * 1.5 || 0.01,
          longitudeDelta: Math.abs((typeof newRouteData.origin.longitude === 'number' ? newRouteData.origin.longitude : 0) - (typeof newRouteData.destination.longitude === 'number' ? newRouteData.destination.longitude : 0)) * 1.5 || 0.01,
        });
        setRouteData(newRouteData);
        if (mapRef.current && overviewPolyline && overviewPolyline.length > 1) {
          mapRef.current.fitToCoordinates(overviewPolyline, {
            edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
            animated: true,
          });
        }
      } else {
        Alert.alert('API Key Error', 'Google Maps API key is missing. Please set it in app.json.');
        return;
      }
    } catch (error) {
      console.error('Failed to calculate route:', error);
      Alert.alert('Error', 'Failed to calculate route');
    }
  };

  const startLocationTracking = async () => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove();
    }

    locationWatcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 10,
      },
      (location) => {
        setCurrentLocation(location);
        updateNavigationProgress(location);
        updateNavigationView(location);
      }
    );
  };

  const startDebugLocationTracking = () => {
    if (!routeData || flattenedRoute.length === 0) return;

    console.log('🐛 Starting debug location tracking...');
    console.log('🐛 Route data:', routeData);
    console.log('🐛 Flattened route length:', flattenedRoute.length);
    console.log('🐛 Step end indices:', stepEndIndices);
    
    // Start from current location instead of route origin
    const startLocation = currentLocation || {
      coords: { 
        latitude: routeData.origin.latitude, 
        longitude: routeData.origin.longitude,
        accuracy: 5, 
        altitude: 0, 
        altitudeAccuracy: null, 
        heading: null, 
        speed: null 
      },
      timestamp: Date.now(),
    };
    
    console.log('🐛 Starting from current location:', startLocation.coords);
    
    setSimulatedLocation(startLocation);
    setCurrentLocation(startLocation);
    updateNavigationView(startLocation);
    updateNavigationProgress(startLocation);

    // Find the closest point on the route to start from
    let currentIndex = 0;
    let minDistance = Infinity;
    
    flattenedRoute.forEach((point, index) => {
      const distance = calculateDistance(
        { latitude: startLocation.coords.latitude, longitude: startLocation.coords.longitude },
        point
      );
      if (distance < minDistance) {
        minDistance = distance;
        currentIndex = index;
      }
    });
    
    console.log('🐛 Starting from route index:', currentIndex, 'at distance:', minDistance);

    debugIntervalRef.current = setInterval(() => {
      if (currentIndex < flattenedRoute.length - 1) {
        currentIndex++;
        polylineIndexRef.current = currentIndex;
        const point = flattenedRoute[currentIndex];
        const newLocation = {
          coords: makeCoords(point.latitude, point.longitude),
          timestamp: Date.now(),
        };
        
        console.log('🐛 Moving to index:', currentIndex, 'at point:', point);
        
        setSimulatedLocation(newLocation);
        setCurrentLocation(newLocation);
        updateNavigationProgress(newLocation);
        updateNavigationView(newLocation);
        
        // Check if we've reached the end of a step
        const stepIdx = stepEndIndices.findIndex(idx => idx === currentIndex);
        console.log('🐛 Checking step progression:', { currentIndex, stepIdx, stepEndIndices });
        
        if (stepIdx !== -1 && stepIdx !== currentStepIndexRef.current) {
          currentStepIndexRef.current = stepIdx;
          setCurrentStepIndex(stepIdx);
          console.log('🐛 Moving to next step', stepIdx);
        }
      } else {
        console.log('🐛 Reached end of route');
        stopDebugLocationTracking();
        setIsNavigating(false);
        Alert.alert('Arrived!', 'You have reached your destination');
      }
    }, 1000); // Move every second for a smoother simulation
  };

  const stopLocationTracking = () => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove();
      locationWatcherRef.current = null;
    }
  };

  const stopDebugLocationTracking = () => {
    if (debugIntervalRef.current) {
      clearInterval(debugIntervalRef.current);
      debugIntervalRef.current = null;
    }
  };

  const updateNavigationView = (location: Location.LocationObject) => {
    if (!isNavigating || !routeData) return;
    // Defensive: Check current step and coordinates
    const currentStep = routeData.steps[currentStepIndex];
    const nextStep = routeData.steps[currentStepIndex + 1];
    if (!currentStep || !currentStep.endLocation || typeof currentStep.endLocation.latitude !== 'number' || typeof currentStep.endLocation.longitude !== 'number' || isNaN(currentStep.endLocation.latitude) || isNaN(currentStep.endLocation.longitude)) {
      Alert.alert('Navigation Error', 'Current navigation step is invalid.');
      console.error('❌ Invalid current step:', currentStep);
      setIsNavigating(false);
      return;
    }
    let targetPoint = currentStep.endLocation;
    if (nextStep && nextStep.startLocation && typeof nextStep.startLocation.latitude === 'number' && typeof nextStep.startLocation.longitude === 'number' && !isNaN(nextStep.startLocation.latitude) && !isNaN(nextStep.startLocation.longitude)) {
      targetPoint = nextStep.startLocation;
    }
    if (!location.coords || typeof location.coords.latitude !== 'number' || typeof location.coords.longitude !== 'number' || isNaN(location.coords.latitude) || isNaN(location.coords.longitude)) {
      Alert.alert('Location Error', 'Current location is invalid.');
      console.error('❌ Invalid current location:', location);
      setIsNavigating(false);
      return;
    }

    console.log('🗺️ Updating navigation view for location:', location.coords);

    // Calculate heading/bearing to next waypoint
    const heading = calculateBearing(
      { latitude: location.coords.latitude, longitude: location.coords.longitude },
      targetPoint
    );

    // Calculate distance to next turn for dynamic zoom
    const distanceToNextTurn = calculateDistance(
      { latitude: location.coords.latitude, longitude: location.coords.longitude },
      currentStep.endLocation
    );

    // Dynamic zoom based on distance to turn (like Google/Apple Maps)
    let zoomLevel = 0.003; // Default zoom
    if (distanceToNextTurn <= 100) {
      zoomLevel = 0.001; // Very close zoom for immediate turns
    } else if (distanceToNextTurn <= 300) {
      zoomLevel = 0.002; // Medium zoom for approaching turns
    } else if (distanceToNextTurn <= 1000) {
      zoomLevel = 0.004; // Slightly zoomed out for distant turns
    } else {
      zoomLevel = 0.006; // Far zoom for distant navigation
    }

    // Calculate camera position with offset (like Google Maps)
    // Offset the camera slightly ahead of current position
    const offsetDistance = Math.min(distanceToNextTurn * 0.3, 200); // Max 200m offset
    const offsetPoint = calculateOffsetPoint(
      { latitude: location.coords.latitude, longitude: location.coords.longitude },
      heading,
      offsetDistance
    );

    // Create navigation region with proper rotation and positioning
    const navigationRegion: Region = {
      latitude: offsetPoint.latitude,
      longitude: offsetPoint.longitude,
      latitudeDelta: zoomLevel,
      longitudeDelta: zoomLevel * ASPECT_RATIO,
    };

    console.log('🗺️ Setting navigation region:', {
      region: navigationRegion,
      heading,
      distanceToNextTurn,
      zoomLevel
    });

    setNavigationRegion(navigationRegion);

    // Animate map with smooth transition (like Google Maps)
    if (mapRef.current) {
      console.log('🗺️ Animating map to new region with heading:', heading);
      
      // Use camera instead of animateToRegion for better control
      mapRef.current.animateCamera({
        center: {
          latitude: offsetPoint.latitude,
          longitude: offsetPoint.longitude,
        },
        pitch: 45, // 3D tilt like Google Maps
        heading: heading, // Rotate map so route points "up"
        zoom: 18 - Math.log2(zoomLevel * 1000), // Convert to zoom level
      }, { duration: 1000 });
    } else {
      console.log('🗺️ Map ref is null, cannot animate');
    }
  };

  const calculateBearing = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number => {
    const lat1 = from.latitude * (Math.PI / 180);
    const lat2 = to.latitude * (Math.PI / 180);
    const dLng = (to.longitude - from.longitude) * (Math.PI / 180);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    bearing = (bearing + 360) % 360; // Normalize to 0-360

    return bearing;
  };

  const calculateOffsetPoint = (
    from: { latitude: number; longitude: number },
    bearing: number,
    distance: number
  ): { latitude: number; longitude: number } => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = from.latitude * (Math.PI / 180);
    const lng1 = from.longitude * (Math.PI / 180);
    const brng = bearing * (Math.PI / 180);

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
    );

    const lng2 = lng1 + Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      latitude: lat2 * (180 / Math.PI),
      longitude: lng2 * (180 / Math.PI),
    };
  };

  const updateNavigationProgress = (location: Location.LocationObject) => {
    if (!isNavigating || !routeData || routeData.steps.length === 0) return;

    const currentStep = routeData.steps[currentStepIndex];
    if (!currentStep) return;

    // Calculate distance to current step's end point
    const distanceToStepEnd = calculateDistance(
      { latitude: location.coords.latitude, longitude: location.coords.longitude },
      currentStep.endLocation
    );

    // Update live distance countdown
    setDistanceToNextTurn(distanceToStepEnd);

    // Pre-announcement logic (300m before turn)
    if (distanceToStepEnd <= 300 && distanceToStepEnd > 50) {
      if (lastAnnouncedStep !== currentStepIndex) {
        announceInstruction(`In ${Math.round(distanceToStepEnd)} meters, ${currentStep.instruction}`, 'pre-announcement');
        setLastAnnouncedStep(currentStepIndex);
      }
    }

    // Vibration feedback when approaching turn (100m threshold)
    if (distanceToStepEnd <= 100 && distanceToStepEnd > 50) {
      const now = Date.now();
      if (now - lastVibrationTime > 2000) { // Prevent too frequent vibrations
        if (Platform.OS === 'ios') {
          Vibration.vibrate(100);
        } else {
          Vibration.vibrate([0, 100, 50, 100]);
        }
        setLastVibrationTime(now);
      }
    }

    // If we're close to the step end point, move to next step
    if (distanceToStepEnd < 50) {
      if (currentStepIndex < routeData.steps.length - 1) {
        // Animate instruction transition
        animateInstructionTransition();
        
        // Announce the turn
        announceInstruction(currentStep.instruction, 'turn');
        
        // Vibrate for turn
        if (Platform.OS === 'ios') {
          Vibration.vibrate(200);
        } else {
          Vibration.vibrate([0, 200, 100, 200]);
        }
        
        setCurrentStepIndex(currentStepIndex + 1);
        setLastAnnouncedStep(currentStepIndex + 1);
        
        // Set next instruction for display
        const nextStep = routeData.steps[currentStepIndex + 1];
        if (nextStep) {
          setNextInstruction(nextStep.instruction);
        }
      } else {
        // Reached destination
        announceInstruction('You have arrived at your destination', 'arrival');
        setIsNavigating(false);
        Alert.alert('Arrived!', 'You have reached your destination');
      }
    }

    // Calculate overall progress
    const totalDistance = routeData.steps.reduce((acc, step) => {
      return acc + calculateDistance(step.startLocation, step.endLocation);
    }, 0);

    const completedDistance = routeData.steps
      .slice(0, currentStepIndex)
      .reduce((acc, step) => {
        return acc + calculateDistance(step.startLocation, step.endLocation);
      }, 0);

    const currentStepProgress = 1 - (distanceToStepEnd / calculateDistance(
      currentStep.startLocation,
      currentStep.endLocation
    ));

    const overallProgress = ((completedDistance + (currentStepProgress * calculateDistance(
      currentStep.startLocation,
      currentStep.endLocation
    ))) / totalDistance) * 100;

    setProgress(Math.min(100, Math.max(0, overallProgress)));
  };

  const announceInstruction = (instruction: string, type: 'pre-announcement' | 'turn' | 'arrival') => {
    if (!voiceEnabled) return;
    
    // Stop any current speech
    Speech.stop();
    
    // Add context based on type
    let speechText = instruction;
    if (type === 'pre-announcement') {
      speechText = `Approaching: ${instruction}`;
    } else if (type === 'turn') {
      speechText = `Now: ${instruction}`;
    }
    
    Speech.speak(speechText, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        console.log('🗣️ Voice instruction completed');
      },
      onError: (error) => {
        console.log('🗣️ Voice instruction error:', error);
      }
    });
  };

  const animateInstructionTransition = () => {
    // Fade out current instruction
    Animated.sequence([
      Animated.timing(instructionAnimation, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(instructionAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters)}m`;
    }
  };

  const getDistanceColor = (distance: number): string => {
    if (distance <= 50) return '#ff4444'; // Red for immediate turn
    if (distance <= 100) return '#ff8800'; // Orange for approaching turn
    if (distance <= 300) return '#ffaa00'; // Yellow for pre-announcement
    return '#4CAF50'; // Green for normal distance
  };

  const calculateDistance = (
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = point1.latitude * (Math.PI / 180);
    const lng1 = point1.longitude * (Math.PI / 180);
    const lat2 = point2.latitude * (Math.PI / 180);
    const lng2 = point2.longitude * (Math.PI / 180);

    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getManeuverIcon = (maneuver: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'turn-left': 'arrow-back',
      'turn-right': 'arrow-forward',
      'turn-slight-left': 'arrow-back-outline',
      'turn-slight-right': 'arrow-forward-outline',
      'turn-sharp-left': 'arrow-back-circle',
      'turn-sharp-right': 'arrow-forward-circle',
      'uturn-left': 'refresh',
      'uturn-right': 'refresh',
      'straight': 'arrow-up',
      'ramp-left': 'arrow-back',
      'ramp-right': 'arrow-forward',
      'merge': 'git-branch',
      'fork-left': 'arrow-back',
      'fork-right': 'arrow-forward',
      'ferry': 'boat-outline',
      'roundabout-left': 'refresh',
      'roundabout-right': 'refresh',
    };

    return iconMap[maneuver] || 'arrow-up';
  };

  const startNavigation = () => {
    if (!currentLocation || !isValidLocation(currentLocation.coords)) {
      Alert.alert(
        'Location Error',
        'Could not get a valid current location. Please enable location services or set a location in the simulator.'
      );
      return;
    }
    const coords = currentLocation.coords || currentLocation;
    lastRouteOriginRef.current = { latitude: coords.latitude, longitude: coords.longitude };
    setRouteData(null); // Clear old route
    calculateRoute(
      { coords: makeCoords(coords.latitude, coords.longitude), timestamp: Date.now() },
      destination
    );
    // Navigation will start after routeData is set by useEffect
    setPendingNavigation(true);
  };

  const stopNavigation = () => {
    console.log('🛑 Stopping navigation...');
    setIsNavigating(false);
    stopLocationTracking();
    stopDebugLocationTracking();
    
    // Zoom out to show full route
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
    
    Alert.alert('Navigation Stopped', 'Turn-by-turn navigation has been stopped');
  };

  const toggleDebugMode = () => {
    setDebugMode((prev) => {
      const newDebugMode = !prev;
      if (newDebugMode && currentLocation && isValidLocation(currentLocation)) {
        const coords = currentLocation.coords || currentLocation;
        lastRouteOriginRef.current = { latitude: coords.latitude, longitude: coords.longitude };
        setRouteData(null);
        calculateRoute(
          { coords: makeCoords(coords.latitude, coords.longitude), timestamp: Date.now() },
          destination
        );
      }
      return newDebugMode;
    });
  };

  // Helper to compare durations (e.g., '12 mins' vs '10 mins')
  function parseDuration(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // Traffic-aware rerouting effect
  useEffect(() => {
    if (!isNavigating || !routeData) return;
    if (rerouteTimerRef.current) clearInterval(rerouteTimerRef.current);
    rerouteTimerRef.current = setInterval(async () => {
      setRerouting(true);
      try {
        // Use trafficModel=best_guess for Directions API
        let coords = { latitude: 0, longitude: 0 };
        if (currentLocation && currentLocation.coords) {
          coords = {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          };
        }
        const data = await fetchDirections(
          makeCoords(coords.latitude, coords.longitude),
          destination,
          localWaypoints,
          'best_guess' // trafficModel
        );
        const newLeg = data.routes[0].legs[0];
        const newDuration = newLeg.duration.text;
        if (lastRouteDuration && parseDuration(newDuration) < parseDuration(lastRouteDuration)) {
          Alert.alert(
            'Faster Route Found',
            `A faster route is available (${newDuration} vs ${lastRouteDuration}). Reroute?`,
            [
              { text: 'Ignore', style: 'cancel' },
              { text: 'Reroute', onPress: () => setRouteData(routeData => ({ ...routeData!, steps: routeData!.steps, totalDuration: newDuration })) }
            ]
          );
        }
        setLastRouteDuration(newDuration);
      } catch (e) {
        // Ignore errors
      }
      setRerouting(false);
    }, TRAFFIC_REROUTE_INTERVAL);
    return () => {
      if (rerouteTimerRef.current) clearInterval(rerouteTimerRef.current);
    };
  }, [isNavigating, routeData, currentLocation, localWaypoints, destination, lastRouteDuration]);

  if (locationLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 16 }}>Getting your location...</Text>
      </View>
    );
  }
  if (locationError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#e11d48', fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>{locationError}</Text>
        <TouchableOpacity
          style={{ backgroundColor: '#2563EB', borderRadius: 24, paddingVertical: 16, paddingHorizontal: 32, elevation: 4 }}
          onPress={async () => {
            setLocationLoading(true);
            setLocationError(null);
            try {
              let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              setCurrentLocation(location);
              setLocationLoading(false);
              await calculateRoute(location, destination);
            } catch (e) {
              setLocationError('Could not get your current location. Using default location.');
              setCurrentLocation(DEFAULT_LOCATION);
              setLocationLoading(false);
              await calculateRoute(DEFAULT_LOCATION, destination);
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!routeData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Calculating route...</Text>
      </View>
    );
  }

  console.log('🎯 Rendering TurnByTurnNavigation:', {
    isNavigating,
    debugMode,
    hasRouteData: !!routeData,
    currentStepIndex,
    progress,
  });

  return (
    <View style={styles.container}>
      {/* Debug Info - Temporary */}
      <View style={styles.debugInfoPanel}>
        <Text style={styles.debugInfoText}>
          isNavigating: {isNavigating ? 'true' : 'false'}
        </Text>
        <Text style={styles.debugInfoText}>
          debugMode: {debugMode ? 'true' : 'false'}
        </Text>
        <Text style={styles.debugInfoText}>
          routeData: {routeData ? 'loaded' : 'loading'}
        </Text>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        region={isNavigating ? (navigationRegion || region || undefined) : (region || undefined)}
        showsUserLocation={true}
        showsMyLocationButton={!isNavigating}
        showsCompass={!isNavigating}
        showsScale={!isNavigating}
        loadingEnabled={true}
        loadingIndicatorColor="#2563EB"
        loadingBackgroundColor="#ffffff"
        followsUserLocation={isNavigating}
        userLocationPriority="high"
        userLocationUpdateInterval={1000}
        userLocationFastestInterval={1000}
      >
        {/* Origin Marker */}
        {!isNavigating && (
          <Marker
            coordinate={{
              latitude: typeof routeData.origin.latitude === 'number' ? routeData.origin.latitude : 0,
              longitude: typeof routeData.origin.longitude === 'number' ? routeData.origin.longitude : 0,
            } as any}
            title="Start"
            description="Your starting point"
            pinColor="#10B981"
          />
        )}

        {/* Destination Marker */}
        {!isNavigating && (
          <Marker
            coordinate={{
              latitude: typeof routeData.destination.latitude === 'number' ? routeData.destination.latitude : 0,
              longitude: typeof routeData.destination.longitude === 'number' ? routeData.destination.longitude : 0,
            } as any}
            title="Destination"
            description={destination.title}
            pinColor="#EF4444"
          />
        )}

        {/* Route Polyline */}
        {routeData?.overviewPolyline && routeData.overviewPolyline.length > 1 && (
          <Polyline
            coordinates={routeData.overviewPolyline}
            strokeColor="#2563EB"
            strokeWidth={6}
            zIndex={10}
          />
        )}

        {/* Current Location Marker (during navigation) */}
        {isNavigating && currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            title="You are here"
            description="Current location"
            pinColor="#2563EB"
            zIndex={1000}
          />
        )}

        {/* Show all waypoints as markers */}
        {localWaypoints.map((wp, idx) => (
          <Marker
            key={`waypoint-${idx}`}
            coordinate={{ latitude: wp.latitude, longitude: wp.longitude }}
            title={wp.title || `Stop ${idx + 1}`}
            pinColor="#10B981"
          />
        ))}

        {/* Render all alternative routes as polylines */}
        {allRoutes.map((route, idx) => (
          <Polyline
            key={`route-${idx}`}
            coordinates={decodePolyline(route.overview_polyline.points)}
            strokeColor={idx === selectedRouteIndex ? '#2563EB' : '#A5B4FC'}
            strokeWidth={idx === selectedRouteIndex ? 6 : 4}
            zIndex={idx === selectedRouteIndex ? 20 : 10}
            tappable
            onPress={() => setSelectedRouteIndex(idx)}
          />
        ))}
      </MapView>

      {/* Header - Only show when not navigating */}
      {!isNavigating && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Navigation</Text>
          <TouchableOpacity style={styles.debugButton} onPress={toggleDebugMode}>
            <Text style={[styles.debugButtonText, debugMode && styles.debugButtonActive]}>
              {debugMode ? '🐛 ON' : '🐛 OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Status Indicator - Show when navigating */}
      {isNavigating && (
        <View style={styles.navigationStatusIndicator}>
          <Text style={styles.navigationStatusText}>
            🧭 Navigation Active {debugMode && '🐛 (Simulated)'}
          </Text>
        </View>
      )}

      {/* Navigation Controls - move above route info and increase zIndex */}
      <View style={[styles.controls, { bottom: 180, zIndex: 2000 }]}> 
        {!isNavigating ? (
          <TouchableOpacity style={styles.startButton} onPress={startNavigation}>
            <Text style={styles.startButtonText}>🚀 Start Navigation</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopNavigation}>
            <Text style={styles.stopButtonText}>🛑 Stop Navigation</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* In the navigation UI, add a toggle for voice guidance */}
      <View style={{ position: 'absolute', top: 60, right: 20, zIndex: 100 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, elevation: 2 }}
          onPress={() => setVoiceEnabled(v => !v)}
        >
          <Ionicons name={voiceEnabled ? 'volume-high' : 'volume-mute'} size={22} color={voiceEnabled ? '#2563EB' : '#9CA3AF'} />
          <Text style={{ marginLeft: 8, color: voiceEnabled ? '#2563EB' : '#9CA3AF', fontWeight: 'bold' }}>{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Steps Panel - Enhanced for active navigation */}
      {isNavigating && (
        <Animated.View 
          style={[
            styles.navigationPanel,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              }],
            },
          ]}
        >
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>

          {/* Current Step - Enhanced for navigation */}
          <View style={styles.currentStepEnhanced}>
            <View style={styles.maneuverIconContainer}>
              <Ionicons
                name={getManeuverIcon(routeData.steps[currentStepIndex]?.maneuver || 'straight')}
                size={32}
                color="#2563EB"
              />
            </View>
            <View style={styles.stepContentEnhanced}>
              <Text style={styles.stepInstructionEnhanced}>
                {routeData.steps[currentStepIndex]?.instruction}
              </Text>
              <Text style={styles.stepDistanceEnhanced}>
                {routeData.steps[currentStepIndex]?.distance} • {routeData.steps[currentStepIndex]?.duration}
              </Text>
            </View>
          </View>

          {/* Next Steps - Compact view */}
          <ScrollView style={styles.nextStepsCompact} showsVerticalScrollIndicator={false}>
            {routeData.steps.slice(currentStepIndex + 1, currentStepIndex + 3).map((step, index) => (
              <View key={index} style={styles.nextStepCompact}>
                <Ionicons
                  name={getManeuverIcon(step.maneuver)}
                  size={16}
                  color="#9CA3AF"
                />
                <Text style={styles.nextStepInstructionCompact}>{step.instruction}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Route Info (when not actively navigating) */}
      {!isNavigating && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>{destination.title}</Text>
          <Text style={styles.routeDetails}>
            {routeData.totalDistance} • {routeData.totalDuration}
          </Text>
          {debugMode && (
            <Text style={styles.debugInfo}>🐛 Debug Mode: Will simulate movement</Text>
          )}
        </View>
      )}

      {/* Navigation Status Bar - Only show when navigating */}
      {isNavigating && (
        <Animated.View 
          style={[
            styles.navigationStatusBar,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.navigationStatusText}>
            {routeData.steps[currentStepIndex]?.distance} remaining
            {debugMode && ' (Simulated)'}
          </Text>
        </Animated.View>
      )}
      {rerouting && (
        <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 10000 }}>
          <View style={{ backgroundColor: '#F59E42', padding: 8, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Rerouting for traffic...</Text>
          </View>
        </View>
      )}

      {/* Show ETA/distance for the selected route */}
      {allRoutes[selectedRouteIndex] && (
        <View style={{ position: 'absolute', bottom: 180, left: 0, right: 0, alignItems: 'center', zIndex: 200 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 4, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{allRoutes[selectedRouteIndex].legs[0].distance.text} • {allRoutes[selectedRouteIndex].legs[0].duration.text}</Text>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>Route {selectedRouteIndex + 1} of {allRoutes.length}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  debugButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  debugButtonActive: {
    color: '#2563EB',
  },
  controls: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationPanel: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  currentStepEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    marginBottom: 8,
  },
  maneuverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepContentEnhanced: {
    flex: 1,
    marginLeft: 12,
  },
  stepInstructionEnhanced: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDistanceEnhanced: {
    fontSize: 14,
    color: '#6B7280',
  },
  nextStepsCompact: {
    maxHeight: 80,
  },
  nextStepCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  nextStepInstructionCompact: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  routeInfo: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  routeDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  debugInfo: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 8,
    fontStyle: 'italic',
  },
  navigationStatusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1001,
  },
  navigationStatusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationStatusIndicator: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 1001,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  debugInfoPanel: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  debugInfoText: {
    fontSize: 12,
    color: '#374151',
  },
});