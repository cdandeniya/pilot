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
  StatusBar,
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
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows, layout } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
// Import the custom map style from HomeScreen
import { CRUISE_MAP_STYLE } from '../screens/HomeScreen';

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

function isValidDestination(dest: any) {
  return dest && typeof dest.latitude === 'number' && typeof dest.longitude === 'number';
}

async function fetchDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints: Array<{ latitude: number; longitude: number }> = [],
  trafficModel: string = ''
): Promise<any> {
  const waypointsStr = waypoints.length > 0 
    ? `&waypoints=${waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|')}` 
    : '';
  
  const trafficStr = trafficModel ? `&traffic_model=${trafficModel}` : '';
  
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsStr}${trafficStr}&key=${GOOGLE_MAPS_API_KEY}`;
  
  console.log('🔍 Fetching directions from:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('🔍 Directions API response:', {
      status: data.status,
      routes_count: data.routes?.length || 0,
      steps_count: data.routes?.[0]?.legs?.[0]?.steps?.length || 0,
      has_overview_polyline: !!data.routes?.[0]?.overview_polyline?.points,
      overview_polyline_length: data.routes?.[0]?.overview_polyline?.points?.length || 0,
    });
    
    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];
      
      console.log('🔍 Directions API response:', {
        end_location: leg.end_location,
        start_location: leg.start_location,
        steps: leg.steps?.map((step: any) => ({
          end: step.end_location,
          instruction: step.html_instructions,
          start: step.start_location,
        })),
      });
      
      return {
        origin: leg.start_location,
        destination: leg.end_location,
        steps: leg.steps?.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance?.text || '',
          duration: step.duration?.text || '',
          maneuver: step.maneuver?.instruction || 'straight',
          startLocation: step.start_location,
          endLocation: step.end_location,
          polyline: step.polyline?.points ? decodePolyline(step.polyline.points) : [],
        })) || [],
        totalDistance: leg.distance?.text || '',
        totalDuration: leg.duration?.text || '',
        overviewPolyline: route.overview_polyline?.points ? decodePolyline(route.overview_polyline.points) : [],
      };
    } else {
      throw new Error(`Directions API error: ${data.status}`);
    }
  } catch (error) {
    console.error('❌ Error fetching directions:', error);
    throw error;
  }
}

function isValidLocation(loc: any) {
  return loc && 
         typeof loc.coords?.latitude === 'number' && 
         typeof loc.coords?.longitude === 'number' &&
         !isNaN(loc.coords.latitude) && 
         !isNaN(loc.coords.longitude);
}

function makeCoords(lat: number, lng: number): Location.LocationObjectCoords {
  return {
    latitude: lat,
    longitude: lng,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  };
}

function makeFullCoords(lat: number, lng: number) {
  return {
    coords: makeCoords(lat, lng),
    timestamp: Date.now(),
  };
}

export default function TurnByTurnNavigation({
  destination,
  origin,
  onClose,
  waypoints = [],
}: TurnByTurnNavigationProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [navigationRegion, setNavigationRegion] = useState<Region | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [localWaypoints, setLocalWaypoints] = useState(waypoints);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1)); // Start visible
  const [slideAnim] = useState(new Animated.Value(1)); // Start at final position
  const mapRef = useRef<MapView | null>(null);

  // Animation for instruction transitions
  const animateInstructionTransition = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
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
    });
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  const getDistanceColor = (distance: number): string => {
    if (distance < 100) return colors.success;
    if (distance < 500) return colors.warning;
    return colors.danger;
  };

  const calculateDistance = (
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getManeuverIcon = (maneuver: string): keyof typeof Ionicons.glyphMap => {
    switch (maneuver.toLowerCase()) {
      case 'turn-left':
        return 'arrow-back';
      case 'turn-right':
        return 'arrow-forward';
      case 'turn-slight-left':
        return 'arrow-back-outline';
      case 'turn-slight-right':
        return 'arrow-forward-outline';
      case 'turn-sharp-left':
        return 'arrow-back-circle';
      case 'turn-sharp-right':
        return 'arrow-forward-circle';
      case 'uturn-left':
        return 'refresh';
      case 'uturn-right':
        return 'refresh';
      case 'straight':
      default:
        return 'arrow-up';
    }
  };

  const startNavigation = () => {
    if (!routeData) return;
    
    console.log('🚀 Starting navigation...');
    setIsNavigating(true);
    setCurrentStepIndex(0);
    setProgress(0);
    
    // Start location tracking
    startLocationTracking();
    
    // Announce first instruction
    if (voiceEnabled && routeData.steps[0]) {
      announceInstruction(routeData.steps[0].instruction, 'pre-announcement');
    }
    
    console.log('🚀 Navigation started, isNavigating should be true');
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    setProgress(0);
    stopLocationTracking();
    
    if (voiceEnabled) {
      Speech.stop();
    }
  };

  const announceInstruction = (instruction: string, type: 'pre-announcement' | 'turn' | 'arrival') => {
    if (!voiceEnabled) return;
    
    let text = instruction;
    if (type === 'pre-announcement') {
      text = `In 300 meters, ${instruction}`;
    } else if (type === 'arrival') {
      text = `You have arrived at your destination`;
    }
    
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for navigation.');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (location) => {
          setCurrentLocation(location);
          if (isNavigating) {
            updateNavigationView(location);
            updateNavigationProgress(location);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('❌ Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const updateNavigationView = (location: Location.LocationObject) => {
    if (!routeData || !isNavigating) return;

    console.log('🗺️ Updating navigation view for location:', location.coords);

    // Find the closest step to current location
    let closestStepIndex = 0;
    let minDistance = Infinity;

    routeData.steps.forEach((step, index) => {
      const distance = calculateDistance(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        step.startLocation
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestStepIndex = index;
      }
    });

    // Update current step if we've moved to a new step
    if (closestStepIndex !== currentStepIndex) {
      setCurrentStepIndex(closestStepIndex);
      animateInstructionTransition();
      
      // Announce the new instruction
      if (voiceEnabled && routeData.steps[closestStepIndex]) {
        announceInstruction(routeData.steps[closestStepIndex].instruction, 'turn');
      }
      
      // Vibrate for turn notifications
      Vibration.vibrate(200);
    }

    // Calculate navigation region
    const currentStep = routeData.steps[closestStepIndex];
    if (currentStep) {
      const distanceToNextTurn = calculateDistance(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        currentStep.endLocation
      );

      const bearing = calculateBearing(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        currentStep.endLocation
      );

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006 * ASPECT_RATIO,
      };

      setNavigationRegion(newRegion);
      console.log('🗺️ Setting navigation region:', {
        distanceToNextTurn,
        heading: bearing,
        region: newRegion,
        zoomLevel: 0.006,
      });
    }
  };

  const calculateBearing = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number => {
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360;
  };

  const updateNavigationProgress = (location: Location.LocationObject) => {
    if (!routeData || !isNavigating) return;

    // Calculate total route distance
    let totalDistance = 0;
    routeData.steps.forEach((step) => {
      totalDistance += calculateDistance(step.startLocation, step.endLocation);
    });

    // Calculate distance traveled
    let distanceTraveled = 0;
    for (let i = 0; i < currentStepIndex; i++) {
      distanceTraveled += calculateDistance(
        routeData.steps[i].startLocation,
        routeData.steps[i].endLocation
      );
    }

    // Add distance from current location to current step end
    if (routeData.steps[currentStepIndex]) {
      const currentStepDistance = calculateDistance(
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        routeData.steps[currentStepIndex].endLocation
      );
      distanceTraveled += currentStepDistance;
    }

    const newProgress = Math.min((distanceTraveled / totalDistance) * 100, 100);
    setProgress(newProgress);
  };

  // Calculate route on component mount
  useEffect(() => {
    const calculateRoute = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation(location);

        // Calculate route
        const route = await fetchDirections(
          { latitude: location.coords.latitude, longitude: location.coords.longitude },
          destination,
          localWaypoints
        );

        setRouteData(route);

        // Set initial region
        const initialRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0922 * ASPECT_RATIO,
        };
        setRegion(initialRegion);

        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error calculating route:', error);
        setError('Failed to calculate route. Please try again.');
        setIsLoading(false);
      }
    };

    calculateRoute();
  }, [destination, localWaypoints]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
      if (voiceEnabled) {
        Speech.stop();
      }
    };
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.danger} />
        <Text style={styles.errorTitle}>Navigation Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!routeData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Calculating route...</Text>
      </View>
    );
  }

  console.log('🎯 Rendering TurnByTurnNavigation:', {
    currentStepIndex,
    isNavigating,
    hasRouteData: !!routeData,
    progress,
    stepsCount: routeData?.steps?.length || 0
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
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
        loadingIndicatorColor={colors.primary}
        loadingBackgroundColor={colors.background}
        followsUserLocation={isNavigating}
        userLocationPriority="high"
        userLocationUpdateInterval={1000}
        userLocationFastestInterval={1000}
        customMapStyle={CRUISE_MAP_STYLE}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
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
            pinColor={colors.success}
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
            pinColor={colors.danger}
          />
        )}

        {/* Route Polyline */}
        {routeData?.overviewPolyline && routeData.overviewPolyline.length > 1 && (
          <Polyline
            coordinates={routeData.overviewPolyline}
            strokeColor={colors.primary}
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
            pinColor={colors.primary}
          />
        )}
      </MapView>

      {/* Header - Only show when not navigating */}
      {!isNavigating && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Navigation</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Navigation Controls */}
      <View style={styles.controls}>
        {!isNavigating ? (
          <TouchableOpacity style={styles.startButton} onPress={startNavigation}>
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.startButtonGradient}
            >
              <Ionicons name="navigate" size={24} color={colors.textInverse} />
              <Text style={styles.startButtonText}>Start Navigation</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={stopNavigation}>
            <LinearGradient
              colors={colors.gradientDanger}
              style={styles.stopButtonGradient}
            >
              <Ionicons name="stop" size={24} color={colors.textInverse} />
              <Text style={styles.stopButtonText}>Stop Navigation</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Voice Toggle */}
      <View style={styles.voiceToggle}>
        <TouchableOpacity
          style={[styles.voiceToggleButton, voiceEnabled && styles.voiceToggleActive]}
          onPress={() => setVoiceEnabled(v => !v)}
        >
          <Ionicons 
            name={voiceEnabled ? 'volume-high' : 'volume-mute'} 
            size={20} 
            color={voiceEnabled ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.voiceToggleText, voiceEnabled && styles.voiceToggleTextActive]}>
            {voiceEnabled ? 'Voice ON' : 'Voice OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Voice Command Button - For driving commands */}
      <View style={[styles.voiceToggle, { top: spacing.xl + 100 }]}>
        <TouchableOpacity
          style={[styles.voiceToggleButton, { backgroundColor: colors.infoLight }]}
          onPress={() => {
            // This would open voice recognition
            console.log('🎤 Voice command button pressed');
            // In a real implementation, this would trigger voice recognition
            // For now, just speak a helpful message
            Speech.speak('Say "Hey Cruise" followed by your command. For example: "Hey Cruise, where am I?" or "Hey Cruise, find gas station"', {
              language: 'en-US',
              pitch: 1.0,
              rate: 0.9,
            });
          }}
        >
          <Ionicons 
            name="mic" 
            size={20} 
            color={colors.info} 
          />
          <Text style={[styles.voiceToggleText, { color: colors.info }]}>
            Voice Commands
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Steps Panel - Show enhanced UI when navigating */}
      {routeData && isNavigating && (
        <View style={styles.navigationPanel}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={colors.gradientPrimary}
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
                color={colors.primary}
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
              <View key={index} style={styles.nextStepItem}>
                <Ionicons
                  name={getManeuverIcon(step.maneuver)}
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.nextStepText} numberOfLines={1}>
                  {step.instruction}
                </Text>
                <Text style={styles.nextStepDistance}>
                  {step.distance}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Route Summary - Show when not navigating */}
      {!isNavigating && routeData && (
        <View style={styles.routeSummary}>
          <View style={styles.routeInfo}>
            <Text style={styles.destinationTitle}>{destination.title}</Text>
            <Text style={styles.routeDetails}>
              {routeData.totalDistance} • {routeData.totalDuration}
            </Text>
          </View>
          
          {/* Route Preview - Show first few steps */}
          <ScrollView style={styles.routePreview} showsVerticalScrollIndicator={false}>
            {routeData.steps.slice(0, 3).map((step, index) => (
              <View key={index} style={styles.routePreviewItem}>
                <Ionicons
                  name={getManeuverIcon(step.maneuver)}
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.routePreviewText} numberOfLines={1}>
                  {step.instruction}
                </Text>
                <Text style={styles.routePreviewDistance}>
                  {step.distance}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.danger,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
      closeButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.glass,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.sm,
    },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48, // Match close button width
  },
  controls: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    color: colors.textInverse,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    marginLeft: spacing.sm,
  },
  stopButton: {
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  stopButtonText: {
    color: colors.textInverse,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    marginLeft: spacing.sm,
  },
      navigationPanel: {
      position: 'absolute',
      top: spacing.xl + 40,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      maxHeight: 200,
      ...shadows.md,
      zIndex: 1000,
    },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
      currentStepEnhanced: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.infoLight,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    maneuverIconContainer: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.sm,
    },
  stepContentEnhanced: {
    flex: 1,
    marginLeft: spacing.md,
  },
  stepInstructionEnhanced: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDistanceEnhanced: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  nextStepsCompact: {
    maxHeight: 80,
  },
      nextStepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.md,
      marginBottom: spacing.xs,
    },
  nextStepText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  nextStepDistance: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
      routeSummary: {
      position: 'absolute',
      bottom: spacing.xl + 20,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.md,
      zIndex: 1000,
    },
  routeInfo: {
    alignItems: 'center',
  },
  destinationTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  routeDetails: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  routePreview: {
    maxHeight: 120,
    marginTop: spacing.sm,
  },
  routePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  routePreviewText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  routePreviewDistance: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

      voiceToggle: {
      position: 'absolute',
      top: spacing.xl + 40,
      right: spacing.md,
      backgroundColor: colors.glass,
      borderRadius: borderRadius.lg,
      padding: spacing.sm,
      ...shadows.sm,
      zIndex: 1000,
    },
  voiceToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceToggleActive: {
    backgroundColor: colors.primaryLight,
  },
  voiceToggleText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  voiceToggleTextActive: {
    color: colors.primary,
  },
});