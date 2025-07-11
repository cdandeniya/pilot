# Cruise - iOS Navigation App

A professional voice-controlled navigation app for iOS, built with React Native and Expo. Cruise provides turn-by-turn navigation with AI-powered voice assistance, similar to Google Maps but with advanced conversational features.

## 🚀 Features

### Core Navigation
- **Turn-by-turn navigation** with Google Maps integration
- **Real-time location tracking** with GPS
- **Voice-controlled navigation** using OpenAI GPT-4
- **Professional UI** with Google Maps-style interface
- **Route optimization** and traffic-aware routing

### Voice Assistant
- **Natural language processing** for navigation commands
- **Voice-to-text** for hands-free operation
- **Text-to-speech** for turn-by-turn instructions
- **AI-powered responses** to navigation questions
- **Context-aware** voice commands

### Advanced Features
- **Quick action buttons** for common destinations (food, gas, parking, medical)
- **Nearby places search** with Google Places API
- **Route details** with step-by-step instructions
- **Voice command simulation** for demo purposes
- **Professional animations** and smooth transitions

## 📱 Screenshots

The app features a clean, professional interface with:
- Full-screen Google Maps integration
- Floating search bar with voice input
- Quick action buttons for common destinations
- Voice command button for hands-free operation
- Turn-by-turn navigation with voice guidance

## 🛠️ Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Google Maps API** for navigation and places
- **OpenAI GPT-4** for voice processing
- **React Navigation** for screen management
- **React Native Paper** for UI components
- **Expo Location** for GPS tracking
- **Expo Speech** for text-to-speech
- **Expo Linear Gradient** for visual effects

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Xcode 14+ (for iOS development)
- iOS Simulator or physical iOS device
- Expo CLI (`npm install -g @expo/cli`)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cruise-ios
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   
   Update the API keys in the following files:
   - `src/services/openai.ts` - OpenAI API key
   - `src/services/navigation.ts` - Google Maps API key
   - `app.json` - Google Maps API key for iOS

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on iOS Simulator**
   ```bash
   npm run ios
   ```

## 🎯 Usage

### Voice Commands

The app supports natural language voice commands:

- **"Navigate to Times Square"** - Start navigation to a destination
- **"Find nearby gas stations"** - Search for nearby places
- **"What's my ETA?"** - Get route information
- **"Find the closest restaurant"** - Search for specific place types

### Manual Navigation

1. **Search for destination** using the search bar
2. **Use quick action buttons** for common destinations
3. **Tap "Start Navigation"** to begin turn-by-turn guidance
4. **Use voice button** for hands-free operation

### Navigation Screen

- **Current step display** with voice guidance
- **Step navigation** with previous/next buttons
- **Route details** with full turn-by-turn list
- **Voice commands** for route information

## 🔧 Configuration

### API Keys Setup

1. **OpenAI API Key**
   - Get your API key from [OpenAI Platform](https://platform.openai.com/)
   - Update `src/services/openai.ts`

2. **Google Maps API Key**
   - Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API, Directions API, and Places API
   - Update `src/services/navigation.ts` and `app.json`

### iOS Permissions

The app requires the following permissions:
- **Location Services** - For GPS navigation
- **Microphone** - For voice commands
- **Camera** - For potential AR features

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Main app screens
│   ├── HomeScreen.tsx  # Main map interface
│   └── NavigationScreen.tsx # Turn-by-turn navigation
├── services/           # API and business logic
│   ├── openai.ts      # OpenAI integration
│   ├── navigation.ts  # Google Maps integration
│   └── voice.ts       # Voice processing
├── types/             # TypeScript type definitions
└── theme/             # App theming and styling
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📦 Building for Production

### iOS App Store

1. **Configure EAS Build**
   ```bash
   npx eas build:configure
   ```

2. **Build for iOS**
   ```bash
   npx eas build --platform ios
   ```

3. **Submit to App Store**
   ```bash
   npx eas submit --platform ios
   ```

### Development Build

For testing on physical devices:
```bash
npx expo run:ios
```

## 🎨 Customization

### Theme Colors

Update `src/theme/index.ts` to customize:
- Primary colors
- Typography
- Component styling

### Voice Commands

Modify `src/services/voice.ts` to add:
- New command types
- Custom voice responses
- Additional AI features

### UI Components

Customize components in `src/components/` for:
- Different map styles
- Custom UI elements
- Brand-specific styling

## 🚨 Troubleshooting

### Common Issues

1. **Maps not loading**
   - Check Google Maps API key configuration
   - Verify API quotas and billing

2. **Voice commands not working**
   - Check OpenAI API key
   - Verify microphone permissions

3. **Location not updating**
   - Check location permissions
   - Verify GPS is enabled

4. **Build errors**
   - Clear Metro cache: `npx expo start --clear`
   - Reset iOS Simulator
   - Check Expo SDK version compatibility

### Debug Mode

Enable debug logging:
```bash
npx expo start --dev-client
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review Expo documentation
- Open an issue on GitHub

---

**Cruise** - Your AI-powered navigation companion for iOS.
