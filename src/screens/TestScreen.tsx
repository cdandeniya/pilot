import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from '../theme';
import TestComponent from '../components/TestComponent';
import VoiceButton from '../components/VoiceButton';

export default function TestScreen() {
  const [isListening, setIsListening] = React.useState(false);

  const handleVoicePress = () => {
    setIsListening(!isListening);
  };

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.container}>
        <TestComponent />
        <View style={styles.buttonContainer}>
          <VoiceButton
            isListening={isListening}
            onPress={handleVoicePress}
          />
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    right: 20,
  },
}); 