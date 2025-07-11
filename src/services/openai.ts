import axios from 'axios';
import { VoiceCommand } from '../types';

const OPENAI_API_KEY = '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';

const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const processVoiceCommand = async (text: string, context?: any): Promise<VoiceCommand> => {
  try {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Cruise, a voice-controlled navigation assistant. 
          
Context: ${context ? JSON.stringify(context) : 'No context'}

Your role is to:
1. Understand natural language navigation requests
2. Extract relevant information for navigation, finding places, or answering questions
3. Provide a helpful, conversational response

Always be concise and helpful. If the user asks for navigation, use navigate type. If they ask about nearby places, use find type. If they ask about the route, use question type. For general questions, use general type.`
        },
        {
          role: 'user',
          content: text,
        }
      ],
      functions: [
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
      ],
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 150,
    });

    const message = response.data.choices[0]?.message;
    
    if (message?.function_call) {
      const functionName = message.function_call.name;
      const parameters = JSON.parse(message.function_call.arguments);
      
      return {
        type: functionName === 'navigateTo' ? 'navigate' : 
              functionName === 'findPitStop' ? 'find' : 
              functionName === 'questionOnRoute' ? 'question' : 'general',
        query: text,
        parameters,
      };
    }

    return {
      type: 'general',
      query: text,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      type: 'general',
      query: text,
    };
  }
};

export const generateResponse = async (question: string, context?: any): Promise<string> => {
  try {
    const response = await openai.post('/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are Cruise, a helpful voice assistant. Answer questions concisely and conversationally. Keep responses under 50 words unless more detail is specifically requested.',
        },
        {
          role: 'user',
          content: question,
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    return response.data.choices[0]?.message?.content || 'I\'m sorry, I didn\'t catch that. Could you repeat?';
  } catch (error) {
    console.error('OpenAI response generation error:', error);
    return 'I\'m sorry, I couldn\'t process that request. Please try again.';
  }
}; 