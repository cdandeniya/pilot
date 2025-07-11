import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { processVoiceCommand, generateResponse } from './openai';
import { geocodeAddress, getDirections, findNearbyPlaces } from './navigation';
import { VoiceCommand, Location as LocationType } from '../types';

export class VoiceService {
  private isListening = false;
  private isSpeaking = false;

  async speak(text: string): Promise<void> {
    if (this.isSpeaking) {
      await Speech.stop();
    }

    this.isSpeaking = true;
    
    try {
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: (error) => {
          console.error('Speech error:', error);
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.error('Speech error:', error);
      this.isSpeaking = false;
    }
  }

  async processVoiceInput(text: string, currentLocation?: LocationType): Promise<string> {
    try {
      const command = await processVoiceCommand(text, { currentLocation });
      
      switch (command.type) {
        case 'navigate':
          return await this.handleNavigation(command, currentLocation);
        
        case 'find':
          return await this.handleFindPlaces(command, currentLocation);
        
        case 'question':
          return await this.handleRouteQuestion(command, currentLocation);
        
        case 'general':
        default:
          return await generateResponse(text);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      return 'I\'m sorry, I couldn\'t process that request. Please try again.';
    }
  }

  private async handleNavigation(command: VoiceCommand, currentLocation?: LocationType): Promise<string> {
    if (!currentLocation) {
      return 'I need your current location to provide navigation. Please enable location services.';
    }

    const destination = command.parameters?.destination;
    if (!destination) {
      return 'I didn\'t catch the destination. Could you please specify where you want to go?';
    }

    try {
      const destinationLocation = await geocodeAddress(destination);
      if (!destinationLocation) {
        return `I couldn't find "${destination}". Please try a different address or place name.`;
      }

      const route = await getDirections(currentLocation, destinationLocation);
      if (!route) {
        return 'I couldn\'t find a route to that destination. Please try a different location.';
      }

      return `Route found! It's ${route.distance} and will take ${route.duration}. ${route.steps[0]?.instruction || 'Follow the route on your map.'}`;
    } catch (error) {
      console.error('Navigation error:', error);
      return 'I encountered an error while finding the route. Please try again.';
    }
  }

  private async handleFindPlaces(command: VoiceCommand, currentLocation?: LocationType): Promise<string> {
    if (!currentLocation) {
      return 'I need your current location to find nearby places. Please enable location services.';
    }

    const category = command.parameters?.category;
    if (!category) {
      return 'What type of place would you like me to find? For example, gas stations, restaurants, or coffee shops.';
    }

    try {
      const places = await findNearbyPlaces(currentLocation, category);
      if (places.length === 0) {
        return `I couldn't find any ${category} nearby. Try searching for a different category.`;
      }

      const nearest = places[0];
      return `I found ${places.length} ${category} nearby. The closest is ${nearest.name} at ${nearest.address}.`;
    } catch (error) {
      console.error('Places search error:', error);
      return 'I encountered an error while searching for places. Please try again.';
    }
  }

  private async handleRouteQuestion(command: VoiceCommand, currentLocation?: LocationType): Promise<string> {
    const question = command.parameters?.question;
    if (!question) {
      return 'What would you like to know about your route?';
    }

    // For now, provide a generic response. In a full implementation,
    // this would analyze the current route and provide specific answers
    return await generateResponse(question);
  }

  stopSpeaking(): void {
    if (this.isSpeaking) {
      Speech.stop();
      this.isSpeaking = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
} 