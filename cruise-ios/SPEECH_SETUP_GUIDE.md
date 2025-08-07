# 🎤 Cruise AI - Real Speech-to-Text Setup Guide

This guide will help you set up Cruise AI to actually understand what you're saying instead of using simulated responses.

## 🎯 The Problem

Currently, Cruise AI uses a **simulated speech-to-text system** that:
- ❌ Doesn't actually understand your voice
- ❌ Generates random responses based on audio file size
- ❌ Doesn't respond to what you're actually saying
- ❌ Feels disconnected and unrealistic

## 🚀 The Solution

We'll implement **real speech-to-text** using AssemblyAI's free service that:
- ✅ Actually transcribes your voice
- ✅ Understands what you're saying
- ✅ Responds to your specific requests
- ✅ Feels like a real AI assistant

## 🔧 Quick Setup

### 1. Get AssemblyAI API Key

1. **Sign up for AssemblyAI**:
   - Go to [assemblyai.com](https://assemblyai.com)
   - Click "Get Started" and create a free account

2. **Get your API key**:
   - Go to your dashboard
   - Copy your API key (it's a long string)
   - Keep it handy for the next step

### 2. Configure the Backend

```bash
cd backend
npm run setup-stt
```

Follow the prompts to enter your AssemblyAI API key.

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
   ASSEMBLYAI_API_KEY=your_assemblyai_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   HUGGING_FACE_API_KEY=your_hugging_face_key
   PORT=3001
   ```

2. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

## 🧠 How It Works

### Real Speech-to-Text Flow
1. **You speak** → Audio recorded by iOS app
2. **Audio sent** → Backend receives audio file
3. **AssemblyAI processes** → Real transcription of your speech
4. **AI responds** → Context-aware response based on what you actually said
5. **Voice feedback** → AI speaks the response back to you

### AssemblyAI Features
- **High accuracy**: 95%+ transcription accuracy
- **Real-time**: Fast processing
- **Free tier**: 5 hours of transcription per month
- **Multiple languages**: Supports many languages
- **Noise handling**: Works in various environments

## 🎤 Testing Real Speech Recognition

### Voice Commands to Try

**With Real STT** (after setup):
- "I'm hungry" → AI finds restaurants
- "Find gas station" → AI locates fuel stations
- "Coffee nearby" → AI finds cafes
- "What's around here?" → AI describes the area
- "Navigate to McDonald's" → AI provides directions

**Before Setup** (simulated):
- Random responses based on audio length
- No actual understanding of your words
- Disconnected responses

### Expected Behavior

**With AssemblyAI**:
- ✅ **Real transcription** of your speech
- ✅ **Accurate understanding** of your requests
- ✅ **Context-aware responses** based on what you said
- ✅ **Natural conversation** flow

**Without API Key**:
- ✅ **Simulated responses** based on audio patterns
- ✅ **Fallback system** still works
- ✅ **Enhanced responses** available

## 🔍 Troubleshooting

### Common Issues

**"Still getting random responses"**
- Check your AssemblyAI API key is correct
- Ensure the key is properly added to `.env` file
- Restart the backend server
- Check backend logs for API errors

**"API errors"**
- Verify your AssemblyAI account is active
- Check your free tier usage (5 hours/month)
- Ensure internet connection is stable
- Try again in a few minutes

**"Slow responses"**
- AssemblyAI processing takes 1-3 seconds
- First request may be slower (model loading)
- Check your internet connection speed

**"No transcription"**
- Speak clearly and at normal volume
- Ensure microphone permissions are granted
- Check that audio is being recorded properly
- Try shorter, clearer commands

### Debug Mode

Enable debug mode to see what's happening:

```bash
# In backend directory
TEST_MODE=true npm start
```

## 📊 Monitoring Usage

### AssemblyAI Usage
- **Free tier**: 5 hours of transcription per month
- **Check usage**: assemblyai.com dashboard
- **Monitor logs**: Backend console shows API calls

### Performance Tips
1. **Speak clearly**: Enunciate your words
2. **Use simple commands**: "Find food" vs "I would like to locate dining establishments"
3. **Avoid background noise**: Find quiet environments
4. **Keep commands focused**: One request at a time

## 🚀 Advanced Configuration

### Custom Audio Settings
You can modify audio recording settings in the iOS app:

```javascript
// In HomeScreen.tsx
const { recording } = await Audio.Recording.createAsync(
  Audio.RecordingOptionsPresets.HIGH_QUALITY
);
```

### Alternative STT Services
If AssemblyAI doesn't work for you, you can try:

1. **Google Speech-to-Text**:
   ```javascript
   // Requires Google Cloud setup
   const speechResponse = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
     // Configuration
   });
   ```

2. **OpenAI Whisper**:
   ```javascript
   // Requires OpenAI API key
   const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
     // Configuration
   });
   ```

3. **Azure Speech Services**:
   ```javascript
   // Requires Azure subscription
   // More complex setup
   ```

## 🎯 Expected Results

### Before Setup
- Random responses based on audio file size
- No actual understanding of speech
- Disconnected user experience
- Frustrating interactions

### After Setup
- ✅ **Real speech understanding**
- ✅ **Accurate transcription**
- ✅ **Context-aware responses**
- ✅ **Natural conversation flow**
- ✅ **Professional AI experience**

## 🔄 Updating

To update your API key or configuration:

1. **Update API key**:
   ```bash
   cd backend
   npm run setup-stt
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
3. **Test connectivity**: Try accessing AssemblyAI website
4. **Check usage**: Monitor your free tier usage
5. **Fallback mode**: App will work with simulated responses

## 🎉 Success!

Once configured, you'll have:
- **Real speech recognition** like Siri or Alexa
- **Accurate transcription** of your voice
- **Context-aware responses** based on what you said
- **Natural conversation** flow
- **Professional AI experience**

Your Cruise AI will now actually understand what you're saying! 🎤🤖

---

**Need help?** Check the backend logs or refer to the troubleshooting section above. 