import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NavigationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigation Screen</Text>
      <Text style={styles.subtitle}>Turn-by-turn navigation UI coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
}); 