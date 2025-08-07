import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, FlatList, Animated } from 'react-native';
import axios from 'axios';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows, layout } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SearchBarProps {
  onLocationSelect: (data: any, details: any) => void;
  onVoiceSearch?: () => void;
  onSearchResults?: (results: string) => void;
  searchText?: string;
  onSearchTextChange?: (text: string) => void;
  isRecording?: boolean;
  isSpeaking?: boolean;
}

interface SearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function SearchBar({ onLocationSelect, onVoiceSearch, onSearchResults, searchText, onSearchTextChange, isRecording, isSpeaking }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localSearchText, setLocalSearchText] = useState(searchText || '');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (text: string) => {
    setLocalSearchText(text);
    onSearchTextChange?.(text);
    onSearchResults?.(text);
    setShowResults(text.length >= 3);
    
    if (text.length >= 3) {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=YOUR_GOOGLE_MAPS_API_KEY&types=establishment|geocode`
        );
        
        if (response.data.predictions) {
          setSearchResults(response.data.predictions.slice(0, 5));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleClear = () => {
    setLocalSearchText('');
    onSearchTextChange?.('');
    setShowResults(false);
    onSearchResults?.('');
    setSearchResults([]);
  };

  const handleResultSelect = (result: SearchResult) => {
    onLocationSelect(result, null);
    setLocalSearchText(result.name);
    setShowResults(false);
    setSearchResults([]);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIcon}>
        <Ionicons name="location" size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.resultAddress} numberOfLines={1}>
          {item.formatted_address}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Main Search Bar */}
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <LinearGradient
          colors={isFocused ? colors.gradientPrimary : ['transparent', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientBorder}
        />
        
        <View style={styles.searchContent}>
          {/* Search Icon */}
          <View style={styles.searchIconContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={isFocused ? colors.primary : colors.textSecondary} 
            />
          </View>
          
          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="Where to?"
            placeholderTextColor={colors.textTertiary}
            value={localSearchText}
            onChangeText={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCorrect={false}
            autoCapitalize="none"
          />
          
          {/* Clear Button */}
          {localSearchText.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {/* Voice Button */}
          {onVoiceSearch && (
            <TouchableOpacity 
              style={[
                styles.voiceButton,
                isRecording && styles.voiceButtonRecording,
                isSpeaking && styles.voiceButtonSpeaking
              ]} 
              onPress={() => {
                console.log('🎤 Voice button pressed in SearchBar');
                onVoiceSearch();
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={isRecording ? colors.gradientDanger : isSpeaking ? colors.gradientSuccess : colors.gradientPrimary}
                style={styles.voiceButtonGradient}
              >
                <Ionicons 
                  name={isRecording ? "stop-circle" : isSpeaking ? "volume-high" : "mic"} 
                  size={18} 
                  color={colors.textInverse} 
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.place_id}
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
  },
  searchContainer: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    overflow: 'hidden',
  },
  searchContainerFocused: {
    borderColor: colors.primary,
    ...shadows.lg,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: layout.searchBarHeight,
  },
  searchIconContainer: {
    marginRight: spacing.sm,
    width: 24,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.lg,
    color: colors.text,
    fontWeight: fontWeights.medium,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  voiceButton: {
    marginLeft: spacing.sm,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  voiceButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonRecording: {
    ...shadows.md,
  },
  voiceButtonSpeaking: {
    ...shadows.md,
  },
  resultsContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    ...shadows.lg,
    maxHeight: 300,
  },
  resultsList: {
    borderRadius: borderRadius.lg,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  resultContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  resultTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    ...shadows.md,
  },
  loadingSpinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
    marginRight: spacing.sm,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
});