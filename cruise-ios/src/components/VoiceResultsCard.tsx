import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface VoiceResult {
  id: string;
  name: string;
  address: string;
  types: string[];
  location: { lat: number; lng: number };
}

interface VoiceResultsCardProps {
  results: VoiceResult[];
  visible: boolean;
  onClose: () => void;
  onSelectResult: (result: VoiceResult) => void;
}

export default function VoiceResultsCard({ results, visible, onClose, onSelectResult }: VoiceResultsCardProps) {
  if (!visible || results.length === 0) return null;

  const getCategoryIcon = (types: string[]) => {
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
    if (types.includes('gas_station')) return 'car';
    if (types.includes('lodging')) return 'bed';
    if (types.includes('shopping_mall') || types.includes('store')) return 'bag';
    if (types.includes('hospital')) return 'medical';
    if (types.includes('parking')) return 'car-sport';
    return 'location';
  };

  const getCategoryName = (types: string[]) => {
    if (types.includes('restaurant') || types.includes('food')) return 'Restaurant';
    if (types.includes('gas_station')) return 'Gas Station';
    if (types.includes('lodging')) return 'Hotel';
    if (types.includes('shopping_mall') || types.includes('store')) return 'Shopping';
    if (types.includes('hospital')) return 'Hospital';
    if (types.includes('parking')) return 'Parking';
    return 'Place';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Search Results</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
        {results.map((result, index) => (
          <TouchableOpacity
            key={result.id}
            style={styles.resultItem}
            onPress={() => onSelectResult(result)}
            activeOpacity={0.7}
          >
            <View style={styles.resultIcon}>
              <Ionicons 
                name={getCategoryIcon(result.types) as any} 
                size={20} 
                color={colors.primary} 
              />
            </View>
            
            <View style={styles.resultContent}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Text style={styles.resultAddress}>{result.address}</Text>
              <Text style={styles.resultCategory}>{getCategoryName(result.types)}</Text>
            </View>
            
            <View style={styles.resultAction}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: colors.card,
    borderRadius: 16,
    maxHeight: 300,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  resultsList: {
    maxHeight: 240,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  resultCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  resultAction: {
    padding: 4,
  },
}); 