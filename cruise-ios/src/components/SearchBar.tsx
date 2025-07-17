import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import axios from 'axios';

interface SearchBarProps {
  onLocationSelect: (data: any, details: any) => void;
  onVoiceSearch?: () => void;
  onSearchResults?: (results: string) => void;
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

export default function SearchBar({ onLocationSelect, onVoiceSearch, onSearchResults }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (text: string) => {
    setSearchText(text);
    onSearchResults?.(text);
    setShowResults(text.length >= 3);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <TextInput
          style={styles.textInput}
          placeholder="Search for a place..."
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {onVoiceSearch && (
          <TouchableOpacity style={styles.voiceButton} onPress={onVoiceSearch}>
            <Text style={styles.voiceButtonText}>🎤</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* The dropdown will be managed by HomeScreen */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  autocompleteContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  textInput: {
    height: 50,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: '#374151',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  voiceButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    borderBottomColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
}); 