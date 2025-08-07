# Cruise - AI-Powered Voice-First Navigation

Cruise is an AI-powered, voice-first navigation app designed to make driving more intuitive, conversational, and personalized. Unlike traditional navigation apps that rely heavily on static menus and minimal interaction, Cruise acts like a smart copilot — one that you can talk to naturally, ask questions, and get helpful, real-time answers tailored to your needs.

## 🚀 Key Features

### 🤖 AI-Powered Voice Assistant
- **Conversational AI**: Natural language processing for voice commands
- **Context Awareness**: Remembers your preferences and past interactions
- **Smart Responses**: Provides contextual suggestions and route alternatives
- **OpenAI Integration**: Powered by GPT-4 for sophisticated conversations

### 🗣️ Voice-First Interaction
- **Natural Voice Commands**: "Navigate to downtown", "Find coffee shops", "How's the traffic?"
- **Voice Synthesis**: AI voice responses optimized for driving
- **Hands-Free Operation**: Complete navigation control through voice
- **Driving Mode**: Optimized responses for safe driving

### 🧠 Smart Learning & Preferences
- **User Preference Learning**: Remembers your route preferences, favorite destinations
- **Adaptive Suggestions**: Proactively suggests stops, alternative routes
- **Personalized Experience**: Learns from your driving patterns
- **Smart Preferences Management**: Easy-to-use interface for managing AI-learned preferences

### 🗺️ Enhanced Navigation
- **Turn-by-Turn Navigation**: Real-time voice guidance
- **Traffic Analysis**: AI-powered traffic insights and ETA updates
- **Route Optimization**: Considers your preferences for route selection
- **Smart Stops**: Suggests coffee breaks, gas stations, rest stops on long drives

### 💬 Conversation History
- **Interactive Chat Interface**: View and manage your conversations with Cruise
- **Quick Actions**: Tap on suggestions to execute actions
- **Route Suggestions**: AI-generated route alternatives with explanations
- **Contextual Insights**: Learn from your navigation patterns

## 🏗️ Architecture

### Core Services
- **VoiceAssistant**: Handles voice recognition, speech synthesis, and conversation management
- **AIService**: OpenAI integration for intelligent responses and route suggestions
- **SmartPreferences**: Manages user preferences and learning algorithms

### Key Components
- **HomeScreen**: Main navigation interface with voice controls
- **NavigationScreen**: Turn-by-turn navigation with AI assistance
- **SettingsScreen**: AI configuration and voice preferences
- **ConversationHistory**: Interactive chat interface
- **SmartPreferences**: Preference management interface

## 🛠️ Technical Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development framework and tools
- **TypeScript**: Type-safe development
- **OpenAI API**: GPT-4 integration for AI conversations
- **React Navigation**: Screen navigation
- **Expo Speech**: Voice synthesis and recognition
- **React Native Maps**: Google Maps integration
- **AsyncStorage**: Local data persistence

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or physical device
- OpenAI API key (optional, for enhanced AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cruise-ios
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Copy `env.example` to `.env`
   - Add your Google Maps API key
   - Add your OpenAI API key (optional)

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on iOS**
   ```bash
   npm run ios
   ```

### Configuration

#### OpenAI API Setup (Optional)
1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Open the app and go to Settings
3. Tap "Configure OpenAI API Key"
4. Enter your API key
5. Enable AI Assistant in settings

#### Google Maps API Setup
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add the key to your environment variables
3. Enable the following APIs:
   - Maps SDK for iOS
   - Places API
   - Directions API

## 🎯 Usage Examples

### Voice Commands
- **"Navigate to San Francisco"** - Start navigation to destination
- **"Find coffee shops near me"** - Search for nearby places
- **"How's the traffic looking?"** - Get traffic analysis
- **"I prefer scenic routes"** - Set route preferences
- **"Take me to the nearest gas station"** - Find and navigate to nearby services

### AI Conversations
- **"Will there be traffic when I get close?"** - Get predictive traffic analysis
- **"Where's the nearest clean rest stop?"** - Find specific types of places
- **"Let's go to Mom's"** - Navigate to saved favorite locations
- **"Suggest a coffee break"** - Get proactive suggestions for long drives

## 🔧 Advanced Features

### Smart Preferences
- **Route Preferences**: Avoid highways, prefer scenic routes
- **Voice Settings**: Adjust speech rate and style
- **Driving Mode**: Optimize responses for safe driving
- **Auto Suggestions**: Enable proactive route and stop suggestions

### Conversation Management
- **History View**: Browse past conversations with Cruise
- **Quick Actions**: Execute suggestions with one tap
- **Route Alternatives**: AI-generated route suggestions
- **Contextual Insights**: Learn from your navigation patterns

### AI Learning
- **Preference Learning**: Cruise learns from your choices
- **Pattern Recognition**: Identifies common destinations and routes
- **Adaptive Suggestions**: Tailors recommendations to your preferences
- **Continuous Improvement**: Gets smarter with each interaction

## 🎨 UI/UX Features

### Modern Design
- **Glassmorphism**: Modern glass-like UI elements
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Dark Mode Support**: Optimized for all lighting conditions
- **Accessibility**: Voice-first design for hands-free operation

### Interactive Elements
- **Floating Action Buttons**: Quick access to key features
- **Voice Recognition Modal**: Real-time voice input interface
- **Conversation Cards**: Rich conversation history display
- **Preference Cards**: Visual preference management

## 🔒 Privacy & Security

- **Local Storage**: User preferences stored locally
- **Secure API Keys**: Encrypted storage of API credentials
- **Conversation Privacy**: Optional conversation history clearing
- **Data Minimization**: Only necessary data is collected

## 🚧 Development Status

### ✅ Completed Features
- [x] Voice recognition and synthesis
- [x] AI-powered conversation system
- [x] Smart preferences management
- [x] Conversation history interface
- [x] Turn-by-turn navigation
- [x] Settings and configuration
- [x] Modern UI/UX design

### 🔄 In Progress
- [ ] Real-time traffic integration
- [ ] Advanced route optimization
- [ ] Multi-language support
- [ ] Offline mode capabilities

### 📋 Planned Features
- [ ] CarPlay integration
- [ ] Siri shortcuts
- [ ] Advanced analytics
- [ ] Social features (share routes)
- [ ] Weather-aware routing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 integration
- Google Maps for navigation services
- Expo team for the development framework
- React Native community for the mobile framework

---

**Cruise** - Making every drive smarter, safer, and more conversational. 🚗💬 