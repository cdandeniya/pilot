import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function definitions for GPT-4o function calling
export const voiceFunctions = [
  {
    name: 'navigateTo',
    description: 'Navigate to a specific destination',
    parameters: {
      type: 'object',
      properties: {
        destination: {
          type: 'string',
          description: 'The destination address or place name',
        },
        mode: {
          type: 'string',
          enum: ['driving', 'walking', 'transit'],
          description: 'Transportation mode',
          default: 'driving',
        },
      },
      required: ['destination'],
    },
  },
  {
    name: 'findPitStop',
    description: 'Find nearby places like gas stations, restaurants, or restrooms',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Type of place to find (gas, food, restroom, coffee, etc.)',
        },
        preference: {
          type: 'string',
          description: 'Specific preference like "cheapest", "closest", "highest rated"',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'questionOnRoute',
    description: 'Ask questions about the current route or general navigation',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question about the route, ETA, traffic, etc.',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'generalQuestion',
    description: 'Answer general questions not related to navigation',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The general question to answer',
        },
      },
      required: ['question'],
    },
  },
]

// Process voice command with GPT-4o function calling
export const processVoiceCommand = async (
  userMessage: string,
  context?: {
    currentLocation?: { lat: number; lng: number }
    currentRoute?: any
    tripStatus?: string
  }
): Promise<{
  functionName: string
  parameters: any
  response: string
}> => {
  const systemPrompt = `You are Cruise, a voice-controlled navigation assistant. 
  
Context:
- Current location: ${context?.currentLocation ? `${context.currentLocation.lat}, ${context.currentLocation.lng}` : 'Unknown'}
- Trip status: ${context?.tripStatus || 'No active trip'}

Your role is to:
1. Understand natural language navigation requests
2. Extract relevant information for navigation, finding places, or answering questions
3. Use the appropriate function to handle the request
4. Provide a helpful, conversational response

Always be concise and helpful. If the user asks for navigation, use navigateTo. If they ask about nearby places, use findPitStop. If they ask about the route, use questionOnRoute. For general questions, use generalQuestion.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    functions: voiceFunctions,
    function_call: 'auto',
    temperature: 0.7,
    max_tokens: 150,
  })

  const message = response.choices[0]?.message

  if (message?.function_call) {
    const functionName = message.function_call.name
    const parameters = JSON.parse(message.function_call.arguments)
    
    return {
      functionName,
      parameters,
      response: message.content || `I'll help you with that.`,
    }
  }

  return {
    functionName: 'generalQuestion',
    parameters: { question: userMessage },
    response: message?.content || 'I heard you, but I\'m not sure what you need. Could you try again?',
  }
}

// Text-to-speech using OpenAI TTS
export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
  })

  return response.arrayBuffer()
}

// Speech-to-text using OpenAI Whisper (fallback)
export const speechToText = async (audioBlob: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', 'whisper-1')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to transcribe audio')
  }

  const result = await response.json()
  return result.text
}

// Generate contextual responses for route questions
export const generateRouteResponse = async (
  question: string,
  routeData: any
): Promise<string> => {
  const systemPrompt = `You are a navigation assistant. Answer questions about the current route based on the provided route data. Be concise and helpful.

Route data: ${JSON.stringify(routeData)}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    temperature: 0.3,
    max_tokens: 100,
  })

  return response.choices[0]?.message?.content || 'I\'m sorry, I couldn\'t get that information right now.'
}

// Generate responses for general questions
export const generateGeneralResponse = async (question: string): Promise<string> => {
  const systemPrompt = `You are Cruise, a helpful voice assistant. Answer general questions concisely and conversationally. Keep responses under 50 words unless more detail is specifically requested.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    temperature: 0.7,
    max_tokens: 100,
  })

  return response.choices[0]?.message?.content || 'I\'m sorry, I didn\'t catch that. Could you repeat?'
} 