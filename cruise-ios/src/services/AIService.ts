import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceResponse, ConversationContext, UserPreference } from './VoiceAssistant';

export interface AIResponse {
  type: 'navigation' | 'search' | 'conversation' | 'preference' | 'suggestion' | 'error';
  content: string;
  confidence: number;
  entities?: {
    destination?: string;
    action?: string;
    preference?: string;
    question?: string;
    location?: string;
    time?: string;
  };
  suggestions?: string[];
  navigationRequest?: {
    destination: string;
    latitude?: number;
    longitude?: number;
    routeType?: 'fastest' | 'scenic' | 'avoid_highways' | 'avoid_tolls';
  };
  searchRequest?: {
    query: string;
    type: 'restaurant' | 'gas' | 'parking' | 'restroom' | 'coffee' | 'general';
    radius?: number;
  };
}

export interface RouteSuggestion {
  type: 'coffee_stop' | 'gas_stop' | 'rest_stop' | 'food_stop' | 'scenic_route' | 'traffic_alert';
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
  };
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: number;
}

type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'mock' | 'huggingface';

class AIService {
  private apiKey: string | null = null;
  private provider: AIProvider = 'mock'; // Default to mock for testing
  private baseURL = 'https://api.openai.com/v1';
  private conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }> = [];

  constructor() {
    this.loadAPIKey();
    this.loadProvider();
  }

  // Load AI provider from storage
  private async loadProvider(): Promise<void> {
    try {
      const provider = await AsyncStorage.getItem('ai_provider');
      if (provider) {
        this.provider = provider as AIProvider;
      }
    } catch (error) {
      console.error('❌ Error loading AI provider:', error);
    }
  }

  // Set AI provider
  async setProvider(provider: AIProvider): Promise<void> {
    try {
      this.provider = provider;
      await AsyncStorage.setItem('ai_provider', provider);
      console.log(`🤖 AI Provider set to: ${provider}`);
    } catch (error) {
      console.error('❌ Error saving AI provider:', error);
    }
  }

  // Get current provider
  getCurrentProvider(): AIProvider {
    return this.provider;
  }

  // Load OpenAI API key from storage
  private async loadAPIKey(): Promise<void> {
    try {
      const key = await AsyncStorage.getItem('openai_api_key');
      this.apiKey = key;
    } catch (error) {
      console.error('❌ Error loading API key:', error);
    }
  }

  // Set OpenAI API key
  async setAPIKey(key: string): Promise<void> {
    try {
      this.apiKey = key;
      await AsyncStorage.setItem('openai_api_key', key);
    } catch (error) {
      console.error('❌ Error saving API key:', error);
    }
  }

  // Check if API key is available
  hasAPIKey(): boolean {
    return !!this.apiKey;
  }

  // Process voice input with AI
  async processVoiceInput(
    input: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    try {
      switch (this.provider) {
        case 'openai':
          return await this.processWithOpenAI(input, context);
        case 'anthropic':
          return await this.processWithAnthropic(input, context);
        case 'ollama':
          return await this.processWithOllama(input, context);
        case 'huggingface':
          return await this.processWithHuggingFace(input, context);
        case 'mock':
        default:
          return this.processWithMock(input, context);
      }
    } catch (error) {
      console.error('❌ Error processing with AI:', error);
      return this.processWithMock(input, context);
    }
  }

  // Mock AI processing (FREE - for testing)
  private processWithMock(input: string, context: ConversationContext): AIResponse {
    const lowerInput = input.toLowerCase();
    
    // Smart mock responses based on input patterns
    if (lowerInput.includes('navigate') || lowerInput.includes('go to') || lowerInput.includes('take me to')) {
      const destination = this.extractDestination(input);
      return {
        type: 'navigation',
        content: `I'll navigate you to ${destination}. Starting route now.`,
        confidence: 0.9,
        navigationRequest: { destination },
        entities: { destination },
        suggestions: ['Start navigation', 'Check traffic', 'Find parking'],
      };
    }
    
    if (lowerInput.includes('find') || lowerInput.includes('search') || lowerInput.includes('where is')) {
      const query = this.extractSearchQuery(input);
      return {
        type: 'search',
        content: `I'll search for ${query} near your current location.`,
        confidence: 0.8,
        searchRequest: { query, type: 'general' },
        entities: { question: query },
        suggestions: ['Show on map', 'Get directions', 'Check reviews'],
      };
    }
    
    if (lowerInput.includes('traffic') || lowerInput.includes('congestion')) {
      return {
        type: 'conversation',
        content: 'Let me check the current traffic conditions for your route. I\'ll update your ETA if needed.',
        confidence: 0.9,
        entities: { question: 'traffic' },
        suggestions: ['Check alternative routes', 'Update ETA'],
      };
    }
    
    if (lowerInput.includes('prefer') || lowerInput.includes('avoid') || lowerInput.includes('like')) {
      const preference = this.extractPreference(input);
      return {
        type: 'preference',
        content: `I've noted your preference: ${preference}. I'll remember this for future routes.`,
        confidence: 0.8,
        entities: { preference },
        suggestions: ['Save preference', 'Apply to current route'],
      };
    }
    
    // Random conversational responses
    const responses = [
      'I\'m here to help with your navigation. What would you like to know?',
      'I can help you find places, check traffic, or navigate to destinations. Just ask!',
      'How can I assist with your drive today?',
      'I\'m listening and ready to help with your navigation needs.',
      'I can help you navigate, find places, or check traffic conditions.',
    ];
    
    return {
      type: 'conversation',
      content: responses[Math.floor(Math.random() * responses.length)],
      confidence: 0.7,
      suggestions: ['Navigate', 'Search', 'Check traffic'],
    };
  }

  // OpenAI processing (PAID - but most capable)
  private async processWithOpenAI(input: string, context: ConversationContext): Promise<AIResponse> {
    if (!this.apiKey) {
      return this.processWithMock(input, context);
    }

    try {
      const response = await this.callOpenAI(input, context);
      return this.parseAIResponse(response, input);
    } catch (error) {
      console.error('❌ Error calling OpenAI:', error);
      return this.processWithMock(input, context);
    }
  }

  // Anthropic Claude processing (PAID - but cheaper than GPT-4)
  private async processWithAnthropic(input: string, context: ConversationContext): Promise<AIResponse> {
    // Implementation for Anthropic Claude
    // Claude is often cheaper than GPT-4 and very capable
    return this.processWithMock(input, context); // Placeholder
  }

  // Ollama processing (FREE - local AI models)
  private async processWithOllama(input: string, context: ConversationContext): Promise<AIResponse> {
    try {
      // Ollama runs locally - you need to install it on your machine
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'llama2', // or 'mistral', 'codellama', etc.
        prompt: this.buildPrompt(input, context),
        stream: false,
      });
      
      return this.parseAIResponse(response.data.response, input);
    } catch (error) {
      console.error('❌ Error calling Ollama:', error);
      return this.processWithMock(input, context);
    }
  }

  // Hugging Face processing (FREE - with API limits)
  private async processWithHuggingFace(input: string, context: ConversationContext): Promise<AIResponse> {
    try {
      // Hugging Face offers free API calls (with rate limits)
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          inputs: this.buildPrompt(input, context),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
      
      return this.parseAIResponse(response.data[0].generated_text, input);
    } catch (error) {
      console.error('❌ Error calling Hugging Face:', error);
      return this.processWithMock(input, context);
    }
  }

  // Call OpenAI API
  private async callOpenAI(input: string, context: ConversationContext): Promise<string> {
    const messages = this.buildConversationMessages(input, context);
    
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: 'gpt-3.5-turbo', // Use GPT-3.5 for cheaper testing
        messages,
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  // Build conversation messages for AI
  private buildConversationMessages(input: string, context: ConversationContext): Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }> {
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // System prompt
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(context),
    });

    // Add recent conversation history (last 10 exchanges)
    const recentHistory = context.conversationHistory.slice(-10);
    for (const entry of recentHistory) {
      messages.push({
        role: 'user',
        content: entry.userInput,
      });
      messages.push({
        role: 'assistant',
        content: entry.aiResponse,
      });
    }

    // Add current user input
    messages.push({
      role: 'user',
      content: input,
    });

    return messages;
  }

  // Build prompt for local AI models
  private buildPrompt(input: string, context: ConversationContext): string {
    const systemPrompt = this.buildSystemPrompt(context);
    return `${systemPrompt}\n\nUser: ${input}\nAssistant:`;
  }

  // Build system prompt for Cruise AI
  private buildSystemPrompt(context: ConversationContext): string {
    const preferences = context.userPreferences
      .map(p => `${p.type}: ${p.value}`)
      .join(', ');

    return `You are Cruise, an AI-powered voice-first navigation assistant. You help drivers with navigation, finding places, checking traffic, and providing a conversational driving experience.

Key capabilities:
- Navigation: Help users navigate to destinations
- Search: Find restaurants, gas stations, parking, etc.
- Traffic: Check and report traffic conditions
- Preferences: Learn and remember user preferences
- Suggestions: Proactively suggest stops, routes, and alternatives

User preferences: ${preferences || 'None set'}

Current context:
- Recent destinations: ${context.recentDestinations.join(', ') || 'None'}
- Driving mode: ${context.currentRoute ? 'Active navigation' : 'Not navigating'}

Guidelines:
1. Keep responses concise and natural for voice interaction
2. Be proactive and helpful
3. Remember user preferences and past interactions
4. Provide specific, actionable responses
5. Use a friendly, conversational tone
6. When suggesting routes, consider user preferences
7. For navigation requests, provide clear next steps
8. For searches, suggest relevant nearby options

Respond in a natural, conversational way that sounds good when spoken aloud.`;
  }

  // Parse AI response into structured format
  private parseAIResponse(aiResponse: string, originalInput: string): AIResponse {
    const lowerInput = originalInput.toLowerCase();
    
    // Try to extract structured information from AI response
    const response: AIResponse = {
      type: 'conversation',
      content: aiResponse,
      confidence: 0.8,
    };

    // Detect navigation requests
    if (lowerInput.includes('navigate') || lowerInput.includes('go to') || lowerInput.includes('take me to')) {
      response.type = 'navigation';
      const destination = this.extractDestination(originalInput);
      response.navigationRequest = {
        destination,
        routeType: this.determineRouteType(lowerInput),
      };
      response.entities = { destination };
    }

    // Detect search requests
    if (lowerInput.includes('find') || lowerInput.includes('search') || lowerInput.includes('where is')) {
      response.type = 'search';
      const query = this.extractSearchQuery(originalInput);
      response.searchRequest = {
        query,
        type: this.determineSearchType(lowerInput),
        radius: 5000, // 5km default
      };
      response.entities = { question: query };
    }

    // Detect preference learning
    if (lowerInput.includes('prefer') || lowerInput.includes('avoid') || lowerInput.includes('like')) {
      response.type = 'preference';
      const preference = this.extractPreference(originalInput);
      response.entities = { preference };
    }

    // Add suggestions based on context
    response.suggestions = this.generateSuggestions(lowerInput, aiResponse);

    return response;
  }

  // Extract destination from input
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

  // Extract search query from input
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

  // Extract user preference from input
  private extractPreference(input: string): string {
    return input.toLowerCase();
  }

  // Determine route type based on user input
  private determineRouteType(input: string): 'fastest' | 'scenic' | 'avoid_highways' | 'avoid_tolls' {
    if (input.includes('scenic') || input.includes('beautiful')) return 'scenic';
    if (input.includes('avoid highway') || input.includes('no highways')) return 'avoid_highways';
    if (input.includes('avoid tolls') || input.includes('no tolls')) return 'avoid_tolls';
    return 'fastest';
  }

  // Determine search type based on user input
  private determineSearchType(input: string): 'restaurant' | 'gas' | 'parking' | 'restroom' | 'coffee' | 'general' {
    if (input.includes('restaurant') || input.includes('food') || input.includes('eat')) return 'restaurant';
    if (input.includes('gas') || input.includes('fuel') || input.includes('station')) return 'gas';
    if (input.includes('parking') || input.includes('park')) return 'parking';
    if (input.includes('restroom') || input.includes('bathroom') || input.includes('toilet')) return 'restroom';
    if (input.includes('coffee') || input.includes('cafe')) return 'coffee';
    return 'general';
  }

  // Generate contextual suggestions
  private generateSuggestions(input: string, aiResponse: string): string[] {
    const suggestions: string[] = [];
    
    if (input.includes('traffic')) {
      suggestions.push('Check alternative routes', 'Update ETA');
    }
    
    if (input.includes('navigate') || input.includes('go to')) {
      suggestions.push('Start navigation', 'Check traffic', 'Find parking');
    }
    
    if (input.includes('find') || input.includes('search')) {
      suggestions.push('Show on map', 'Get directions', 'Check reviews');
    }
    
    if (input.includes('coffee') || input.includes('food')) {
      suggestions.push('Find nearby options', 'Check hours', 'Get directions');
    }
    
    return suggestions;
  }

  // Generate route suggestions based on context
  async generateRouteSuggestions(
    currentRoute: any,
    userPreferences: UserPreference[],
    drivingTime: number
  ): Promise<RouteSuggestion[]> {
    const suggestions: RouteSuggestion[] = [];
    
    // Suggest coffee stops for long drives
    if (drivingTime > 7200) { // 2 hours
      suggestions.push({
        type: 'coffee_stop',
        title: 'Coffee Break',
        description: 'You\'ve been driving for a while. Would you like to stop for coffee?',
        priority: 'medium',
      });
    }
    
    // Suggest gas stops if low fuel detected (mock)
    if (Math.random() > 0.8) { // 20% chance for demo
      suggestions.push({
        type: 'gas_stop',
        title: 'Gas Station',
        description: 'There\'s a gas station coming up. Would you like to stop?',
        priority: 'high',
      });
    }
    
    // Suggest scenic routes based on preferences
    const prefersScenic = userPreferences.some(p => 
      p.type === 'prefer_scenic' && p.value.includes('scenic')
    );
    
    if (prefersScenic) {
      suggestions.push({
        type: 'scenic_route',
        title: 'Scenic Alternative',
        description: 'I found a more scenic route. Would you like to try it?',
        priority: 'medium',
      });
    }
    
    return suggestions;
  }

  // Analyze traffic patterns and provide insights
  async analyzeTrafficPatterns(
    currentLocation: any,
    destination: any,
    routeData: any
  ): Promise<{
    trafficLevel: 'light' | 'moderate' | 'heavy';
    estimatedDelay: number;
    suggestions: string[];
  }> {
    // Mock traffic analysis - in real app, this would use real traffic data
    const trafficLevels = ['light', 'moderate', 'heavy'];
    const trafficLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)] as 'light' | 'moderate' | 'heavy';
    
    const estimatedDelay = Math.floor(Math.random() * 15) + 5; // 5-20 minutes
    
    const suggestions: string[] = [];
    if (trafficLevel === 'heavy') {
      suggestions.push('Consider leaving 15 minutes earlier', 'Check alternative routes');
    } else if (trafficLevel === 'moderate') {
      suggestions.push('Traffic is manageable', 'ETA is accurate');
    } else {
      suggestions.push('Clear roads ahead', 'Good time to travel');
    }
    
    return {
      trafficLevel,
      estimatedDelay,
      suggestions,
    };
  }

  // Learn from user interactions
  async learnFromInteraction(
    userInput: string,
    userAction: string,
    outcome: 'success' | 'failure' | 'partial'
  ): Promise<void> {
    // In a real implementation, this would update the AI model
    // For now, we'll just log the interaction
    console.log('🤖 Learning from interaction:', {
      input: userInput,
      action: userAction,
      outcome,
    });
  }

  // Get conversation insights
  getConversationInsights(): {
    mostCommonRequests: string[];
    userPreferences: string[];
    suggestedImprovements: string[];
  } {
    // Analyze conversation history for insights
    const insights = {
      mostCommonRequests: ['navigation', 'traffic', 'search'],
      userPreferences: ['avoid highways', 'prefer scenic routes'],
      suggestedImprovements: ['Add more voice commands', 'Improve traffic accuracy'],
    };
    
    return insights;
  }

  // Get available AI providers
  getAvailableProviders(): Array<{ id: AIProvider; name: string; cost: string; setup: string }> {
    return [
      {
        id: 'mock',
        name: 'Mock AI (Testing)',
        cost: 'FREE',
        setup: 'No setup required - works immediately',
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        cost: 'FREE',
        setup: 'Install Ollama locally and run models like Llama2',
      },
      {
        id: 'huggingface',
        name: 'Hugging Face',
        cost: 'FREE (with limits)',
        setup: 'Get API key from Hugging Face',
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        cost: '$0.15/1M tokens',
        setup: 'Get API key from Anthropic',
      },
      {
        id: 'openai',
        name: 'OpenAI GPT-3.5',
        cost: '$0.002/1K tokens',
        setup: 'Get API key from OpenAI',
      },
    ];
  }
}

export default new AIService();
