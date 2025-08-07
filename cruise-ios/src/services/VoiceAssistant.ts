import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceResponse {
  type: 'navigation' | 'search' | 'conversation' | 'preference' | 'error';
  content: string;
  confidence: number;
  entities?: {
    destination?: string;
    action?: string;
    preference?: string;
    question?: string;
  };
  navigationRequest?: {
    destination: string;
    latitude?: number;
    longitude?: number;
  };
  searchRequest?: {
    query: string;
    type: 'restaurant' | 'gas' | 'parking' | 'restroom' | 'general';
  };
  suggestions?: string[];
}

export interface UserPreference {
  id: string;
  type: 'avoid_highways' | 'prefer_scenic' | 'coffee_stops' | 'favorite_destinations' | 'voice_speed' | 'voice_style';
  value: any;
  timestamp: number;
}

export interface ConversationContext {
  currentLocation?: Location.LocationObject;
  currentRoute?: any;
  recentDestinations: string[];
  userPreferences: UserPreference[];
  conversationHistory: Array<{
    timestamp: number;
    userInput: string;
    aiResponse: string;
    action?: string;
  }>;
}

class VoiceAssistant {
  private isListening = false;
  private isSpeaking = false;
  private isDrivingMode = false;
  private wakeWordDetected = false;
  private isAlwaysListening = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private currentContext: ConversationContext = {
    recentDestinations: [],
    userPreferences: [],
    conversationHistory: [],
  };
  private onVoiceResultCallback?: (response: VoiceResponse) => void;
  private speechQueue: string[] = [];
  private isProcessingQueue = false;

  // Initialize the voice assistant
  async initialize(): Promise<void> {
    try {
      // Load user preferences
      await this.loadUserPreferences();
      
      // Load conversation history
      await this.loadConversationHistory();
      
      // Set up speech configuration (using only available methods)
      try {
        // Speech configuration will be handled in speak() method
        console.log('Speech system ready');
      } catch (error) {
        console.log('Speech configuration not available:', error);
      }
      
      console.log('🎤 VoiceAssistant initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing VoiceAssistant:', error);
    }
  }

  // Set driving mode
  setDrivingState(enabled: boolean): void {
    this.isDrivingMode = enabled;
    if (enabled) {
      this.speak('Driving mode activated. I\'ll keep my responses brief and focused on navigation.');
    }
  }

  // Start listening for voice input
  async startListening(): Promise<void> {
    if (this.isListening) return;
    
    this.isListening = true;
    this.wakeWordDetected = false;
    console.log('🎤 Started listening...');
    
    // Start continuous listening mode
    this.startContinuousListening();
  }

  // Start continuous listening for wake word
  private startContinuousListening(): void {
    this.isAlwaysListening = true;
    console.log('🎤 Always listening mode activated - say "Hey Cruise" to wake me up');
    
    // Simulate continuous listening
    this.simulateContinuousListening();
  }

  // Stop listening
  stopListening(): void {
    this.isListening = false;
    this.isAlwaysListening = false;
    console.log('🎤 Stopped listening');
  }

  // Speak text with AI voice
  async speak(text: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    if (this.isSpeaking && priority === 'normal') {
      this.speechQueue.push(text);
      return;
    }

    try {
      this.isSpeaking = true;
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          this.isSpeaking = false;
          this.processSpeechQueue();
        },
        onError: (error) => {
          console.error('❌ Speech error:', error);
          this.isSpeaking = false;
          this.processSpeechQueue();
        },
      });
    } catch (error) {
      console.error('❌ Error speaking:', error);
      this.isSpeaking = false;
    }
  }

  // Process speech queue
  private async processSpeechQueue(): Promise<void> {
    if (this.speechQueue.length > 0 && !this.isSpeaking) {
      const nextText = this.speechQueue.shift();
      if (nextText) {
        await this.speak(nextText);
      }
    }
  }

  // Set callback for voice recognition results
  setOnVoiceResult(callback: (response: VoiceResponse) => void): void {
    this.onVoiceResultCallback = callback;
  }

  // Process voice input and generate AI response
  async processVoiceInput(input: string): Promise<VoiceResponse> {
    try {
      // Add to conversation history
      this.addToConversationHistory(input, '');

      // Analyze the input using AI
      const response = await this.analyzeVoiceInput(input);
      
      // Add AI response to conversation history
      this.updateLastConversationEntry(response.content);

      // Speak the response if in driving mode
      if (this.isDrivingMode) {
        await this.speak(response.content);
      }

      return response;
    } catch (error) {
      console.error('❌ Error processing voice input:', error);
      return {
        type: 'error',
        content: 'I\'m having trouble understanding. Could you please repeat that?',
        confidence: 0,
      };
    }
  }

  // Analyze voice input using AI
  private async analyzeVoiceInput(input: string): Promise<VoiceResponse> {
    const lowerInput = input.toLowerCase();
    
    // Check for wake word first
    if (lowerInput.includes('hey cruise') || lowerInput.includes('hi cruise') || lowerInput.includes('hello cruise')) {
      this.wakeWordDetected = true;
      return {
        type: 'conversation',
        content: 'Hello! I\'m Cruise, your AI navigation assistant. How can I help you today?',
        confidence: 0.9,
        suggestions: [
          'Navigate to downtown',
          'Find coffee shops nearby',
          'How\'s the traffic?',
          'Set my preferences'
        ]
      };
    }
    
    // Navigation requests
    if (lowerInput.includes('navigate to') || lowerInput.includes('go to') || lowerInput.includes('take me to')) {
      const destination = this.extractDestination(input);
      return {
        type: 'navigation',
        content: `I'll navigate you to ${destination}. Starting route now.`,
        confidence: 0.9,
        entities: { destination },
        navigationRequest: { destination },
      };
    }

    // Search requests
    if (lowerInput.includes('find') || lowerInput.includes('search for') || lowerInput.includes('where is')) {
      const query = this.extractSearchQuery(input);
      return {
        type: 'search',
        content: `I'll search for ${query} near your current location.`,
        confidence: 0.8,
        entities: { question: query },
        searchRequest: { query, type: 'general' },
      };
    }

    // Traffic questions
    if (lowerInput.includes('traffic') || lowerInput.includes('congestion')) {
      return {
        type: 'conversation',
        content: 'Let me check the current traffic conditions for your route. I\'ll update your ETA if needed.',
        confidence: 0.9,
        entities: { question: 'traffic' },
      };
    }

    // Preference learning
    if (lowerInput.includes('prefer') || lowerInput.includes('avoid') || lowerInput.includes('like')) {
      const preference = this.extractPreference(input);
      await this.saveUserPreference(preference);
      return {
        type: 'preference',
        content: `I've noted your preference: ${preference}. I'll remember this for future routes.`,
        confidence: 0.8,
        entities: { preference },
      };
    }

    // General conversation
    return {
      type: 'conversation',
      content: this.generateConversationalResponse(input),
      confidence: 0.7,
    };
  }

  // Extract destination from voice input
  private extractDestination(input: string): string {
    const patterns = [
      /navigate to (.+)/i,
      /go to (.+)/i,
      /take me to (.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'your destination';
  }

  // Extract search query from voice input
  private extractSearchQuery(input: string): string {
    const patterns = [
      /find (.+)/i,
      /search for (.+)/i,
      /where is (.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'what you\'re looking for';
  }

  // Extract user preference from voice input
  private extractPreference(input: string): string {
    // This would be more sophisticated in a real implementation
    return input.toLowerCase();
  }

  // Generate conversational response
  private generateConversationalResponse(input: string): string {
    const responses = [
      'I\'m here to help with your navigation. What would you like to know?',
      'I can help you find places, check traffic, or navigate to destinations. Just ask!',
      'How can I assist with your drive today?',
      'I\'m listening and ready to help with your navigation needs.',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Save user preference
  async saveUserPreference(preference: string): Promise<void> {
    const newPreference: UserPreference = {
      id: Date.now().toString(),
      type: 'avoid_highways', // This would be determined by AI analysis
      value: preference,
      timestamp: Date.now(),
    };
    
    this.currentContext.userPreferences.push(newPreference);
    await this.saveUserPreferences();
  }

  // Load user preferences from storage
  private async loadUserPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('userPreferences');
      if (stored) {
        this.currentContext.userPreferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error loading user preferences:', error);
    }
  }

  // Save user preferences to storage
  private async saveUserPreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem('userPreferences', JSON.stringify(this.currentContext.userPreferences));
    } catch (error) {
      console.error('❌ Error saving user preferences:', error);
    }
  }

  // Add to conversation history
  private addToConversationHistory(userInput: string, aiResponse: string): void {
    this.currentContext.conversationHistory.push({
      timestamp: Date.now(),
      userInput,
      aiResponse,
    });
    
    // Keep only last 50 conversations
    if (this.currentContext.conversationHistory.length > 50) {
      this.currentContext.conversationHistory = this.currentContext.conversationHistory.slice(-50);
    }
    
    this.saveConversationHistory();
  }

  // Update last conversation entry
  private updateLastConversationEntry(aiResponse: string): void {
    if (this.currentContext.conversationHistory.length > 0) {
      const lastEntry = this.currentContext.conversationHistory[this.currentContext.conversationHistory.length - 1];
      lastEntry.aiResponse = aiResponse;
      this.saveConversationHistory();
    }
  }

  // Load conversation history from storage
  private async loadConversationHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('conversationHistory');
      if (stored) {
        this.currentContext.conversationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
    }
  }

  // Save conversation history to storage
  private async saveConversationHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('conversationHistory', JSON.stringify(this.currentContext.conversationHistory));
    } catch (error) {
      console.error('❌ Error saving conversation history:', error);
    }
  }

  // Simulate voice recognition (for demo purposes)
  private simulateVoiceRecognition(): void {
    // In a real app, this would integrate with actual speech recognition
    // For now, we'll simulate with mock responses
    setTimeout(() => {
      if (this.isListening && this.onVoiceResultCallback) {
        const mockResponses = [
          'Navigate to downtown San Francisco',
          'Find coffee shops near me',
          'How is the traffic looking?',
          'I prefer scenic routes',
          'Take me to the nearest gas station',
        ];
        
        const randomInput = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        this.processVoiceInput(randomInput).then(response => {
          this.onVoiceResultCallback!(response);
        });
      }
    }, 2000);
  }

  private simulateContinuousListening(): void {
    // Simulate continuous listening for wake word
    const checkForWakeWord = () => {
      if (!this.isAlwaysListening) return;
      
      // Simulate wake word detection
      const wakeWordChance = Math.random();
      if (wakeWordChance < 0.3) { // 30% chance to detect wake word
        console.log('🎤 Wake word detected: "Hey Cruise"');
        this.wakeWordDetected = true;
        this.speak('Hello! I\'m listening. How can I help you?');
        
        // Start listening for command
        this.startCommandListening();
      } else {
        // Continue listening
        setTimeout(checkForWakeWord, 3000);
      }
    };
    
    checkForWakeWord();
  }

  private startCommandListening(): void {
    console.log('🎤 Listening for command...');
    
    // Simulate command detection with automatic stop
    setTimeout(() => {
      const commands = [
        'Navigate to downtown',
        'Find coffee shops',
        'How is the traffic?',
        'I prefer scenic routes',
        'Take me to the airport'
      ];
      
      const randomCommand = commands[Math.floor(Math.random() * commands.length)];
      console.log('🎤 Command detected:', randomCommand);
      
      this.processVoiceInput(randomCommand).then(response => {
        if (this.onVoiceResultCallback) {
          this.onVoiceResultCallback(response);
        }
      });
      
      // Automatically stop listening after command
      this.stopCommandListening();
      
    }, 1500);
  }

  private stopCommandListening(): void {
    console.log('🎤 Command listening stopped');
    this.wakeWordDetected = false;
    
    // Resume continuous listening
    setTimeout(() => {
      if (this.isAlwaysListening) {
        this.simulateContinuousListening();
      }
    }, 1000);
  }

  // Get current context
  getContext(): ConversationContext {
    return this.currentContext;
  }

  // Update current location
  updateCurrentLocation(location: Location.LocationObject): void {
    this.currentContext.currentLocation = location;
  }

  // Update current route
  updateCurrentRoute(route: any): void {
    this.currentContext.currentRoute = route;
  }

  // Get user preferences
  getUserPreferences(): UserPreference[] {
    return this.currentContext.userPreferences;
  }

  // Check if currently speaking
  isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  // Check if currently listening
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Check if in driving mode
  isInDrivingMode(): boolean {
    return this.isDrivingMode;
  }

  isWakeWordDetected(): boolean {
    return this.wakeWordDetected;
  }

  // Test method to manually trigger wake word detection
  testWakeWord(): void {
    console.log('🎤 Testing wake word detection...');
    this.wakeWordDetected = true;
    this.speak('Hello! I\'m listening. How can I help you?');
    this.startCommandListening();
  }

  // Cleanup
  destroy(): void {
    this.stopListening();
    Speech.stop();
  }
}

export default new VoiceAssistant();
