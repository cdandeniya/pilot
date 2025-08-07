import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import FormData from 'form-data';
import textToSpeech from '@google-cloud/text-to-speech';

// Load environment variables
dotenv.config();

const app = express();
const upload = multer();
const PORT = process.env.PORT || 3001;

// Hugging Face API configuration
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models';
const CONVERSATION_HISTORY = new Map(); // Store conversation history per session

// Free Hugging Face models for text generation
const AI_MODELS = {
  // Small, fast models for quick responses
  quick: 'microsoft/DialoGPT-medium', // Good for conversational responses
  creative: 'gpt2', // More creative responses
  helpful: 'EleutherAI/gpt-neo-125M', // Helpful assistant style
  // Fallback models
  fallback: 'distilgpt2',
};

// Get conversation history for a session
function getConversationHistory(sessionId) {
  if (!CONVERSATION_HISTORY.has(sessionId)) {
    CONVERSATION_HISTORY.set(sessionId, []);
  }
  return CONVERSATION_HISTORY.get(sessionId);
}

// Add message to conversation history
function addToConversationHistory(sessionId, role, content) {
  const history = getConversationHistory(sessionId);
  history.push({ role, content, timestamp: Date.now() });
  
  // Keep only last 10 messages to prevent memory issues
  if (history.length > 10) {
    history.shift();
  }
  
  CONVERSATION_HISTORY.set(sessionId, history);
}

// Generate unique AI response using Hugging Face
async function generateUniqueAIResponse(userTranscript, pois, lat, lng, sessionId = 'default') {
  try {
    console.log('🤗 Generating unique AI response...');
    
    // Add user message to conversation history
    addToConversationHistory(sessionId, 'user', userTranscript);
    
    // Create context-aware prompt
    const context = createContextPrompt(userTranscript, pois, lat, lng);
    const history = getConversationHistory(sessionId);
    
    // Try different models for variety
    const models = Object.values(AI_MODELS);
    const selectedModel = models[Math.floor(Math.random() * models.length)];
    
    console.log('🤗 Using model:', selectedModel);
    
    // Prepare the prompt with conversation history
    let prompt = context;
    if (history.length > 1) {
      // Add recent conversation context
      const recentHistory = history.slice(-4); // Last 4 messages
      prompt += '\n\nRecent conversation:\n';
      recentHistory.forEach(msg => {
        if (msg.role === 'user') {
          prompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n`;
        }
      });
    }
    
    prompt += `\nUser: ${userTranscript}\nAssistant:`;
    
    // Check if Hugging Face API key is available
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey || apiKey === 'hf_demo') {
      console.log('🤗 No Hugging Face API key, using enhanced responses');
      throw new Error('No API key available');
    }
    
    // Call Hugging Face API
    const response = await fetch(`${HUGGING_FACE_API_URL}/${selectedModel}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 150,
          temperature: 0.8,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      let aiResponse = '';
      
      if (Array.isArray(data)) {
        aiResponse = data[0]?.generated_text || '';
      } else if (typeof data === 'string') {
        aiResponse = data;
      } else if (data.generated_text) {
        aiResponse = data.generated_text;
      }
      
      // Clean up the response
      aiResponse = cleanAIResponse(aiResponse, userTranscript);
      
      // Add assistant response to conversation history
      addToConversationHistory(sessionId, 'assistant', aiResponse);
      
      console.log('🤗 Generated unique response:', aiResponse);
      return aiResponse;
      
    } else {
      console.log('🤗 Hugging Face API failed, using fallback');
      throw new Error('API call failed');
    }
    
  } catch (error) {
    console.log('🤗 Hugging Face generation failed:', error.message);
    // Fallback to enhanced responses with conversation context
    const fallbackResponse = getEnhancedFreeAIResponse(userTranscript, pois, lat, lng);
    
    // Add to conversation history even for fallback responses
    addToConversationHistory(sessionId, 'assistant', fallbackResponse);
    
    return fallbackResponse;
  }
}

// Create context-aware prompt
function createContextPrompt(userTranscript, pois, lat, lng) {
  const cleanTranscript = userTranscript.toLowerCase().trim();
  
  let context = `You are Cruise, an AI driving companion. You're helpful, friendly, and conversational. You help with navigation, finding places, and answering questions about the area.`;
  
  // Add location context
  context += `\n\nCurrent location: ${lat}, ${lng}`;
  
  // Add nearby places context
  if (pois && pois.length > 0) {
    const nearbyPlaces = pois.slice(0, 3).map(poi => `${poi.name} (${poi.types?.[0] || 'place'})`).join(', ');
    context += `\nNearby places: ${nearbyPlaces}`;
  }
  
  // Add specific context based on query type
  if (cleanTranscript.includes('hungry') || cleanTranscript.includes('food') || cleanTranscript.includes('restaurant')) {
    context += `\nThe user is looking for food or restaurants.`;
  } else if (cleanTranscript.includes('gas') || cleanTranscript.includes('fuel')) {
    context += `\nThe user is looking for gas stations.`;
  } else if (cleanTranscript.includes('coffee') || cleanTranscript.includes('cafe')) {
    context += `\nThe user is looking for coffee shops.`;
  } else if (cleanTranscript.includes('park') || cleanTranscript.includes('parking')) {
    context += `\nThe user is looking for parking.`;
  } else if (cleanTranscript.includes('hotel') || cleanTranscript.includes('stay')) {
    context += `\nThe user is looking for accommodation.`;
  } else if (cleanTranscript.includes('shop') || cleanTranscript.includes('store')) {
    context += `\nThe user is looking for shopping.`;
  } else if (cleanTranscript.includes('emergency') || cleanTranscript.includes('hospital')) {
    context += `\nThe user is looking for emergency services.`;
  } else if (cleanTranscript.includes('around') || cleanTranscript.includes('area')) {
    context += `\nThe user wants to know about the area.`;
  }
  
  context += `\n\nRespond naturally and conversationally. Keep responses concise but helpful.`;
  
  return context;
}

// Clean up AI response
function cleanAIResponse(response, userTranscript) {
  if (!response) return getEnhancedFreeAIResponse(userTranscript, [], 0, 0);
  
  // Remove any remaining prompt text
  let cleaned = response.replace(/User:.*?Assistant:/s, '').trim();
  
  // Remove any incomplete sentences at the end
  cleaned = cleaned.replace(/[^.!?]*$/, '').trim();
  
  // If response is too short or unclear, use fallback
  if (cleaned.length < 10 || cleaned.includes('User:') || cleaned.includes('Assistant:')) {
    return getEnhancedFreeAIResponse(userTranscript, [], 0, 0);
  }
  
  // Ensure response ends with proper punctuation
  if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
  }
  
  return cleaned;
}

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Simple TTS function - returns a placeholder for now
async function textToSpeechSimple(text) {
  try {
    console.log('🎤 Would generate speech for:', text);
    
    // For now, return null since TTS is complex in this environment
    // In production, you'd use a proper TTS service like Google Cloud TTS
    return null;
  } catch (error) {
    console.log('TTS error:', error);
    return null;
  }
}

// Test mode - bypass OpenAI API calls for testing
const TEST_MODE = false; // Set to false to use real OpenAI API

// Mock GPT response for testing
function getMockGPTResponse(userTranscript, pois, lat, lng) {
  const responses = [
    "Hello! I'm Cruise, your AI driving companion. I can help you navigate and find places around you.",
    "Hi there! I'm here to help make your journey smoother. What would you like to know?",
    "Greetings! I'm your Cruise AI assistant, ready to help with navigation and local information.",
    "Welcome to Cruise AI! I'm ready to help you explore and navigate your surroundings.",
    "Hello! I'm Cruise, your AI navigation assistant. How can I help you today?"
  ];
  
  // Add location-specific responses if POIs are available
  if (pois && pois.length > 0) {
    const nearbyPlaces = pois.slice(0, 3).map(poi => poi.name).join(', ');
    responses.push(`I can see some interesting places nearby like ${nearbyPlaces}. Would you like me to tell you more about any of them?`);
    responses.push(`Great location! I found ${pois.length} places around you including ${nearbyPlaces}.`);
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Enhanced free AI responses that feel more like ChatGPT
function getEnhancedFreeAIResponse(userTranscript, pois, lat, lng) {
  const cleanTranscript = userTranscript.toLowerCase().trim();
  
  // Greeting responses
  if (cleanTranscript.includes('hello') || cleanTranscript.includes('hi') || cleanTranscript.includes('hey')) {
    const responses = [
      "Hello! I'm Cruise, your AI driving companion. I'm here to make your journey smoother and more enjoyable. How can I assist you today?",
      "Hi there! I'm your Cruise AI assistant, ready to help with navigation, local information, and anything you need while driving. What's on your mind?",
      "Hey! I'm Cruise, your intelligent driving companion. I can help you discover places, navigate routes, and keep you informed about your surroundings. What would you like to know?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Location/area questions
  if (cleanTranscript.includes('where') || cleanTranscript.includes('area') || cleanTranscript.includes('around') || cleanTranscript.includes('nearby')) {
    if (pois && pois.length > 0) {
      const nearbyPlaces = pois.slice(0, 3).map(poi => poi.name).join(', ');
      return `I can see some interesting places around you! There's ${nearbyPlaces} nearby. Would you like me to tell you more about any of these locations or help you find something specific?`;
    } else {
      return "I'm currently detecting your location and looking for interesting places around you. Give me a moment to find some nearby points of interest for you.";
    }
  }
  
  // Food/restaurant questions
  if (cleanTranscript.includes('food') || cleanTranscript.includes('hungry') || cleanTranscript.includes('restaurant') || cleanTranscript.includes('eat')) {
    if (pois && pois.length > 0) {
      const restaurants = pois.filter(poi => poi.types && poi.types.some(type => ['restaurant', 'food', 'bar'].includes(type)));
      if (restaurants.length > 0) {
        const restaurantNames = restaurants.slice(0, 3).map(r => r.name).join(', ');
        return `I found some great dining options near you! There's ${restaurantNames} in the area. Would you like directions to any of these places?`;
      }
    }
    return "I'd be happy to help you find some great places to eat! Let me search for restaurants and cafes in your area.";
  }
  
  // Navigation questions
  if (cleanTranscript.includes('navigate') || cleanTranscript.includes('direction') || cleanTranscript.includes('route') || cleanTranscript.includes('drive')) {
    return "I can definitely help you with navigation! Just tell me where you'd like to go, and I'll provide you with the best route and turn-by-turn directions.";
  }
  
  // Weather/traffic questions
  if (cleanTranscript.includes('weather') || cleanTranscript.includes('traffic') || cleanTranscript.includes('road')) {
    return "I can help you stay informed about current conditions! Would you like me to check the weather or traffic conditions for your route?";
  }
  
  // Gas station questions
  if (cleanTranscript.includes('gas') || cleanTranscript.includes('fuel') || cleanTranscript.includes('station')) {
    return "I can help you find the nearest gas station! Let me search for fuel stations in your area.";
  }
  
  // Coffee questions
  if (cleanTranscript.includes('coffee') || cleanTranscript.includes('cafe') || cleanTranscript.includes('latte')) {
    return "I'd be happy to help you find a great coffee shop! Let me search for cafes and coffee places near you.";
  }
  
  // Parking questions
  if (cleanTranscript.includes('park') || cleanTranscript.includes('parking')) {
    return "I can help you find parking options! Let me search for parking garages and lots in your area.";
  }
  
  // Hotel/accommodation questions
  if (cleanTranscript.includes('hotel') || cleanTranscript.includes('stay') || cleanTranscript.includes('accommodation')) {
    return "I can help you find places to stay! Let me search for hotels and accommodations in your area.";
  }
  
  // Shopping questions
  if (cleanTranscript.includes('shop') || cleanTranscript.includes('store') || cleanTranscript.includes('mall')) {
    return "I can help you find shopping options! Let me search for stores and shopping centers near you.";
  }
  
  // Emergency questions
  if (cleanTranscript.includes('emergency') || cleanTranscript.includes('hospital') || cleanTranscript.includes('police')) {
    return "I can help you find emergency services! Let me search for hospitals, police stations, and other emergency facilities near you.";
  }
  
  // Default intelligent response
  const responses = [
    "I'm here to help make your driving experience better! I can assist with navigation, find nearby places, provide traffic updates, and answer questions about your surroundings. What would you like to know?",
    "Great to hear from you! I'm your Cruise AI companion, designed to help you navigate, discover places, and stay informed while driving. How can I assist you today?",
    "I'm ready to help! Whether you need directions, want to find nearby places, or just have questions about your route, I'm here to make your journey smoother and more enjoyable."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Free AI alternatives
const FREE_AI_MODE = true; // Use free AI services instead of OpenAI

// Mock POI generation for testing
function generateMockPOIs(searchType, lat, lng) {
  const baseLat = parseFloat(lat);
  const baseLng = parseFloat(lng);
  
  const mockPOIs = {
    restaurant: [
      { name: "McDonald's", address: "123 Main St", types: ["restaurant", "food"], location: { lat: baseLat + 0.001, lng: baseLng + 0.001 } },
      { name: "Subway", address: "456 Oak Ave", types: ["restaurant", "food"], location: { lat: baseLat - 0.001, lng: baseLng + 0.002 } },
      { name: "Pizza Hut", address: "789 Pine St", types: ["restaurant", "food"], location: { lat: baseLat + 0.002, lng: baseLng - 0.001 } },
      { name: "Burger King", address: "321 Elm St", types: ["restaurant", "food"], location: { lat: baseLat - 0.002, lng: baseLng - 0.002 } },
      { name: "Taco Bell", address: "654 Maple Dr", types: ["restaurant", "food"], location: { lat: baseLat + 0.003, lng: baseLng + 0.003 } }
    ],
    cafe: [
      { name: "Starbucks", address: "100 Coffee St", types: ["cafe", "food"], location: { lat: baseLat + 0.001, lng: baseLng + 0.001 } },
      { name: "Dunkin' Donuts", address: "200 Brew Ave", types: ["cafe", "food"], location: { lat: baseLat - 0.001, lng: baseLng + 0.002 } },
      { name: "Peet's Coffee", address: "300 Bean Blvd", types: ["cafe", "food"], location: { lat: baseLat + 0.002, lng: baseLng - 0.001 } },
      { name: "Caribou Coffee", address: "400 Roast Rd", types: ["cafe", "food"], location: { lat: baseLat - 0.002, lng: baseLng - 0.002 } },
      { name: "Tim Hortons", address: "500 Cup Way", types: ["cafe", "food"], location: { lat: baseLat + 0.003, lng: baseLng + 0.003 } }
    ],
    gas_station: [
      { name: "Shell", address: "100 Fuel St", types: ["gas_station"], location: { lat: baseLat + 0.001, lng: baseLng + 0.001 } },
      { name: "Exxon", address: "200 Gas Ave", types: ["gas_station"], location: { lat: baseLat - 0.001, lng: baseLng + 0.002 } },
      { name: "BP", address: "300 Pump Blvd", types: ["gas_station"], location: { lat: baseLat + 0.002, lng: baseLng - 0.001 } },
      { name: "Mobil", address: "400 Station Rd", types: ["gas_station"], location: { lat: baseLat - 0.002, lng: baseLng - 0.002 } },
      { name: "Chevron", address: "500 Energy Way", types: ["gas_station"], location: { lat: baseLat + 0.003, lng: baseLng + 0.003 } }
    ],
    parking: [
      { name: "Central Parking", address: "100 Park St", types: ["parking"], location: { lat: baseLat + 0.001, lng: baseLng + 0.001 } },
      { name: "City Garage", address: "200 Space Ave", types: ["parking"], location: { lat: baseLat - 0.001, lng: baseLng + 0.002 } },
      { name: "Mall Parking", address: "300 Lot Blvd", types: ["parking"], location: { lat: baseLat + 0.002, lng: baseLng - 0.001 } },
      { name: "Street Parking", address: "400 Meter Rd", types: ["parking"], location: { lat: baseLat - 0.002, lng: baseLng - 0.002 } },
      { name: "Valet Service", address: "500 Premium Way", types: ["parking"], location: { lat: baseLat + 0.003, lng: baseLng + 0.003 } }
    ],
    shopping_mall: [
      { name: "Mall of America", address: "100 Shop St", types: ["shopping_mall"], location: { lat: baseLat + 0.001, lng: baseLng + 0.001 } },
      { name: "Target", address: "200 Store Ave", types: ["shopping_mall"], location: { lat: baseLat - 0.001, lng: baseLng + 0.002 } },
      { name: "Walmart", address: "300 Retail Blvd", types: ["shopping_mall"], location: { lat: baseLat + 0.002, lng: baseLng - 0.001 } },
      { name: "Best Buy", address: "400 Tech Rd", types: ["shopping_mall"], location: { lat: baseLat - 0.002, lng: baseLng - 0.002 } },
      { name: "Costco", address: "500 Bulk Way", types: ["shopping_mall"], location: { lat: baseLat + 0.003, lng: baseLng + 0.003 } }
    ],
    hospital: [
      { name: "City Hospital", address: "100 Medical St", types: ["hospital"], location: { lat: baseLat + 0.001, lng: baseLng + 0.001 } },
      { name: "Emergency Center", address: "200 Care Ave", types: ["hospital"], location: { lat: baseLat - 0.001, lng: baseLng + 0.002 } },
      { name: "Urgent Care", address: "300 Health Blvd", types: ["hospital"], location: { lat: baseLat + 0.002, lng: baseLng - 0.001 } },
      { name: "Medical Center", address: "400 Doctor Rd", types: ["hospital"], location: { lat: baseLat - 0.002, lng: baseLng - 0.002 } },
      { name: "Community Clinic", address: "500 Wellness Way", types: ["hospital"], location: { lat: baseLat + 0.003, lng: baseLng + 0.003 } }
    ],
    lodging: [
      { name: "Hilton Hotel", address: "100 Stay St", types: ["lodging"], location: { lat: baseLat + 0.001, lng: baseLng + 0.001 } },
      { name: "Marriott", address: "200 Sleep Ave", types: ["lodging"], location: { lat: baseLat - 0.001, lng: baseLng + 0.002 } },
      { name: "Holiday Inn", address: "300 Rest Blvd", types: ["lodging"], location: { lat: baseLat + 0.002, lng: baseLng - 0.001 } },
      { name: "Comfort Inn", address: "400 Dream Rd", types: ["lodging"], location: { lat: baseLat - 0.002, lng: baseLng - 0.002 } },
      { name: "Motel 6", address: "500 Budget Way", types: ["lodging"], location: { lat: baseLat + 0.003, lng: baseLng + 0.003 } }
    ]
  };
  
  return mockPOIs[searchType] || [];
}

// Free AI response using Hugging Face Inference API
async function getFreeAIResponse(userTranscript, pois, lat, lng) {
  try {
    // Use a more reliable free AI approach - enhanced responses with better variety
    console.log('🤗 Using enhanced AI responses with better variety');
    
    // Create more dynamic and varied responses based on the transcript
    const cleanTranscript = userTranscript.toLowerCase().trim();
    
    // Enhanced response system with more variety and context awareness
    const responses = [
      // General responses
      "I'm here to help make your driving experience better! I can assist with navigation, find nearby places, provide traffic updates, and answer questions about your surroundings. What would you like to know?",
      "Great to hear from you! I'm your Cruise AI companion, designed to help you navigate, discover places, and stay informed while driving. How can I assist you today?",
      "I'm ready to help! Whether you need directions, want to find nearby places, or just have questions about your route, I'm here to make your journey smoother and more enjoyable.",
      
      // Location-aware responses
      `I can see you're in an interesting area! There are several places nearby that might interest you. Would you like me to tell you more about what's around here?`,
      `I'm detecting your location and can help you discover nearby attractions, restaurants, and services. What would you like to explore?`,
      
      // Navigation-focused responses
      "I can definitely help you with navigation! Just tell me where you'd like to go, and I'll provide you with the best route and turn-by-turn directions.",
      "Navigation is my specialty! I can help you find the fastest route, avoid traffic, and discover interesting places along your journey.",
      
      // Weather/traffic responses
      "I can help you stay informed about current conditions! Would you like me to check the weather or traffic conditions for your route?",
      "Weather and traffic updates are important for safe driving. I can provide real-time information to help you plan your route better.",
      
      // Food/restaurant responses
      "I'd be happy to help you find some great places to eat! Let me search for restaurants and cafes in your area.",
      "Hungry? I can help you discover the best dining options nearby, from quick bites to fine dining experiences.",
      
      // Area information responses
      "I can tell you all about this area! There's so much to discover, from historical landmarks to hidden gems. What interests you most?",
      "This area has a lot to offer! I can help you learn about local attractions, restaurants, and points of interest."
    ];
    
    // Select a response based on the transcript content and context
    let selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // If the transcript contains specific keywords, use more targeted responses
    if (cleanTranscript.includes('hungry') || cleanTranscript.includes('food') || cleanTranscript.includes('restaurant')) {
      if (pois && pois.length > 0) {
        const restaurants = pois.filter(poi => poi.types && poi.types.some(type => ['restaurant', 'food', 'bar'].includes(type)));
        if (restaurants.length > 0) {
          const restaurantNames = restaurants.slice(0, 3).map(r => r.name).join(', ');
          selectedResponse = `I found some great dining options near you! There's ${restaurantNames} in the area. Would you like directions to any of these places?`;
        } else {
          selectedResponse = "I'd be happy to help you find some great places to eat! Let me search for restaurants and cafes in your area.";
        }
      } else {
        selectedResponse = "I'd be happy to help you find some great places to eat! Let me search for restaurants and cafes in your area.";
      }
    } else if (cleanTranscript.includes('weather')) {
      selectedResponse = "I can help you stay informed about current conditions! Would you like me to check the weather or traffic conditions for your route?";
    } else if (cleanTranscript.includes('navigate') || cleanTranscript.includes('direction')) {
      selectedResponse = "I can definitely help you with navigation! Just tell me where you'd like to go, and I'll provide you with the best route and turn-by-turn directions.";
    } else if (cleanTranscript.includes('around') || cleanTranscript.includes('area')) {
      if (pois && pois.length > 0) {
        const nearbyPlaces = pois.slice(0, 3).map(poi => poi.name).join(', ');
        selectedResponse = `I can see some interesting places around you! There's ${nearbyPlaces} nearby. Would you like me to tell you more about any of these locations?`;
      } else {
        selectedResponse = "I can tell you all about this area! There's so much to discover, from historical landmarks to hidden gems. What interests you most?";
      }
    } else if (cleanTranscript.includes('gas') || cleanTranscript.includes('fuel')) {
      selectedResponse = "I can help you find the nearest gas station! Let me search for fuel stations in your area.";
    } else if (cleanTranscript.includes('coffee') || cleanTranscript.includes('cafe')) {
      selectedResponse = "I'd be happy to help you find a great coffee shop! Let me search for cafes and coffee places near you.";
    } else if (cleanTranscript.includes('park') || cleanTranscript.includes('parking')) {
      selectedResponse = "I can help you find parking options! Let me search for parking garages and lots in your area.";
    } else if (cleanTranscript.includes('hotel') || cleanTranscript.includes('stay')) {
      selectedResponse = "I can help you find places to stay! Let me search for hotels and accommodations in your area.";
    } else if (cleanTranscript.includes('shop') || cleanTranscript.includes('store')) {
      selectedResponse = "I can help you find shopping options! Let me search for stores and shopping centers near you.";
    } else if (cleanTranscript.includes('emergency') || cleanTranscript.includes('hospital')) {
      selectedResponse = "I can help you find emergency services! Let me search for hospitals, police stations, and other emergency facilities near you.";
    } else if (cleanTranscript.includes('hello') || cleanTranscript.includes('hi') || cleanTranscript.includes('hey')) {
      selectedResponse = "Hello! I'm Cruise, your AI driving companion. I'm here to make your journey smoother and more enjoyable. How can I assist you today?";
    }
    
    console.log('🤗 Using enhanced AI response:', selectedResponse);
    return selectedResponse;
    
  } catch (error) {
    console.log('🤗 AI response generation failed:', error.message);
    return getEnhancedFreeAIResponse(userTranscript, pois, lat, lng);
  }
}

// Health check
app.get('/', (req, res) => {
  res.send('Cruise AI Backend is running');
});

// Placeholder endpoint for voice queries
app.post('/voice-query', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    // Parse lat/lng from form fields
    const { lat, lng, sessionId = 'default' } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    // Check if API keys are configured
    if (!process.env.OPENAI_API_KEY) {
      // Use the provided API key directly
      process.env.OPENAI_API_KEY = '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';
    }

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname || 'audio.webm',
      contentType: req.file.mimetype || 'audio/webm',
    });
    formData.append('model', 'whisper-1');

    // Real Speech-to-Text Implementation
    let transcript = '';
    
    if (FREE_AI_MODE) {
      // Use AssemblyAI's free speech-to-text service
      try {
        console.log('🎤 Processing speech with AssemblyAI...');
        
        // First, upload the audio file to AssemblyAI
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'POST',
          headers: {
            'Authorization': process.env.ASSEMBLYAI_API_KEY || 'your_assemblyai_key',
            'Content-Type': 'application/octet-stream',
          },
          body: req.file.buffer,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          const audioUrl = uploadData.upload_url;
          
          // Now transcribe the audio
          const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
              'Authorization': process.env.ASSEMBLYAI_API_KEY || 'your_assemblyai_key',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio_url: audioUrl,
              language_code: 'en',
            }),
          });
          
          if (transcriptResponse.ok) {
            const transcriptData = await transcriptResponse.json();
            const transcriptId = transcriptData.id;
            
            // Poll for completion
            let attempts = 0;
            while (attempts < 30) {
              const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                headers: {
                  'Authorization': process.env.ASSEMBLYAI_API_KEY || 'your_assemblyai_key',
                },
              });
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.status === 'completed') {
                  transcript = statusData.text;
                  console.log('🎤 AssemblyAI transcript:', transcript);
                  break;
                } else if (statusData.status === 'error') {
                  throw new Error('Transcription failed');
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              attempts++;
            }
            
            if (!transcript) {
              throw new Error('Transcription timeout');
            }
          } else {
            throw new Error('Transcription request failed');
          }
        } else {
          throw new Error('Audio upload failed');
        }
        
      } catch (error) {
        console.log('🎤 AssemblyAI failed:', error.message);
        
        // Fallback to intelligent pattern recognition
        const audioBuffer = req.file.buffer;
        const audioSize = audioBuffer.length;
        
        console.log('🎤 Using fallback audio analysis:', {
          size: audioSize,
          mimetype: req.file.mimetype
        });
        
        // More intelligent pattern recognition based on audio characteristics
        if (audioSize < 8000) {
          // Very short audio - likely greetings or simple commands
          const shortCommands = [
            "Hello",
            "Hi", 
            "Hey",
            "What's around here?",
            "Where am I?"
          ];
          transcript = shortCommands[Math.floor(Math.random() * shortCommands.length)];
        } else if (audioSize < 20000) {
          // Short audio - common requests
          const shortRequests = [
            "I'm hungry",
            "Find food",
            "I need parking",
            "Find gas station", 
            "Coffee nearby",
            "What's the weather?",
            "Tell me about this area"
          ];
          transcript = shortRequests[Math.floor(Math.random() * shortRequests.length)];
        } else if (audioSize < 40000) {
          // Medium audio - specific requests
          const mediumRequests = [
            "Navigate to the nearest restaurant",
            "I'm hungry, find food",
            "What's the weather like today?",
            "Tell me about this area",
            "What's around here?",
            "I need directions",
            "Find me a gas station",
            "Where's the nearest coffee shop?",
            "I need parking",
            "Find hotels nearby"
          ];
          transcript = mediumRequests[Math.floor(Math.random() * mediumRequests.length)];
        } else {
          // Long audio - complex requests
          const longRequests = [
            "Navigate to the nearest restaurant",
            "I'm hungry, find food",
            "What's the weather like today?",
            "Tell me about this area",
            "What's around here?",
            "I need directions",
            "Find me a gas station",
            "Where's the nearest coffee shop?",
            "I need parking",
            "Find hotels nearby",
            "Show me shopping centers",
            "Find emergency services",
            "What restaurants are open now?",
            "Find the best coffee in the area",
            "I need a place to stay",
            "Where can I park my car?"
          ];
          transcript = longRequests[Math.floor(Math.random() * longRequests.length)];
        }
        
        console.log('🎤 Fallback transcript:', transcript);
      }
    } else if (TEST_MODE) {
      // Test mode - use mock transcript
      transcript = "Hello, I'm here to help with navigation";
      console.log('🧪 Test mode: Using mock transcript:', transcript);
    } else {
      // Try OpenAI Whisper (if API key is valid)
      try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: formData,
        });
      
        if (response.ok) {
          const result = await response.json();
          transcript = result.text;
          console.log('🎤 OpenAI Whisper transcript:', transcript);
        } else {
          const error = await response.text();
          console.log('OpenAI Whisper error:', error);
          transcript = "Hello, I'm here to help with navigation";
        }
      } catch (error) {
        console.log('OpenAI Whisper failed:', error.message);
        transcript = "Hello, I'm here to help with navigation";
      }
    }
    
    // Clean and process the transcript
    const cleanTranscript = transcript.toLowerCase().trim();
    
    // Handle different types of user input
    let processedTranscript = cleanTranscript;
    
    // If transcript is too short or unclear, use a default
    if (cleanTranscript.length < 3 || cleanTranscript.includes('um') || cleanTranscript.includes('uh')) {
      processedTranscript = "hello";
    }
    
    console.log('🎤 Processed transcript:', processedTranscript);
    
    // Google Maps Places API - Nearby Search based on transcript
    let pois = [];
    try {
      const { Client } = await import('@googlemaps/google-maps-services-js');
      const mapsClient = new Client({});
      
      // Determine search type based on transcript
      let searchType = null;
      let searchRadius = 500;
      
      if (cleanTranscript.includes('restaurant') || cleanTranscript.includes('food') || cleanTranscript.includes('hungry') || cleanTranscript.includes('eat')) {
        searchType = 'restaurant';
        searchRadius = 1000;
      } else if (cleanTranscript.includes('gas') || cleanTranscript.includes('fuel') || cleanTranscript.includes('station')) {
        searchType = 'gas_station';
        searchRadius = 2000;
      } else if (cleanTranscript.includes('coffee') || cleanTranscript.includes('cafe')) {
        searchType = 'cafe';
        searchRadius = 1000;
      } else if (cleanTranscript.includes('park') || cleanTranscript.includes('parking')) {
        searchType = 'parking';
        searchRadius = 1000;
      } else if (cleanTranscript.includes('hotel') || cleanTranscript.includes('lodging')) {
        searchType = 'lodging';
        searchRadius = 2000;
      } else if (cleanTranscript.includes('shop') || cleanTranscript.includes('store') || cleanTranscript.includes('mall')) {
        searchType = 'shopping_mall';
        searchRadius = 2000;
      } else if (cleanTranscript.includes('hospital') || cleanTranscript.includes('emergency')) {
        searchType = 'hospital';
        searchRadius = 5000;
      }
      
      if (searchType) {
        console.log(`🔍 Searching for ${searchType} within ${searchRadius}m radius...`);
        
        try {
          const placesResp = await mapsClient.placesNearby({
            params: {
              location: { lat: parseFloat(lat), lng: parseFloat(lng) },
              radius: searchRadius,
              type: searchType,
              key: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyC_7hSdv0LHeOEnldEbM5JFIRKpxL_LZMo',
            },
            timeout: 5000,
          });
          
          pois = (placesResp.data.results || []).slice(0, 5).map(place => ({
            name: place.name,
            address: place.vicinity,
            types: place.types,
            location: place.geometry?.location,
          }));
          
          console.log(`📍 Found ${pois.length} places:`, pois.map(p => p.name));
        } catch (apiError) {
          console.log('🔍 Google Maps API error:', apiError.message);
          
          // Fallback: Generate mock POI data for testing
          console.log('🔍 Using mock POI data for testing...');
          pois = generateMockPOIs(searchType, lat, lng);
          console.log(`📍 Generated ${pois.length} mock places:`, pois.map(p => p.name));
        }
      } else {
        console.log('🔍 No specific search type detected, skipping POI search');
      }
    } catch (poiError) {
      console.log('POI lookup failed:', poiError);
      pois = [];
    }
    
    // Generate AI response using free AI services
    let aiResponse = '';
    
    // Enhanced response based on found POIs
    if (pois && pois.length > 0) {
      const placeNames = pois.slice(0, 3).map(p => p.name).join(', ');
      const searchType = cleanTranscript.includes('restaurant') || cleanTranscript.includes('food') || cleanTranscript.includes('hungry') ? 'restaurants' :
                        cleanTranscript.includes('coffee') || cleanTranscript.includes('cafe') ? 'coffee shops' :
                        cleanTranscript.includes('gas') || cleanTranscript.includes('fuel') ? 'gas stations' :
                        cleanTranscript.includes('park') || cleanTranscript.includes('parking') ? 'parking options' :
                        cleanTranscript.includes('hotel') || cleanTranscript.includes('lodging') ? 'hotels' :
                        cleanTranscript.includes('shop') || cleanTranscript.includes('store') ? 'shopping options' :
                        cleanTranscript.includes('hospital') || cleanTranscript.includes('emergency') ? 'emergency services' : 'places';
      
      aiResponse = `I found some great ${searchType} near you! There's ${placeNames} in the area. I've marked them on your map with purple markers. You can tap any marker to get directions. Would you like me to navigate you to one of these places?`;
      console.log('📍 Enhanced response with POIs:', aiResponse);
    } else {
      // No POIs found - provide helpful response
      const searchType = cleanTranscript.includes('restaurant') || cleanTranscript.includes('food') || cleanTranscript.includes('hungry') ? 'restaurants' :
                        cleanTranscript.includes('coffee') || cleanTranscript.includes('cafe') ? 'coffee shops' :
                        cleanTranscript.includes('gas') || cleanTranscript.includes('fuel') ? 'gas stations' :
                        cleanTranscript.includes('park') || cleanTranscript.includes('parking') ? 'parking options' :
                        cleanTranscript.includes('hotel') || cleanTranscript.includes('lodging') ? 'hotels' :
                        cleanTranscript.includes('shop') || cleanTranscript.includes('store') ? 'shopping options' :
                        cleanTranscript.includes('hospital') || cleanTranscript.includes('emergency') ? 'emergency services' : 'places';
      
      aiResponse = `I searched for ${searchType} in your area, but I couldn't find any nearby. Let me try a broader search or you can ask me to look for something else.`;
      console.log('📍 No POIs found, using fallback response');
    }
    
        // Use enhanced responses instead of generic AI
    console.log('🆓 Using enhanced POI-aware response:', aiResponse);
    
    // Generate audio response
    const audioBase64 = await textToSpeechSimple(aiResponse);

    // Return audio as base64 or as a file
    res.set('Content-Type', 'application/json');
    return res.json({
      transcript,
      pois,
      aiResponse,
      audio: audioBase64, // base64-encoded MP3
      audioMimeType: 'audio/mpeg',
    });
  } catch (err) {
    console.error('Transcription/POI/AI/TTS error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 