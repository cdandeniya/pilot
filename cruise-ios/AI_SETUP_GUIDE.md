# 🤖 Cruise AI - Unique AI Responses Setup Guide

This guide will help you set up Cruise AI to generate unique, conversational responses like ChatGPT Voice using Hugging Face's free AI models.

## 🎯 What You'll Get

With this setup, Cruise AI will:
- ✅ Generate **unique responses** every time (not repetitive)
- ✅ **Remember conversation context** across multiple interactions
- ✅ Provide **context-aware responses** based on your location
- ✅ Use **multiple AI models** for variety
- ✅ **Fall back gracefully** if API is unavailable
- ✅ **Track conversation history** for better context

## 🚀 Quick Setup

### 1. Get Hugging Face API Key

1. **Sign up for Hugging Face**:
   - Go to [huggingface.co](https://huggingface.co)
   - Click "Sign Up" and create a free account

2. **Get your API key**:
   - Go to your profile (top right)
   - Click "Settings"
   - Navigate to "Access Tokens"
   - Click "New token"
   - Give it a name like "Cruise AI"
   - Select "Read" permissions
   - Click "Generate token"
   - Copy the token (starts with `hf_...`)

### 2. Configure the Backend

```bash
cd backend
npm run setup
```

Follow the prompts to enter your Hugging Face API key.

### 3. Start the Services

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - iOS App
cd cruise-ios
npx expo run:ios
```

## 🔧 Manual Setup

If you prefer manual setup:

1. **Create `.env` file in backend directory**:
   ```env
   HUGGING_FACE_API_KEY=hf_your_token_here
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   PORT=3001
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

## 🧠 How It Works

### AI Models Used
Cruise AI rotates between these free Hugging Face models:

- **microsoft/DialoGPT-medium**: Best for conversational responses
- **gpt2**: More creative and varied responses  
- **EleutherAI/gpt-neo-125M**: Helpful assistant style
- **distilgpt2**: Fast fallback model

### Conversation Memory
- Each user gets a **unique session ID**
- **Conversation history** is maintained per session
- **Context is preserved** across multiple interactions
- **Recent messages** are included in AI prompts

### Context-Aware Responses
The AI considers:
- Your **current location**
- **Nearby places** (restaurants, gas stations, etc.)
- **Previous conversation** context
- **Query type** (food, navigation, area info, etc.)

## 🎤 Testing the Setup

### Voice Commands to Try

1. **Greeting**: "Hello" or "Hi"
2. **Food**: "I'm hungry" or "Find restaurants"
3. **Gas**: "Find gas station" or "I need fuel"
4. **Coffee**: "Find coffee shop" or "I need coffee"
5. **Area Info**: "What's around here?" or "Tell me about this area"
6. **Navigation**: "I need directions" or "Navigate to..."

### Expected Behavior

**With Hugging Face API**:
- ✅ **Unique responses** each time
- ✅ **Conversation memory** (remembers previous interactions)
- ✅ **Context-aware** (mentions nearby places)
- ✅ **Natural flow** (builds on previous messages)

**Without API Key**:
- ✅ **Enhanced predefined responses**
- ✅ **Location-aware** responses
- ✅ **Graceful fallback**

## 🔍 Troubleshooting

### Common Issues

**"No unique responses"**
- Check your Hugging Face API key is correct
- Ensure the key starts with `hf_`
- Verify the key has "read" permissions

**"Slow responses"**
- Hugging Face free tier has rate limits
- First request may be slower (model loading)
- Consider upgrading to paid tier for faster responses

**"API errors"**
- Check your internet connection
- Verify the API key is valid
- Try again in a few minutes (rate limiting)

**"Fallback responses"**
- This is normal when API is unavailable
- Check the backend logs for specific errors
- Ensure your API key is properly configured

### Debug Mode

Enable debug mode to see what's happening:

```bash
# In backend directory
TEST_MODE=true npm start
```

## 📊 Monitoring Usage

### Hugging Face Usage
- Free tier: 30,000 requests/month
- Check usage at: https://huggingface.co/settings/tokens
- Monitor rate limits in backend logs

### Performance Tips
1. **Use session IDs**: Always send session IDs for better tracking
2. **Keep conversations focused**: Shorter queries work better
3. **Monitor logs**: Check backend console for errors
4. **Cache responses**: Consider caching for frequently asked questions

## 🚀 Advanced Configuration

### Custom Models
You can modify the AI models in `backend/src/index.js`:

```javascript
const AI_MODELS = {
  quick: 'microsoft/DialoGPT-medium',
  creative: 'gpt2',
  helpful: 'EleutherAI/gpt-neo-125M',
  // Add your own models here
  custom: 'your-model-name',
};
```

### Response Parameters
Adjust response generation parameters:

```javascript
parameters: {
  max_length: 150,    // Response length
  temperature: 0.8,   // Creativity (0.0-1.0)
  top_p: 0.9,        // Diversity
  do_sample: true,    // Enable sampling
}
```

### Conversation History
Modify conversation memory settings:

```javascript
// Keep only last 10 messages
if (history.length > 10) {
  history.shift();
}
```

## 🎯 Expected Results

### Before Setup
- Repetitive responses
- No conversation memory
- Basic location awareness

### After Setup
- ✅ **Unique responses** every time
- ✅ **Conversation context** maintained
- ✅ **Location-aware** responses
- ✅ **Natural conversation flow**
- ✅ **Multiple AI personalities**

## 🔄 Updating

To update your API key or configuration:

1. **Update API key**:
   ```bash
   cd backend
   npm run setup
   ```

2. **Manual update**:
   Edit the `.env` file in the backend directory

3. **Restart services**:
   ```bash
   # Restart backend
   cd backend
   npm start
   ```

## 🆘 Support

If you encounter issues:

1. **Check the logs**: Look at backend console output
2. **Verify API key**: Ensure it's correctly formatted
3. **Test connectivity**: Try accessing Hugging Face website
4. **Check rate limits**: Monitor your API usage
5. **Fallback mode**: App will work with enhanced responses

## 🎉 Success!

Once configured, you'll have:
- **Unique AI responses** like ChatGPT Voice
- **Conversation memory** across interactions
- **Context-aware** responses
- **Multiple AI personalities**
- **Graceful fallback** when needed

Your Cruise AI will now feel like a real conversational co-pilot! 🚗🤖

---

**Need help?** Check the backend logs or refer to the troubleshooting section above. 