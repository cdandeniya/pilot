import { Loader } from '@googlemaps/js-api-loader'

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!

// Initialize the Google Maps loader
export const mapsLoader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places', 'geometry'],
})

// Map configuration
export const mapConfig = {
  zoom: 15,
  mapTypeId: google?.maps?.MapTypeId?.ROADMAP || 'roadmap',
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
}

// Initialize map with default configuration
export const initializeMap = async (
  element: HTMLElement,
  center: google.maps.LatLngLiteral = { lat: 37.7749, lng: -122.4194 }
): Promise<google.maps.Map> => {
  await mapsLoader.load()
  
  return new google.maps.Map(element, {
    ...mapConfig,
    center,
  })
}

// Get current location
export const getCurrentLocation = (): Promise<google.maps.LatLngLiteral> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}

// Geocoding service
export const geocodeAddress = async (address: string): Promise<google.maps.LatLngLiteral | null> => {
  await mapsLoader.load()
  
  const geocoder = new google.maps.Geocoder()
  
  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location
        resolve({ lat: location.lat(), lng: location.lng() })
      } else {
        resolve(null)
      }
    })
  })
}

// Directions service - Car routes only
export const getDirections = async (
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  waypoints: google.maps.LatLngLiteral[] = []
): Promise<google.maps.DirectionsResult | null> => {
  await mapsLoader.load()
  
  const directionsService = new google.maps.DirectionsService()
  
  return new Promise((resolve) => {
    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypoints.length > 0 ? waypoints.map(wp => ({ location: wp })) : undefined,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS,
        },
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          resolve(result)
        } else {
          resolve(null)
        }
      }
    )
  })
}

// Places service for finding nearby amenities
export const findNearbyPlaces = async (
  location: google.maps.LatLngLiteral,
  type: string,
  radius: number = 5000
): Promise<google.maps.places.PlaceResult[]> => {
  await mapsLoader.load()
  
  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div') // Dummy div for PlacesService
    )
    
    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius,
      type,
    }
    
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results)
      } else {
        resolve([])
      }
    })
  })
}

// Calculate distance between two points
export const calculateDistance = (
  point1: google.maps.LatLngLiteral,
  point2: google.maps.LatLngLiteral
): number => {
  const lat1 = point1.lat
  const lng1 = point1.lng
  const lat2 = point2.lat
  const lng2 = point2.lng
  
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
} 