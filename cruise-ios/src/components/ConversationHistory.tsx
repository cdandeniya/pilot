import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSizes, fontWeights, spacing, borderRadius, shadows } from '../theme';
import { VoiceResponse, ConversationContext } from '../services/VoiceAssistant';
import { AIResponse, RouteSuggestion } from '../services/AIService';

const { width } = Dimensions.get('window');

interface ConversationHistoryProps {
  context: ConversationContext;
  onSuggestionPress?: (suggestion: string) => void;
  onRouteSuggestionPress?: (suggestion: RouteSuggestion) => void;
  maxHeight?: number;
}

interface ConversationEntry {
  id: string;
  timestamp: number;
  type: 'user' | 'ai';
  content: string;
  response?: VoiceResponse | AIResponse;
  suggestions?: string[];
  routeSuggestions?: RouteSuggestion[];
}

export default function ConversationHistory({
  context,
  onSuggestionPress,
  onRouteSuggestionPress,
  maxHeight = 300,
}: ConversationHistoryProps) {
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Convert conversation history to entries
    const newEntries: ConversationEntry[] = [];
    
    context.conversationHistory.forEach((entry, index) => {
      // Add user entry
      newEntries.push({
        id: `user-${entry.timestamp}`,
        timestamp: entry.timestamp,
        type: 'user',
        content: entry.userInput,
      });
      
      // Add AI entry
      newEntries.push({
        id: `ai-${entry.timestamp}`,
        timestamp: entry.timestamp,
        type: 'ai',
        content: entry.aiResponse,
        suggestions: generateSuggestions(entry.userInput),
      });
    });
    
    setEntries(newEntries);
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [context.conversationHistory]);

  const generateSuggestions = (userInput: string): string[] => {
    const lowerInput = userInput.toLowerCase();
    const suggestions: string[] = [];
    
    if (lowerInput.includes('traffic')) {
      suggestions.push('Check alternative routes', 'Update ETA');
    }
    
    if (lowerInput.includes('navigate') || lowerInput.includes('go to')) {
      suggestions.push('Start navigation', 'Check traffic', 'Find parking');
    }
    
    if (lowerInput.includes('find') || lowerInput.includes('search')) {
      suggestions.push('Show on map', 'Get directions', 'Check reviews');
    }
    
    if (lowerInput.includes('coffee') || lowerInput.includes('food')) {
      suggestions.push('Find nearby options', 'Check hours', 'Get directions');
    }
    
    return suggestions;
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderUserMessage = (entry: ConversationEntry) => (
    <View key={entry.id} style={styles.userMessageContainer}>
      <View style={styles.userMessage}>
        <Text style={styles.userMessageText}>{entry.content}</Text>
        <Text style={styles.timestamp}>{formatTime(entry.timestamp)}</Text>
      </View>
    </View>
  );

  const renderAIMessage = (entry: ConversationEntry) => (
    <View key={entry.id} style={styles.aiMessageContainer}>
      <View style={styles.aiMessage}>
        <View style={styles.aiHeader}>
          <Ionicons name="car" size={16} color={colors.primary} />
          <Text style={styles.aiName}>Cruise</Text>
        </View>
        <Text style={styles.aiMessageText}>{entry.content}</Text>
        <Text style={styles.timestamp}>{formatTime(entry.timestamp)}</Text>
      </View>
      
      {/* Suggestions */}
      {entry.suggestions && entry.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Quick Actions:</Text>
          <View style={styles.suggestionsList}>
            {entry.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionButton}
                onPress={() => onSuggestionPress?.(suggestion)}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Route Suggestions */}
      {entry.routeSuggestions && entry.routeSuggestions.length > 0 && (
        <View style={styles.routeSuggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Route Suggestions:</Text>
          {entry.routeSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.routeSuggestionButton,
                suggestion.priority === 'high' && styles.highPriority,
                suggestion.priority === 'medium' && styles.mediumPriority,
              ]}
              onPress={() => onRouteSuggestionPress?.(suggestion)}
            >
              <View style={styles.routeSuggestionContent}>
                <Ionicons
                  name={getRouteSuggestionIcon(suggestion.type)}
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.routeSuggestionText}>
                  <Text style={styles.routeSuggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.routeSuggestionDescription}>
                    {suggestion.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const getRouteSuggestionIcon = (type: RouteSuggestion['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'coffee_stop':
        return 'cafe';
      case 'gas_stop':
        return 'car';
      case 'rest_stop':
        return 'bed';
      case 'food_stop':
        return 'restaurant';
      case 'scenic_route':
        return 'leaf';
      case 'traffic_alert':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles" size={48} color={colors.textTertiary} />
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Start talking to Cruise to see your conversation history here
      </Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Conversation History</Text>
        <Text style={styles.subtitle}>
          {entries.length} messages • {context.userPreferences.length} preferences learned
        </Text>
      </View>
      
      <ScrollView
        style={[styles.scrollView, { maxHeight }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {entries.length === 0 ? (
          renderEmptyState()
        ) : (
          entries.map((entry) =>
            entry.type === 'user' ? renderUserMessage(entry) : renderAIMessage(entry)
          )
        )}
      </ScrollView>
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  userMessageContainer: {
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userMessage: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: width * 0.75,
  },
  userMessageText: {
    color: colors.textInverse,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
  aiMessageContainer: {
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  aiMessage: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: width * 0.85,
    ...shadows.sm,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  aiName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  aiMessageText: {
    color: colors.text,
    fontSize: fontSizes.base,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  suggestionsContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  suggestionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  suggestionsList: {
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
    fontWeight: fontWeights.medium,
  },
  routeSuggestionsContainer: {
    marginTop: spacing.sm,
  },
  routeSuggestionButton: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  highPriority: {
    borderLeftColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  mediumPriority: {
    borderLeftColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  routeSuggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeSuggestionText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  routeSuggestionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  routeSuggestionDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
}); 