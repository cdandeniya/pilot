# MapAI — Your Conversational Copilot

MapAI is a voice-first routing companion that fuses turn-by-turn navigation with a GPT-powered conversational layer. This MVP demonstrates the core functionality of hands-free navigation with voice interaction.

## 🚀 Features (MVP)

- **Live Mapbox Integration**: Real-time map display with user location tracking
- **Wake Word Detection**: "Hey MapAI" triggers voice recording
- **Speech-to-Text**: OpenAI-powered transcription of voice commands
- **Safety Guardrails**: Monitors speed and screen interactions for safety warnings
- **Cross-Platform**: Works on both iOS and Android

## 📱 Screenshots

*Coming soon - screenshots will be added after first run*

## 🛠 Tech Stack

- **React Native + Expo**: Cross-platform development
- **Mapbox**: Navigation and mapping SDK
- **OpenAI**: Speech-to-text transcription
- **Expo Location**: GPS and speed monitoring
- **TypeScript**: Type-safe development
- **Jest + React Native Testing Library**: Unit testing

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd mapai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```bash
   MAPBOX_TOKEN=your_mapbox_token_here
   OPENAI_KEY=your_openai_key_here
   ```

   **Get your API keys:**
   - [Mapbox Access Token](https://account.mapbox.com/access-tokens/)
   - [OpenAI API Key](https://platform.openai.com/api-keys)

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on your preferred platform:**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web (for testing)
   npm run web
   ```

## 🎯 How to Use

1. **Launch the app** and grant location and microphone permissions
2. **Say "Hey MapAI"** to activate voice recording
3. **Speak your command** (e.g., "Find coffee near me")
4. **View the transcription** on screen
5. **Safety warnings** will appear if you touch the screen while driving

## 🏗 Project Structure

```
mapai/
├── src/
│   ├── components/
│   │   ├── MapScreen.tsx      # Main map component
│   │   ├── WakeWordDetector.tsx # Wake word detection
│   │   └── SafetyGuard.tsx    # Speed monitoring
│   └── hooks/
│       └── useVoiceHook.ts    # Voice recording logic
├── App.tsx                    # Main app component
├── app.json                   # Expo configuration
└── package.json               # Dependencies
```

## 🔧 Configuration

### Environment Variables

The app uses the following environment variables:

- `EXPO_PUBLIC_MAPBOX_TOKEN`: Your Mapbox access token
- `EXPO_PUBLIC_OPENAI_KEY`: Your OpenAI API key

### Permissions

The app requires the following permissions:

- **Location**: For GPS tracking and speed monitoring
- **Microphone**: For voice commands and wake word detection

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 🚧 Development Status

### ✅ Completed (MVP)
- [x] Project bootstrap with React Native + Expo
- [x] Mapbox integration with live location tracking
- [x] Wake word detection ("Hey MapAI")
- [x] Voice recording and transcription
- [x] Safety guardrails for speed monitoring
- [x] Cross-platform compatibility

### 🔄 In Progress
- [ ] Navigation routing
- [ ] Fuel price API integration
- [ ] GPT-powered Q&A responses
- [ ] Enhanced wake word detection

### 📋 Planned (Post-MVP)
- [ ] Turn-by-turn navigation
- [ ] Real-time traffic updates
- [ ] Music control integration
- [ ] CarPlay/Android Auto support
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Mapbox not loading:**
- Ensure your `MAPBOX_TOKEN` is correctly set in `.env`
- Check that the token has the necessary permissions

**Voice recording not working:**
- Verify microphone permissions are granted
- Check that `OPENAI_KEY` is set correctly

**Location not updating:**
- Ensure location permissions are granted
- Check device GPS settings

**Build errors:**
- Clear cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 📞 Support

For support, email support@mapai.com or create an issue in this repository.

---

**MapAI** - Your conversational copilot for safer, smarter driving. 🚗💬 