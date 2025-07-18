import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import axios from 'axios';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onLocationSelect: (data: any, details: any) => void;
  onVoiceSearch?: () => void;
  onSearchResults?: (results: string) => void;
  searchText?: string;
  onSearchTextChange?: (text: string) => void;
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

export default function SearchBar({ onLocationSelect, onVoiceSearch, onSearchResults, searchText, onSearchTextChange }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localSearchText, setLocalSearchText] = useState(searchText || '');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (text: string) => {
    setLocalSearchText(text);
    onSearchTextChange?.(text);
    onSearchResults?.(text);
    setShowResults(text.length >= 3);
  };

  const handleClear = () => {
    setLocalSearchText('');
    onSearchTextChange?.('');
    setShowResults(false);
    onSearchResults?.('');
  };

  return (
    <View style={[styles.container, { shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }]}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <TextInput
          style={styles.textInput}
          placeholder="Search for a place..."
          placeholderTextColor={colors.textSecondary}
          value={localSearchText}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {localSearchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {onVoiceSearch && (
          <TouchableOpacity style={styles.voiceButton} onPress={onVoiceSearch}>
            <Ionicons name="mic" size={20} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>
      {/* The dropdown will be managed by HomeScreen */}
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
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  searchContainerFocused: {
    backgroundColor: colors.card,
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  autocompleteContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: colors.text,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listView: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  row: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  voiceButton: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  voiceButtonText: {
    fontSize: 20,
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 300,
  },
  resultsList: {
    borderRadius: 12,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clearButton: {
    width: 32,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 