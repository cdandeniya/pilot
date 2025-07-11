import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

interface SearchBarProps {
  onLocationSelect: (data: any, details: any) => void;
  onVoiceSearch?: () => void;
}

export default function SearchBar({ onLocationSelect, onVoiceSearch }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <GooglePlacesAutocomplete
          placeholder="Search for a place..."
          fetchDetails={true}
          onPress={onLocationSelect}
          onFail={(error) => console.error('GooglePlacesAutocomplete error:', error)}
          onNotFound={() => console.log('No results found')}
          query={{
            key: 'AIzaSyC_7hSdv0LHeOEnldEbM5JFIRKpxL_LZMo',
            language: 'en',
            types: ['establishment', 'geocode'],
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInput: styles.textInput,
            listView: styles.listView,
            row: styles.row,
            description: styles.description,
            separator: styles.separator,
          }}
          enablePoweredByContainer={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textInputProps={{
            placeholderTextColor: '#9CA3AF',
          }}
        />
        {onVoiceSearch && (
          <TouchableOpacity style={styles.voiceButton} onPress={onVoiceSearch}>
            <Text style={styles.voiceButtonText}>🎤</Text>
          </TouchableOpacity>
        )}
      </View>
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
}); 