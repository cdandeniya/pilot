# AI Testing Guide for Cruise App

Since GPT-4 can be expensive for testing, here are the best alternatives to test your AI features without breaking the bank:

## 🆓 **FREE Options (Recommended for Testing)**

### 1. **Mock AI (Default)**
- **Cost**: FREE
- **Setup**: No setup required
- **Status**: ✅ Already implemented
- **How to use**: Just run the app - it's the default mode
- **Features**: Smart pattern matching, realistic responses, full functionality

### 2. **Ollama (Local AI)**
- **Cost**: FREE
- **Setup**: Install Ollama locally
- **Models**: Llama2, Mistral, CodeLlama, etc.
- **How to setup**:
  ```bash
  # Install Ollama
  curl -fsSL https://ollama.ai/install.sh | sh
  
  # Pull a model (choose one)
  ollama pull llama2
  ollama pull mistral
  ollama pull codellama
  
  # Start Ollama
  ollama serve
  ```
- **Features**: Full AI capabilities, runs locally, no API costs

### 3. **Hugging Face (Free API)**
- **Cost**: FREE (with rate limits)
- **Setup**: Get API key from Hugging Face
- **Models**: DialoGPT, GPT-2, BERT, etc.
- **How to setup**:
  1. Go to [Hugging Face](https://huggingface.co/)
  2. Create account and get API key
  3. Add key to app settings
- **Features**: Real AI responses, good for testing

## 💰 **Low-Cost Options**

### 4. **Anthropic Claude**
- **Cost**: $0.15/1M tokens (much cheaper than GPT-4)
- **Setup**: Get API key from Anthropic
- **Features**: Very capable, often better than GPT-3.5

### 5. **OpenAI GPT-3.5**
- **Cost**: $0.002/1K tokens (very cheap)
- **Setup**: Get API key from OpenAI
- **Features**: Good balance of cost and capability

## 🚀 **Quick Start for Testing**

### Option 1: Use Mock AI (Easiest)
1. Run the app as-is
2. The mock AI will provide realistic responses
3. Test all voice features without any setup

### Option 2: Use Ollama (Best Free Option)
1. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
2. Pull a model: `ollama pull llama2`
3. Start Ollama: `ollama serve`
4. In the app settings, change AI provider to "Ollama"
5. Test with real AI responses

### Option 3: Use Hugging Face (Free API)
1. Go to [Hugging Face](https://huggingface.co/)
2. Create account and get API key
3. In app settings, add the API key
4. Change AI provider to "Hugging Face"

## 🧪 **Testing Scenarios**

### Voice Commands to Test:
- **"Navigate to downtown"** - Should start navigation
- **"Find coffee shops near me"** - Should search for places
- **"How's the traffic looking?"** - Should give traffic analysis
- **"I prefer scenic routes"** - Should learn preference
- **"Take me to the nearest gas station"** - Should find and navigate

### Expected Responses:
- **Mock AI**: Pattern-based responses with suggestions
- **Ollama**: Real AI responses with context awareness
- **Hugging Face**: AI-generated responses (may be slower)
- **Claude/GPT-3.5**: High-quality, fast responses

## 🔧 **Configuration**

### In the App:
1. Go to Settings
2. Tap "AI Provider"
3. Select your preferred provider
4. Add API key if needed
5. Test voice features

### Environment Variables:
```bash
# For OpenAI
OPENAI_API_KEY=your_key_here

# For Hugging Face
HUGGINGFACE_API_KEY=your_key_here

# For Anthropic
ANTHROPIC_API_KEY=your_key_here
```

## 📊 **Cost Comparison**

| Provider | Cost | Setup | Quality | Speed |
|----------|------|-------|---------|-------|
| Mock AI | FREE | None | Good | Instant |
| Ollama | FREE | Local | Very Good | Fast |
| Hugging Face | FREE | API Key | Good | Medium |
| Claude | $0.15/1M | API Key | Excellent | Fast |
| GPT-3.5 | $0.002/1K | API Key | Very Good | Fast |
| GPT-4 | $0.03/1K | API Key | Best | Fast |

## 🎯 **Recommendations**

### For Development/Testing:
1. **Start with Mock AI** - No setup, works immediately
2. **Move to Ollama** - Free, local, very capable
3. **Use Hugging Face** - Free API for cloud-based testing

### For Production:
1. **Claude** - Best value for money
2. **GPT-3.5** - Good balance of cost/quality
3. **GPT-4** - Best quality (if budget allows)

## 🔍 **Testing Checklist**

- [ ] Voice recognition works
- [ ] AI responses are appropriate
- [ ] Navigation requests are processed
- [ ] Search requests work
- [ ] Preferences are learned
- [ ] Suggestions are relevant
- [ ] Conversation history is saved
- [ ] Settings can change AI provider

## 🐛 **Troubleshooting**

### Mock AI Issues:
- Check console logs for errors
- Verify voice input is being received

### Ollama Issues:
- Ensure Ollama is running: `ollama serve`
- Check if model is downloaded: `ollama list`
- Verify localhost:11434 is accessible

### API Issues:
- Check API key is valid
- Verify network connectivity
- Check rate limits (especially Hugging Face)

## 💡 **Tips**

1. **Start with Mock AI** - It's surprisingly good for testing
2. **Use Ollama for serious testing** - Free and very capable
3. **Save API costs** - Only use paid services for final testing
4. **Test voice patterns** - Different AI providers handle voice differently
5. **Monitor costs** - Set up billing alerts if using paid APIs

---

**Happy Testing! 🚗💬**
