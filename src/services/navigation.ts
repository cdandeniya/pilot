import axios from 'axios';
import { Location, Route, Place } from '../types';

const GOOGLE_MAPS_API_KEY = 'AIzaSyC_7hSdv0LHeOEnldEbM5JFIRKpxL_LZMo';

const googleMapsApi = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api',
});

export const geocodeAddress = async (address: string): Promise<Location | null> => {
  try {
    const response = await googleMapsApi.get('/geocode/json', {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const results = response.data.results;
    if (results && results.length > 0) {
      const location = results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const getDirections = async (origin: Location, destination: Location): Promise<Route | null> => {
  try {
    const response = await googleMapsApi.get('/directions/json', {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        key: GOOGLE_MAPS_API_KEY,
        mode: 'driving',
      },
    });

    const routes = response.data.routes;
    if (routes && routes.length > 0) {
      const route = routes[0];
      const leg = route.legs[0];
      
      return {
        origin,
        destination,
        distance: leg.distance?.text || '',
        duration: leg.duration?.text || '',
        steps: leg.steps?.map((step: any) => ({
          instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || step.maneuver?.instruction || '',
          distance: step.distance?.text || '',
          duration: step.duration?.text || '',
        })) || [],
      };
    }
    return null;
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
};

export const findNearbyPlaces = async (
  location: Location,
  type: string,
  radius: number = 5000
): Promise<Place[]> => {
  try {
    const response = await googleMapsApi.get('/place/nearbysearch/json', {
      params: {
        location: `${location.latitude},${location.longitude}`,
        radius,
        type,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const results = response.data.results;
    if (results) {
      return results.slice(0, 10).map((place: any) => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || 'Address not available',
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        rating: place.rating,
        priceLevel: place.price_level,
        types: place.types || [],
        distance: place.distance,
      }));
    }
    return [];
  } catch (error) {
    console.error('Places search error:', error);
    return [];
  }
};

export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * (Math.PI / 180);
  const dLng = (point2.longitude - point1.longitude) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.latitude * (Math.PI / 180)) *
      Math.cos(point2.latitude * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}; 