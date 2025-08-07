import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../theme';
import { UserPreference } from '../services/VoiceAssistant';

interface SmartPreferencesProps {
  preferences: UserPreference[];
  onPreferenceUpdate?: (preference: UserPreference) => void;
  onPreferenceDelete?: (preferenceId: string) => void;
  onPreferenceAdd?: (preference: Omit<UserPreference, 'id' | 'timestamp'>) => void;
}

interface PreferenceCategory {
  type: UserPreference['type'];
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    type: 'avoid_highways',
    title: 'Avoid Highways',
    description: 'Prefer local roads over highways',
    icon: 'road',
    color: colors.warning,
  },
  {
    type: 'prefer_scenic',
    title: 'Scenic Routes',
    description: 'Choose more scenic routes when possible',
    icon: 'leaf',
    color: colors.success,
  },
  {
    type: 'coffee_stops',
    title: 'Coffee Stops',
    description: 'Suggest coffee breaks on long drives',
    icon: 'cafe',
    color: colors.accent,
  },
  {
    type: 'favorite_destinations',
    title: 'Favorite Places',
    description: 'Remember frequently visited places',
    icon: 'heart',
    color: colors.danger,
  },
  {
    type: 'voice_speed',
    title: 'Voice Speed',
    description: 'Adjust speech rate for voice guidance',
    icon: 'speedometer',
    color: colors.info,
  },
  {
    type: 'voice_style',
    title: 'Voice Style',
    description: 'Choose voice personality and style',
    icon: 'person',
    color: colors.primary,
  },
];

export default function SmartPreferences({
  preferences,
  onPreferenceUpdate,
  onPreferenceDelete,
  onPreferenceAdd,
}: SmartPreferencesProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPreference, setEditingPreference] = useState<UserPreference | null>(null);
  const [newPreferenceType, setNewPreferenceType] = useState<UserPreference['type']>('avoid_highways');
  const [newPreferenceValue, setNewPreferenceValue] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCategoryForType = (type: UserPreference['type']): PreferenceCategory => {
    return PREFERENCE_CATEGORIES.find(cat => cat.type === type) || PREFERENCE_CATEGORIES[0];
  };

  const formatPreferenceValue = (preference: UserPreference): string => {
    switch (preference.type) {
      case 'voice_speed':
        return `${preference.value}x speed`;
      case 'voice_style':
        return preference.value as string;
      case 'avoid_highways':
        return preference.value ? 'Enabled' : 'Disabled';
      case 'prefer_scenic':
        return preference.value ? 'Enabled' : 'Disabled';
      case 'coffee_stops':
        return preference.value ? 'Enabled' : 'Disabled';
      case 'favorite_destinations':
        return Array.isArray(preference.value) 
          ? `${preference.value.length} places saved`
          : preference.value as string;
      default:
        return preference.value as string;
    }
  };

  const handleAddPreference = () => {
    if (!newPreferenceValue.trim()) {
      Alert.alert('Error', 'Please enter a preference value');
      return;
    }

    const preference: Omit<UserPreference, 'id' | 'timestamp'> = {
      type: newPreferenceType,
      value: newPreferenceValue,
    };

    onPreferenceAdd?.(preference);
    setShowAddModal(false);
    setNewPreferenceValue('');
  };

  const handleEditPreference = (preference: UserPreference) => {
    setEditingPreference(preference);
    setNewPreferenceValue(preference.value as string);
    setNewPreferenceType(preference.type);
  };

  const handleSaveEdit = () => {
    if (!editingPreference || !newPreferenceValue.trim()) {
      Alert.alert('Error', 'Please enter a preference value');
      return;
    }

    const updatedPreference: UserPreference = {
      ...editingPreference,
      value: newPreferenceValue,
    };

    onPreferenceUpdate?.(updatedPreference);
    setEditingPreference(null);
    setNewPreferenceValue('');
  };

  const handleDeletePreference = (preference: UserPreference) => {
    Alert.alert(
      'Delete Preference',
      `Are you sure you want to delete "${getCategoryForType(preference.type).title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onPreferenceDelete?.(preference.id) },
      ]
    );
  };

  const renderPreferenceCard = (preference: UserPreference) => {
    const category = getCategoryForType(preference.type);
    
    return (
      <View key={preference.id} style={styles.preferenceCard}>
        <View style={styles.preferenceHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
            <Ionicons name={category.icon} size={20} color={category.color} />
          </View>
          <View style={styles.preferenceInfo}>
            <Text style={styles.preferenceTitle}>{category.title}</Text>
            <Text style={styles.preferenceDescription}>{category.description}</Text>
          </View>
          <View style={styles.preferenceActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPreference(preference)}
            >
              <Ionicons name="create" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePreference(preference)}
            >
              <Ionicons name="trash" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.preferenceValue}>
          <Text style={styles.valueLabel}>Current Setting:</Text>
          <Text style={styles.valueText}>{formatPreferenceValue(preference)}</Text>
        </View>
        <Text style={styles.timestamp}>
          Learned {new Date(preference.timestamp).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Preference</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Preference Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeSelector}>
                {PREFERENCE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.type}
                    style={[
                      styles.typeOption,
                      newPreferenceType === category.type && styles.typeOptionSelected,
                    ]}
                    onPress={() => setNewPreferenceType(category.type)}
                  >
                    <Ionicons
                      name={category.icon}
                      size={16}
                      color={newPreferenceType === category.type ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        newPreferenceType === category.type && styles.typeOptionTextSelected,
                      ]}
                    >
                      {category.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Value</Text>
            <TextInput
              style={styles.textInput}
              value={newPreferenceValue}
              onChangeText={setNewPreferenceValue}
              placeholder="Enter preference value..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddPreference}>
            <Text style={styles.addButtonText}>Add Preference</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={!!editingPreference}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setEditingPreference(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Preference</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEditingPreference(null)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Value</Text>
            <TextInput
              style={styles.textInput}
              value={newPreferenceValue}
              onChangeText={setNewPreferenceValue}
              placeholder="Enter new value..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={handleSaveEdit}>
            <Text style={styles.addButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Smart Preferences</Text>
          <Text style={styles.subtitle}>
            Cruise learns your preferences to provide personalized navigation
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {preferences.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="settings" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No preferences yet</Text>
            <Text style={styles.emptySubtitle}>
              Cruise will learn your preferences as you use the app
            </Text>
          </View>
        ) : (
          preferences.map(renderPreferenceCard)
        )}
      </ScrollView>
      
      {renderAddModal()}
      {renderEditModal()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  content: {
    padding: spacing.lg,
  },
  preferenceCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  preferenceDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  preferenceActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  valueLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  valueText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  typeOptionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeights.medium,
  },
  addButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textInverse,
    textAlign: 'center',
  },
});
