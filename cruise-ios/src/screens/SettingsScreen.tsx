import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../theme';
import AIService from '../services/AIService';
import VoiceAssistant from '../services/VoiceAssistant';

interface SettingsScreenProps {
  navigation: any;
}

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'input' | 'button' | 'info';
  value?: any;
  onPress?: () => void;
  onChange?: (value: any) => void;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [openAIKey, setOpenAIKey] = useState('');
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [tempAPIKey, setTempAPIKey] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const key = await AsyncStorage.getItem('openai_api_key');
      setOpenAIKey(key || '');
      
      const voiceSpeed = await AsyncStorage.getItem('voice_speed') || '0.9';
      const voiceStyle = await AsyncStorage.getItem('voice_style') || 'friendly';
      const drivingMode = await AsyncStorage.getItem('driving_mode') === 'true';
      const autoSuggestions = await AsyncStorage.getItem('auto_suggestions') === 'true';
      
      const settingsList: SettingItem[] = [
        {
          id: 'ai_provider',
          title: 'AI Provider',
          description: `Current: ${AIService.getCurrentProvider()}`,
          type: 'info',
          icon: 'settings',
          color: colors.primary,
        },
        {
          id: 'api_key',
          title: 'OpenAI API Key',
          description: key ? 'API key configured' : 'Configure your OpenAI API key',
          type: 'button',
          onPress: () => setShowAPIKeyModal(true),
          icon: 'key',
          color: colors.info,
        },
        {
          id: 'voice_speed',
          title: 'Voice Speed',
          description: `Speech rate: ${voiceSpeed}x`,
          type: 'input',
          value: voiceSpeed,
          onChange: handleVoiceSpeedChange,
          icon: 'speedometer',
          color: colors.accent,
        },
        {
          id: 'voice_style',
          title: 'Voice Style',
          description: `Current style: ${voiceStyle}`,
          type: 'input',
          value: voiceStyle,
          onChange: handleVoiceStyleChange,
          icon: 'person',
          color: colors.success,
        },
        {
          id: 'driving_mode',
          title: 'Driving Mode',
          description: 'Optimize voice responses for driving',
          type: 'toggle',
          value: drivingMode,
          onChange: handleDrivingModeChange,
          icon: 'car',
          color: colors.warning,
        },
        {
          id: 'auto_suggestions',
          title: 'Auto Suggestions',
          description: 'Show route and stop suggestions automatically',
          type: 'toggle',
          value: autoSuggestions,
          onChange: handleAutoSuggestionsChange,
          icon: 'bulb',
          color: colors.danger,
        },
        {
          id: 'conversation_history',
          title: 'Conversation History',
          description: 'Manage your conversation history with Cruise',
          type: 'button',
          onPress: () => navigation.navigate('ConversationHistory'),
          icon: 'chatbubbles',
          color: colors.primary,
        },
        {
          id: 'preferences',
          title: 'Smart Preferences',
          description: 'Manage AI-learned preferences',
          type: 'button',
          onPress: () => navigation.navigate('SmartPreferences'),
          icon: 'settings',
          color: colors.accent,
        },
        {
          id: 'about',
          title: 'About Cruise',
          description: 'Version 1.0.0 • AI-powered navigation',
          type: 'info',
          icon: 'information-circle',
          color: colors.textSecondary,
        },
      ];
      
      setSettings(settingsList);
    } catch (error) {
      console.error('❌ Error loading settings:', error);
    }
  };

  const handleAIEnabledChange = async (enabled: boolean) => {
    if (enabled && !openAIKey) {
      Alert.alert(
        'API Key Required',
        'Please configure your OpenAI API key first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Configure', onPress: () => setShowAPIKeyModal(true) },
        ]
      );
      return;
    }
    
    // Update settings
    const updatedSettings = settings.map(setting =>
      setting.id === 'ai_enabled' ? { ...setting, value: enabled } : setting
    );
    setSettings(updatedSettings);
  };

  const handleVoiceSpeedChange = async (speed: string) => {
    try {
      await AsyncStorage.setItem('voice_speed', speed);
      const updatedSettings = settings.map(setting =>
        setting.id === 'voice_speed' 
          ? { ...setting, value: speed, description: `Speech rate: ${speed}x` }
          : setting
      );
      setSettings(updatedSettings);
    } catch (error) {
      console.error('❌ Error saving voice speed:', error);
    }
  };

  const handleVoiceStyleChange = async (style: string) => {
    try {
      await AsyncStorage.setItem('voice_style', style);
      const updatedSettings = settings.map(setting =>
        setting.id === 'voice_style'
          ? { ...setting, value: style, description: `Current style: ${style}` }
          : setting
      );
      setSettings(updatedSettings);
    } catch (error) {
      console.error('❌ Error saving voice style:', error);
    }
  };

  const handleDrivingModeChange = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('driving_mode', enabled.toString());
      const updatedSettings = settings.map(setting =>
        setting.id === 'driving_mode' ? { ...setting, value: enabled } : setting
      );
      setSettings(updatedSettings);
    } catch (error) {
      console.error('❌ Error saving driving mode:', error);
    }
  };

  const handleAutoSuggestionsChange = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('auto_suggestions', enabled.toString());
      const updatedSettings = settings.map(setting =>
        setting.id === 'auto_suggestions' ? { ...setting, value: enabled } : setting
      );
      setSettings(updatedSettings);
    } catch (error) {
      console.error('❌ Error saving auto suggestions:', error);
    }
  };

  const handleSaveAPIKey = async () => {
    if (!tempAPIKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    try {
      await AIService.setAPIKey(tempAPIKey);
      setOpenAIKey(tempAPIKey);
      setShowAPIKeyModal(false);
      setTempAPIKey('');
      
      // Update settings
      const updatedSettings = settings.map(setting =>
        setting.id === 'api_key' 
          ? { ...setting, description: 'API key configured' }
          : setting
      );
      setSettings(updatedSettings);
      
      Alert.alert('Success', 'OpenAI API key configured successfully!');
    } catch (error) {
      console.error('❌ Error saving API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const renderSettingItem = (setting: SettingItem) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <View style={[styles.settingIcon, { backgroundColor: setting.color + '20' }]}>
          <Ionicons name={setting.icon} size={20} color={setting.color} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{setting.title}</Text>
          <Text style={styles.settingDescription}>{setting.description}</Text>
        </View>
        {setting.type === 'toggle' && (
          <Switch
            value={setting.value}
            onValueChange={setting.onChange}
            trackColor={{ false: colors.border, true: setting.color }}
            thumbColor={setting.value ? colors.background : colors.textSecondary}
          />
        )}
        {setting.type === 'button' && (
          <TouchableOpacity
            style={styles.settingButton}
            onPress={setting.onPress}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderAPIKeyModal = () => (
    <Modal
      visible={showAPIKeyModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAPIKeyModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configure OpenAI API Key</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAPIKeyModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            Enter your OpenAI API key to enable advanced AI features like conversational navigation and smart suggestions.
          </Text>
          
          <TextInput
            style={styles.apiKeyInput}
            value={tempAPIKey}
            onChangeText={setTempAPIKey}
            placeholder="sk-..."
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAPIKeyModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveAPIKey}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Configuration</Text>
          {settings.filter(s => ['ai_enabled', 'api_key'].includes(s.id)).map(renderSettingItem)}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice Settings</Text>
          {settings.filter(s => ['voice_speed', 'voice_style'].includes(s.id)).map(renderSettingItem)}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          {settings.filter(s => ['driving_mode', 'auto_suggestions'].includes(s.id)).map(renderSettingItem)}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          {settings.filter(s => ['conversation_history', 'preferences'].includes(s.id)).map(renderSettingItem)}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          {settings.filter(s => s.id === 'about').map(renderSettingItem)}
        </View>
      </ScrollView>
      
      {renderAPIKeyModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginLeft: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  settingItem: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  settingButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  apiKeyInput: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textInverse,
  },
});
