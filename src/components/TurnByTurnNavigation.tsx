'use client'

import { useEffect, useState, useRef } from 'react'
import { MapCanvas } from './MapCanvas'
import { VoiceButton } from './VoiceButton'
import { VoiceIndicator } from './VoiceIndicator'
import { Toast } from './Toast'
import { VoiceState } from '@/lib/speech'

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

interface NavigationStep {
  instruction: string
  distance: string
  duration: string
  maneuver: string
  startLocation: google.maps.LatLng
  endLocation: google.maps.LatLng
  polyline: google.maps.LatLng[]
}

interface TurnByTurnNavigationProps {
  currentLocation: Location | null
  routeData: RouteData | null
  onLocationUpdate: (location: Location) => void
  onVoiceCommand: (command: string) => void
  voiceState: VoiceState
  isLoading: boolean
  onStartVoice: () => void
  onStopVoice: () => void
}

export const TurnByTurnNavigation = ({
  currentLocation,
  routeData,
  onLocationUpdate,
  onVoiceCommand,
  voiceState,
  isLoading,
  onStartVoice,
  onStopVoice,
}: TurnByTurnNavigationProps) => {
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([])
  
  const mapRef = useRef<any>(null)
  const locationWatcherRef = useRef<number | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Parse route data into navigation steps
  useEffect(() => {
    if (routeData?.directions) {
      const steps: NavigationStep[] = []
      const route = routeData.directions.routes[0]
      
      route.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          steps.push({
            instruction: step.instructions,
            distance: step.distance?.text || '',
            duration: step.duration?.text || '',
            maneuver: step.maneuver || 'straight',
            startLocation: step.start_location,
            endLocation: step.end_location,
            polyline: step.polyline?.points ? decodePolyline(step.polyline.points) : [],
          })
        })
      })
      
      setNavigationSteps(steps)
      setCurrentStepIndex(0)
      setIsNavigating(true)
    } else {
      setNavigationSteps([])
      setCurrentStepIndex(0)
      setIsNavigating(false)
    }
  }, [routeData])

  // Start location tracking when navigation begins
  useEffect(() => {
    if (isNavigating && currentLocation) {
      startLocationTracking()
    } else {
      stopLocationTracking()
    }

    return () => {
      stopLocationTracking()
    }
  }, [isNavigating, currentLocation])

  // Start location tracking with high accuracy
  const startLocationTracking = () => {
    if (locationWatcherRef.current) {
      navigator.geolocation.clearWatch(locationWatcherRef.current)
    }

    locationWatcherRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        onLocationUpdate(newLocation)
        updateNavigationProgress(newLocation)
      },
      (error) => {
        console.error('Location tracking failed:', error)
        showToast('Location tracking failed. Please check GPS settings.', 'error')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000, // Update every second
      }
    )
  }

  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationWatcherRef.current) {
      navigator.geolocation.clearWatch(locationWatcherRef.current)
      locationWatcherRef.current = null
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  // Update navigation progress based on current location
  const updateNavigationProgress = (location: Location) => {
    if (!isNavigating || navigationSteps.length === 0) return

    const currentStep = navigationSteps[currentStepIndex]
    if (!currentStep) return

    // Calculate distance to current step's end point
    const distanceToStepEnd = calculateDistance(location, {
      lat: currentStep.endLocation.lat(),
      lng: currentStep.endLocation.lng(),
    })

    // If we're close to the step end point, move to next step
    if (distanceToStepEnd < 50) { // 50 meters threshold
      if (currentStepIndex < navigationSteps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1)
        showToast(`Next: ${navigationSteps[currentStepIndex + 1].instruction}`, 'info')
      } else {
        // Reached destination
        setIsNavigating(false)
        showToast('You have arrived at your destination!', 'success')
      }
    }

    // Calculate overall progress
    const totalDistance = navigationSteps.reduce((acc, step) => {
      return acc + calculateDistance(
        { lat: step.startLocation.lat(), lng: step.startLocation.lng() },
        { lat: step.endLocation.lat(), lng: step.endLocation.lng() }
      )
    }, 0)

    const completedDistance = navigationSteps
      .slice(0, currentStepIndex)
      .reduce((acc, step) => {
        return acc + calculateDistance(
          { lat: step.startLocation.lat(), lng: step.startLocation.lng() },
          { lat: step.endLocation.lat(), lng: step.endLocation.lng() }
        )
      }, 0)

    const currentStepProgress = 1 - (distanceToStepEnd / calculateDistance(
      { lat: currentStep.startLocation.lat(), lng: currentStep.startLocation.lng() },
      { lat: currentStep.endLocation.lat(), lng: currentStep.endLocation.lng() }
    ))

    const overallProgress = ((completedDistance + (currentStepProgress * calculateDistance(
      { lat: currentStep.startLocation.lat(), lng: currentStep.startLocation.lng() },
      { lat: currentStep.endLocation.lat(), lng: currentStep.endLocation.lng() }
    ))) / totalDistance) * 100

    setProgress(Math.min(100, Math.max(0, overallProgress)))
  }

  // Calculate distance between two points in meters
  const calculateDistance = (point1: Location, point2: Location): number => {
    const R = 6371000 // Earth's radius in meters
    const lat1 = point1.lat * (Math.PI / 180)
    const lng1 = point1.lng * (Math.PI / 180)
    const lat2 = point2.lat * (Math.PI / 180)
    const lng2 = point2.lng * (Math.PI / 180)
    
    const dLat = lat2 - lat1
    const dLng = lng2 - lng1
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Decode Google Maps polyline
  const decodePolyline = (encoded: string): google.maps.LatLng[] => {
    const poly: google.maps.LatLng[] = []
    let index = 0, len = encoded.length
    let lat = 0, lng = 0

    while (index < len) {
      let shift = 0, result = 0

      do {
        let b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (result >= 0x20)

      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lat += dlat

      shift = 0
      result = 0

      do {
        let b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (result >= 0x20)

      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lng += dlng

      poly.push(new google.maps.LatLng(lat / 1E5, lng / 1E5))
    }

    return poly
  }

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  // Get maneuver icon
  const getManeuverIcon = (maneuver: string): string => {
    const iconMap: Record<string, string> = {
      'turn-left': '↶',
      'turn-right': '↷',
      'turn-slight-left': '↶',
      'turn-slight-right': '↷',
      'turn-sharp-left': '↶',
      'turn-sharp-right': '↷',
      'uturn-left': '↺',
      'uturn-right': '↻',
      'straight': '↑',
      'ramp-left': '↶',
      'ramp-right': '↷',
      'merge': '↗',
      'fork-left': '↶',
      'fork-right': '↷',
      'ferry': '⛴',
      'roundabout-left': '↺',
      'roundabout-right': '↻',
    }
    
    return iconMap[maneuver] || '↑'
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-soft px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Cruise Navigation</h1>
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
          onLocationUpdate={onLocationUpdate}
        />

        {/* Voice Button */}
        <div className="absolute bottom-6 right-6">
          <VoiceButton
            state={voiceState}
            isLoading={isLoading}
            onStart={onStartVoice}
            onStop={onStopVoice}
          />
        </div>

        {/* Navigation Steps Panel */}
        {isNavigating && navigationSteps.length > 0 && (
          <div className="absolute top-4 left-4 right-4 max-h-96 overflow-y-auto">
            <div className="card p-4 space-y-3">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Current Step */}
              <div className="border-l-4 border-primary-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getManeuverIcon(navigationSteps[currentStepIndex]?.maneuver || 'straight')}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {navigationSteps[currentStepIndex]?.instruction}
                    </p>
                    <p className="text-sm text-gray-600">
                      {navigationSteps[currentStepIndex]?.distance} • {navigationSteps[currentStepIndex]?.duration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="space-y-2">
                {navigationSteps.slice(currentStepIndex + 1, currentStepIndex + 4).map((step, index) => (
                  <div key={index} className="flex items-center space-x-3 py-2">
                    <span className="text-lg text-gray-400">{getManeuverIcon(step.maneuver)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{step.instruction}</p>
                      <p className="text-xs text-gray-500">{step.distance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Route Info (when not actively navigating) */}
        {routeData && !isNavigating && (
          <div className="absolute top-4 left-4 right-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Route Ready</p>
                  <p className="font-medium">{routeData.distance} • {routeData.duration}</p>
                </div>
                <button
                  onClick={() => setIsNavigating(true)}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Start Navigation
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