import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
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
import FloatingActionButton from '../components/FloatingActionButton';
import Card from '../components/Card';
import VoiceRecognition from '../components/VoiceRecognition';
import ConversationHistory from '../components/ConversationHistory';
import SmartPreferences from '../components/SmartPreferences';
import VoiceResultsCard from '../components/VoiceResultsCard';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows, layout } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import VoiceAssistant, { VoiceResponse, ConversationContext } from '../services/VoiceAssistant';
import AIService, { AIResponse, RouteSuggestion } from '../services/AIService';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Custom map style for a modern look
export const CRUISE_MAP_STYLE = [
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [
      {
        saturation: 36,
      },
      {
        color: '#333333',
      },
      {
        lightness: 40,
      },
    ],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        visibility: 'on',
      },
      {
        color: '#ffffff',
      },
      {
        lightness: 16,
      },
    ],
  },
  {
    featureType: 'all',
    elementType: 'labels.icon',
    stylers: [
      {
        visibility: 'off',
      },
    ],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#fefefe',
      },
      {
        lightness: 20,
      },
    ],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#fefefe',
      },
      {
        lightness: 17,
      },
      {
        weight: 1.2,
      },
    ],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f5f5f5',
      },
      {
        lightness: 20,
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f5f5f5',
      },
      {
        lightness: 21,
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#dedede',
      },
      {
        lightness: 21,
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#ffffff',
      },
      {
        lightness: 17,
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#ffffff',
      },
      {
        lightness: 29,
      },
      {
        weight: 0.2,
      },
    ],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff',
      },
      {
        lightness: 18,
      },
    ],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff',
      },
      {
        lightness: 16,
      },
    ],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      {
        color: '#f2f2f2',
      },
      {
        lightness: 19,
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#c9c9c9',
      },
      {
        lightness: 17,
      },
    ],
  },
];

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('standard');
  const [routeData, setRouteData] = useState<any>(null);
  const [showVoiceRecognition, setShowVoiceRecognition] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [showSmartPreferences, setShowSmartPreferences] = useState(false);
  const [lastVoiceResponse, setLastVoiceResponse] = useState<VoiceResponse | AIResponse | null>(null);
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    recentDestinations: [],
    userPreferences: [],
    conversationHistory: [],
  });
  const [routeSuggestions, setRouteSuggestions] = useState<RouteSuggestion[]>([]);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    getCurrentLocation();
    initializeVoiceAssistant();
  }, []);

  const initializeVoiceAssistant = async () => {
    try {
      await VoiceAssistant.initialize();
      VoiceAssistant.setOnVoiceResult(handleVoiceResponse);
      
      // Load conversation context
      const context = VoiceAssistant.getContext();
      setConversationContext(context);
      
      console.log('🎤 VoiceAssistant initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing VoiceAssistant:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation(location);
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Handle search logic here
  };

  const handleVoiceResponse = async (response: VoiceResponse | AIResponse) => {
    console.log('🎤 Voice response received:', response);
    setLastVoiceResponse(response);
    
    // Update conversation context
    if (currentLocation) {
      VoiceAssistant.updateCurrentLocation(currentLocation);
    }
    
    // Process with AI service for enhanced responses
    if (response.type === 'navigation' && response.navigationRequest) {
      const destination = response.navigationRequest.destination;
      console.log('🎤 Navigating to:', destination);
      
      // In a real app, you would geocode the destination here
      // For now, we'll use a mock destination
      const mockDestination = {
        latitude: 37.7749,
        longitude: -122.4194,
        title: destination,
      };
      
      navigation.navigate('Navigation', {
        destination: mockDestination,
        origin: currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        } : undefined,
      });
    } else if (response.type === 'search' && response.searchRequest) {
      console.log('🎤 Searching for:', response.searchRequest.query);
      // Handle search - could show results in a modal
      Alert.alert('Search', `Searching for ${response.searchRequest.query} near your location`);
    } else if (response.type === 'preference') {
      console.log('🎤 Learning preference:', response.entities?.preference);
      // Update preferences
      const updatedContext = VoiceAssistant.getContext();
      setConversationContext(updatedContext);
    }
    
    // Generate route suggestions
    if (routeData) {
      const suggestions = await AIService.generateRouteSuggestions(
        routeData,
        conversationContext.userPreferences,
        3600 // 1 hour driving time
      );
      setRouteSuggestions(suggestions);
    }
  };

  const handleVoiceNavigationRequest = (destination: { latitude: number; longitude: number; title: string }) => {
    console.log('🎤 Voice navigation request:', destination);
    navigation.navigate('Navigation', {
      destination,
      origin: currentLocation ? {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      } : undefined,
    });
  };

  const handleVoiceSearchRequest = (places: Array<{ name: string; place_id: string; location: { lat: number; lng: number } }>) => {
    console.log('🎤 Voice search request:', places);
    // Handle search results - could show a modal with places
    // For now, just navigate to the first place
    if (places.length > 0) {
      const firstPlace = places[0];
      handleVoiceNavigationRequest({
        latitude: firstPlace.location.lat,
        longitude: firstPlace.location.lng,
        title: firstPlace.name,
      });
    }
  };

  const handleMyLocation = () => {
    if (currentLocation) {
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  const handleFavorites = () => {
    // Handle favorites
    console.log('Favorites pressed');
  };

  const handleRecent = () => {
    // Handle recent
    console.log('Recent pressed');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleConversationHistory = () => {
    setShowConversationHistory(!showConversationHistory);
  };

  const handleSmartPreferences = () => {
    setShowSmartPreferences(!showSmartPreferences);
  };

  const handleSuggestionPress = (suggestion: string) => {
    console.log('Suggestion pressed:', suggestion);
    // Handle suggestion actions
    Alert.alert('Action', `Executing: ${suggestion}`);
  };

  const handleRouteSuggestionPress = (suggestion: RouteSuggestion) => {
    console.log('Route suggestion pressed:', suggestion);
    // Handle route suggestion actions
    Alert.alert('Route Suggestion', suggestion.description);
  };

  const handlePreferenceUpdate = (preference: any) => {
    console.log('Preference updated:', preference);
    // Update preference in VoiceAssistant
    const updatedContext = VoiceAssistant.getContext();
    setConversationContext(updatedContext);
  };

  const handlePreferenceDelete = (preferenceId: string) => {
    console.log('Preference deleted:', preferenceId);
    // Delete preference from VoiceAssistant
    const updatedContext = VoiceAssistant.getContext();
    setConversationContext(updatedContext);
  };

  const handlePreferenceAdd = (preference: any) => {
    console.log('Preference added:', preference);
    // Add preference to VoiceAssistant
    const updatedContext = VoiceAssistant.getContext();
    setConversationContext(updatedContext);
  };

  const handleVoiceButton = () => {
    setShowVoiceRecognition(!showVoiceRecognition);
  };

  const getMapStyle = () => {
    switch (selectedLayer) {
      case 'satellite':
        return [];
      case 'terrain':
        return [];
      default:
        return CRUISE_MAP_STYLE;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        region={region || undefined}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor={colors.primary}
        loadingBackgroundColor={colors.background}
        customMapStyle={getMapStyle()}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {/* Route Polyline */}
        {routeData?.overviewPolyline && routeData.overviewPolyline.length > 1 && (
          <Polyline
            coordinates={routeData.overviewPolyline}
            strokeColor={colors.primary}
            strokeWidth={6}
            zIndex={10}
          />
        )}
      </MapView>

      {/* Top Section */}
      <View style={styles.topSection}>
        <SearchBar
          onLocationSelect={(data, details) => {
            console.log('Location selected:', data);
            handleSearch(data.name);
          }}
          onVoiceSearch={handleVoiceButton}
          searchText={searchQuery}
          onSearchTextChange={setSearchQuery}
        />
      </View>

      {/* AI Speaking Indicator */}
      {isAISpeaking && (
        <Card style={styles.aiSpeakingCard}>
          <View style={styles.aiSpeakingContent}>
            <Ionicons name="mic" size={20} color={colors.primary} />
            <Text style={styles.aiSpeakingText}>Cruise is speaking...</Text>
          </View>
        </Card>
      )}

      {/* Voice Results Card */}
      {lastVoiceResponse && (
        <Card style={styles.voiceResultsCard}>
          <View style={styles.voiceResponseContent}>
            <View style={styles.voiceResponseHeader}>
              <Ionicons name="mic" size={20} color={colors.primary} />
              <Text style={styles.voiceResponseTitle}>Cruise Response</Text>
              <TouchableOpacity onPress={() => setLastVoiceResponse(null)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.voiceResponseText}>{lastVoiceResponse.content}</Text>
            {lastVoiceResponse.suggestions && lastVoiceResponse.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {lastVoiceResponse.suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionButton}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Conversation History */}
      {showConversationHistory && (
        <Card style={styles.conversationHistoryCard}>
          <ConversationHistory
            context={conversationContext}
            onSuggestionPress={handleSuggestionPress}
            onRouteSuggestionPress={handleRouteSuggestionPress}
            maxHeight={300}
          />
        </Card>
      )}

      {/* Smart Preferences */}
      {showSmartPreferences && (
        <Card style={styles.smartPreferencesCard}>
          <SmartPreferences
            preferences={conversationContext.userPreferences}
            onPreferenceUpdate={handlePreferenceUpdate}
            onPreferenceDelete={handlePreferenceDelete}
            onPreferenceAdd={handlePreferenceAdd}
          />
        </Card>
      )}

      {/* Voice Recognition Modal */}
      <Modal
        visible={showVoiceRecognition}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoiceRecognition(false)}
      >
        <View style={styles.voiceModalOverlay}>
          <View style={styles.voiceModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVoiceRecognition(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <VoiceRecognition
              onNavigationRequest={handleVoiceNavigationRequest}
              onSearchRequest={handleVoiceSearchRequest}
            />
          </View>
        </View>
      </Modal>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <FloatingActionButton
            icon="location"
            onPress={handleMyLocation}
            size="small"
            variant="secondary"
          />
          <FloatingActionButton
            icon="heart"
            onPress={handleFavorites}
            size="small"
            variant="secondary"
          />
                  <FloatingActionButton
          icon="time"
          onPress={handleRecent}
          size="small"
          variant="secondary"
        />
        <FloatingActionButton
          icon="chatbubbles"
          onPress={handleConversationHistory}
          size="small"
          variant="secondary"
        />
        <FloatingActionButton
          icon="settings"
          onPress={handleSmartPreferences}
          size="small"
          variant="secondary"
        />
        </View>

        {/* Main Navigation Button */}
        <TouchableOpacity
          style={styles.mainNavButton}
          onPress={() => navigation.navigate('Navigation')}
        >
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.mainNavButtonGradient}
          >
            <Ionicons name="navigate" size={32} color={colors.textInverse} />
            <Text style={styles.mainNavButtonText}>Navigate</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Voice Button */}
        <FloatingActionButton
          icon="mic"
          onPress={handleVoiceButton}
          size="large"
          variant="primary"
          style={styles.voiceButton}
        />
      </View>

      {/* Layer Selection Modal */}
      <Modal
        visible={showLayerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Map Style</Text>
            <ScrollView>
              {['standard', 'satellite', 'terrain'].map((layer) => (
                <TouchableOpacity
                  key={layer}
                  style={[
                    styles.layerOption,
                    selectedLayer === layer && styles.layerOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedLayer(layer);
                    setShowLayerModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.layerOptionText,
                      selectedLayer === layer && styles.layerOptionTextSelected,
                    ]}
                  >
                    {layer.charAt(0).toUpperCase() + layer.slice(1)}
                  </Text>
                  {selectedLayer === layer && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topSection: {
    position: 'absolute',
    top: spacing.xl + 40,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  aiSpeakingCard: {
    position: 'absolute',
    top: spacing.xl + 120,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  aiSpeakingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSpeakingText: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  voiceResultsCard: {
    position: 'absolute',
    top: spacing.xl + 120,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  conversationHistoryCard: {
    position: 'absolute',
    top: spacing.xl + 120,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    maxHeight: 400,
  },
  smartPreferencesCard: {
    position: 'absolute',
    top: spacing.xl + 120,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    maxHeight: 500,
  },
  voiceResponseContent: {
    padding: spacing.md,
  },
  voiceResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  voiceResponseTitle: {
    fontSize: fontSizes.base,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.xs,
  },
  voiceResponseText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  suggestionButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  suggestionText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '500',
  },
  voiceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceModalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: spacing.lg,
    maxWidth: width - spacing.xl,
    maxHeight: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  bottomSection: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mainNavButton: {
    flex: 1,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  mainNavButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  mainNavButtonText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
  voiceButton: {
    position: 'absolute',
    bottom: spacing.xl + 100,
    right: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: spacing.lg,
    margin: spacing.lg,
    maxWidth: width - spacing.xl,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  layerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  layerOptionSelected: {
    backgroundColor: colors.primaryLight,
  },
  layerOptionText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    color: colors.text,
  },
  layerOptionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
});