# Cruise AI Backend

This is the backend server for Cruise AI, providing voice processing, AI responses, and POI search functionality.

## Features

### 🤗 Hugging Face AI Integration
- **Unique AI Responses**: Uses Hugging Face models to generate unique, conversational responses
- **Conversation Memory**: Tracks conversation history for context-aware responses
- **Multiple Models**: Rotates between different AI models for variety
- **Free Tier**: Uses Hugging Face's free inference API

### 🎤 Voice Processing
- **Speech-to-Text**: Processes voice recordings (simulated for demo)
- **Audio Response**: Text-to-speech capabilities
- **Session Management**: Tracks individual user conversations

### 📍 POI Search
- **Google Maps Integration**: Searches for nearby places
- **Context-Aware Search**: Finds relevant places based on voice queries
- **Category Filtering**: Searches for specific types of places

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the backend directory:

```env
# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Hugging Face API Key (Optional - for unique AI responses)
HUGGING_FACE_API_KEY=your_hugging_face_api_key_here

# AssemblyAI API Key (Optional - for real speech-to-text)
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Server Configuration
PORT=3001
```

### 3. Hugging Face API Key Setup

To get unique AI responses like ChatGPT Voice, you'll need a Hugging Face API key:

1. **Sign up for Hugging Face**:
   - Go to [huggingface.co](https://huggingface.co)
   - Create a free account

2. **Get your API key**:
   - Go to your profile settings
   - Navigate to "Access Tokens"
   - Create a new token
   - Copy the token

3. **Add to environment**:
   ```env
   HUGGING_FACE_API_KEY=hf_your_token_here
   ```

### 4. AssemblyAI Setup (For Real Speech-to-Text)

To get actual speech-to-text functionality (instead of simulated responses):

1. **Sign up for AssemblyAI**:
   - Go to [assemblyai.com](https://assemblyai.com)
   - Create a free account

2. **Get your API key**:
   - Go to your dashboard
   - Copy your API key
   - Add it to your `.env` file

3. **Free tier includes**:
   - 5 hours of audio transcription per month
   - Real-time speech recognition
   - High accuracy transcription

### 5. Start the Server
```bash
npm start
```

## AI Models Used

The backend uses several free Hugging Face models for variety:

- **microsoft/DialoGPT-medium**: Good for conversational responses
- **gpt2**: More creative responses
- **EleutherAI/gpt-neo-125M**: Helpful assistant style
- **distilgpt2**: Fast fallback model

## API Endpoints

### POST /voice-query
Processes voice queries and returns AI responses.

**Request Body:**
- `audio`: Audio file (multipart/form-data)
- `lat`: Latitude (string)
- `lng`: Longitude (string)
- `sessionId`: Session ID for conversation tracking (optional)

**Response:**
```json
{
  "transcript": "User's speech transcript",
  "aiResponse": "AI's response",
  "pois": [
    {
      "name": "Place name",
      "address": "Address",
      "types": ["restaurant", "food"],
      "location": { "lat": 37.7749, "lng": -122.4194 }
    }
  ],
  "audio": "base64_encoded_audio_response"
}
```

## Conversation Features

### Session Management
- Each user gets a unique session ID
- Conversation history is maintained per session
- Context is preserved across multiple interactions

### Context-Aware Responses
- AI considers user's location
- References nearby places when relevant
- Maintains conversation flow

### Response Variety
- Rotates between different AI models
- Uses temperature and sampling for variety
- Falls back to predefined responses if API fails

## Development

### Testing Voice Queries
You can test the voice endpoint using curl:

```bash
curl -X POST http://localhost:3001/voice-query \
  -F "audio=@test_audio.wav" \
  -F "lat=37.7749" \
  -F "lng=-122.4194" \
  -F "sessionId=test_session"
```

### Debug Mode
Set `TEST_MODE=true` in the environment to use mock responses for testing.

### Free AI Mode
Set `FREE_AI_MODE=true` to use Hugging Face models instead of OpenAI.

## Troubleshooting

### Hugging Face API Issues
- **Rate Limits**: Free tier has rate limits, responses may be slower
- **Model Loading**: Models may take time to load on first request
- **API Key**: Ensure your Hugging Face API key is valid

### Google Maps API Issues
- **API Key**: Ensure your Google Maps API key is valid
- **Quotas**: Check your Google Maps API quotas
- **Billing**: Ensure billing is enabled for Google Maps APIs

### Audio Processing Issues
- **File Format**: Ensure audio files are in supported formats
- **File Size**: Large files may timeout
- **Permissions**: Ensure proper file permissions

## Performance Tips

1. **Use Session IDs**: Always send session IDs for better conversation tracking
2. **Cache Responses**: Consider caching frequent queries
3. **Monitor API Usage**: Keep track of Hugging Face API usage
4. **Optimize Audio**: Use appropriate audio quality settings

## Future Enhancements

- **Real STT**: Integrate actual speech-to-speech services
- **More Models**: Add more Hugging Face models for variety
- **Caching**: Implement response caching
- **Analytics**: Add usage analytics
- **WebSocket**: Real-time communication
- **Multi-language**: Support for multiple languages

---

**Cruise AI Backend** - Powering intelligent voice conversations! 🚗🤖 