'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapCanvas } from '@/components/MapCanvas'
import { VoiceButton } from '@/components/VoiceButton'
import { VoiceIndicator } from '@/components/VoiceIndicator'
import { PitStopCard } from '@/components/PitStopCard'
import { Toast } from '@/components/Toast'
import { VoiceController, VoiceState } from '@/lib/speech'
import { processVoiceCommand, generateRouteResponse, generateGeneralResponse } from '@/lib/openai'
import { getCurrentLocation, geocodeAddress, getDirections, findNearbyPlaces } from '@/lib/googleMaps'

// Types
interface Location {
  lat: number
  lng: number
}

interface RouteData {
  origin: Location
  destination: Location
  directions: any
  distance: string
  duration: string
}

interface PitStop {
  id: string
  name: string
  address: string
  rating?: number
  priceLevel?: number
  distance?: number // Make optional
  type: string
}

// Toast types
type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

export default function NavigationPage() {
  // State
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [pitStops, setPitStops] = useState<PitStop[]>([])
  const [voiceState, setVoiceState] = useState<VoiceState>(VoiceState.IDLE)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [permissionsGranted, setPermissionsGranted] = useState(false)

  // Refs
  const voiceController = useRef<VoiceController | null>(null)
  const mapRef = useRef<any>(null)

  // Initialize voice controller
  useEffect(() => {
    voiceController.current = new VoiceController()
    
    // Request permissions on mount
    requestPermissions()
    
    return () => {
      voiceController.current?.stop()
    }
  }, [])

  // Request microphone and location permissions
  const requestPermissions = async () => {
    try {
      // Request microphone permission
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      
      // Request location permission
      const locationPermission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      
      if (micPermission.state === 'granted' && locationPermission.state === 'granted') {
        setPermissionsGranted(true)
        await getCurrentLocationAndSet()
      } else {
        showToast('Please grant microphone and location permissions to use voice navigation', 'info')
      }
    } catch (error) {
      console.error('Permission request failed:', error)
      showToast('Permission request failed. Please enable microphone and location access.', 'error')
    }
  }

  // Get current location and set it
  const getCurrentLocationAndSet = async () => {
    try {
      setIsLoading(true)
      const location = await getCurrentLocation()
      setCurrentLocation(location)
      showToast('Location detected successfully', 'success')
    } catch (error) {
      console.error('Failed to get location:', error)
      showToast('Failed to get your location. Please check location permissions.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle voice commands
  const handleVoiceCommand = async (command: string) => {
    if (!currentLocation) {
      showToast('Please allow location access first', 'error')
      return
    }

    try {
      setIsLoading(true)
      
      // Process command with GPT-4o function calling
      const result = await processVoiceCommand(command, {
        currentLocation,
        currentRoute: routeData,
        tripStatus: routeData ? 'active' : 'none',
      })

      // Handle different function calls
      switch (result.functionName) {
        case 'navigateTo':
          await handleNavigation(result.parameters.destination)
          break
          
        case 'findPitStop':
          await handleFindPitStop(result.parameters.category, result.parameters.preference)
          break
          
        case 'questionOnRoute':
          await handleRouteQuestion(result.parameters.question)
          break
          
        case 'generalQuestion':
          await handleGeneralQuestion(result.parameters.question)
          break
          
        default:
          showToast('I heard you, but I\'m not sure what you need. Could you try again?', 'info')
      }
    } catch (error) {
      console.error('Voice command processing failed:', error)
      showToast('Sorry, I couldn\'t process that request. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle navigation request
  const handleNavigation = async (destination: string) => {
    try {
      // Geocode the destination
      const destinationLocation = await geocodeAddress(destination)
      
      if (!destinationLocation) {
        showToast(`Couldn't find "${destination}". Please try a different address.`, 'error')
        return
      }

      // Get directions
      const directions = await getDirections(currentLocation!, destinationLocation)
      
      if (!directions) {
        showToast('Could not find a route to that destination.', 'error')
        return
      }

      // Update route data
      const route = directions.routes[0]
      const leg = route.legs[0]
      
      setRouteData({
        origin: currentLocation!,
        destination: destinationLocation,
        directions,
        distance: leg.distance?.text || '',
        duration: leg.duration?.text || '',
      })

      // Speak confirmation
      const response = `Navigating to ${destination}. The trip will take ${leg.duration?.text} and is ${leg.distance?.text} away.`
      voiceController.current?.speakResponse(response)
      showToast(`Route found: ${leg.duration?.text}`, 'success')
      
    } catch (error) {
      console.error('Navigation failed:', error)
      showToast('Failed to get directions. Please try again.', 'error')
    }
  }

  // Handle pit stop search
  const handleFindPitStop = async (category: string, preference?: string) => {
    try {
      if (!currentLocation) return

      // Map category to Google Places type
      const placeType = mapCategoryToPlaceType(category)
      
      // Find nearby places
      const places = await findNearbyPlaces(currentLocation, placeType, 5000)
      
      // Convert to PitStop format
      const pitStopsData: PitStop[] = places.slice(0, 5).map((place, index) => ({
        id: place.place_id || `place-${index}`,
        name: place.name || 'Unknown',
        address: place.vicinity || place.formatted_address || 'Address not available',
        rating: place.rating,
        priceLevel: place.price_level,
        type: category,
      }))

      setPitStops(pitStopsData)
      
      const response = `Found ${pitStopsData.length} ${category} options nearby.`
      voiceController.current?.speakResponse(response)
      showToast(`Found ${pitStopsData.length} ${category}`, 'success')
      
    } catch (error) {
      console.error('Pit stop search failed:', error)
      showToast('Failed to find nearby places. Please try again.', 'error')
    }
  }

  // Handle route questions
  const handleRouteQuestion = async (question: string) => {
    if (!routeData) {
      voiceController.current?.speakResponse('No active route. Please start navigation first.')
      return
    }

    try {
      // Generate contextual response
      const response = await generateRouteResponse(question, routeData)
      voiceController.current?.speakResponse(response)
    } catch (error) {
      console.error('Route question failed:', error)
      voiceController.current?.speakResponse('Sorry, I couldn\'t answer that question about the route.')
    }
  }

  // Handle general questions
  const handleGeneralQuestion = async (question: string) => {
    try {
      const response = await generateGeneralResponse(question)
      voiceController.current?.speakResponse(response)
    } catch (error) {
      console.error('General question failed:', error)
      voiceController.current?.speakResponse('Sorry, I couldn\'t answer that question.')
    }
  }

  // Map category to Google Places type
  const mapCategoryToPlaceType = (category: string): string => {
    const categoryMap: Record<string, string> = {
      gas: 'gas_station',
      food: 'restaurant',
      coffee: 'cafe',
      restroom: 'restroom',
      hotel: 'lodging',
      parking: 'parking',
      atm: 'atm',
      pharmacy: 'pharmacy',
    }
    
    return categoryMap[category.toLowerCase()] || 'establishment'
  }

  // Show toast message
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  // Start voice interaction
  const startVoiceInteraction = () => {
    if (!permissionsGranted) {
      requestPermissions()
      return
    }

    voiceController.current?.startVoiceInteraction(
      handleVoiceCommand,
      setVoiceState
    )
  }

  // Stop voice interaction
  const stopVoiceInteraction = () => {
    voiceController.current?.stop()
    setVoiceState(VoiceState.IDLE)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-soft px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Cruise</h1>
        </div>
        
        <VoiceIndicator state={voiceState} />
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map */}
        <MapCanvas
          ref={mapRef}
          currentLocation={currentLocation}
          routeData={routeData}
          onLocationUpdate={setCurrentLocation}
        />

        {/* Voice Button */}
        <div className="absolute bottom-6 right-6">
          <VoiceButton
            state={voiceState}
            isLoading={isLoading}
            onStart={startVoiceInteraction}
            onStop={stopVoiceInteraction}
          />
        </div>

        {/* Pit Stops */}
        {pitStops.length > 0 && (
          <div className="absolute top-4 left-4 right-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {pitStops.map((pitStop) => (
                <PitStopCard
                  key={pitStop.id}
                  pitStop={pitStop}
                  onSelect={() => {
                    // Handle pit stop selection
                    showToast(`Selected ${pitStop.name}`, 'success')
                    setPitStops([])
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Route Info */}
        {routeData && (
          <div className="absolute top-4 left-4 right-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Route</p>
                  <p className="font-medium">{routeData.distance} • {routeData.duration}</p>
                </div>
                <button
                  onClick={() => setRouteData(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Messages */}
      <div className="absolute top-20 left-4 right-4 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  )
} 