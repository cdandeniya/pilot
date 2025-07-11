export interface Location {
  latitude: number;
  longitude: number;
}

export interface Route {
  origin: Location;
  destination: Location;
  distance: string;
  duration: string;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  location: Location;
  rating?: number;
  priceLevel?: number;
  types: string[];
  distance?: number;
}

export interface VoiceCommand {
  type: 'navigate' | 'find' | 'question' | 'general';
  query: string;
  parameters?: any;
}

export interface NavigationState {
  currentLocation: Location | null;
  route: Route | null;
  places: Place[];
  isListening: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
}

export type ScreenProps = {
  navigation: any;
  route: any;
}; 