'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import { initializeMap, mapsLoader } from '@/lib/googleMaps'

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

interface MapCanvasProps {
  currentLocation: Location | null
  routeData: RouteData | null
  onLocationUpdate: (location: Location) => void
}

export const MapCanvas = forwardRef<HTMLDivElement, MapCanvasProps>(
  ({ currentLocation, routeData, onLocationUpdate }, ref) => {
    const mapRef = useRef<google.maps.Map | null>(null)
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
    const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null)
    const [isMapLoaded, setIsMapLoaded] = useState(false)

    // Initialize map
    useEffect(() => {
      const initMap = async () => {
        try {
          await mapsLoader.load()
          
          const mapElement = document.getElementById('map-canvas')
          if (!mapElement) return

          const center = currentLocation || { lat: 37.7749, lng: -122.4194 }
          
          mapRef.current = await initializeMap(mapElement, center)
          setIsMapLoaded(true)

          // Initialize directions renderer with enhanced styling
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            map: mapRef.current,
            suppressMarkers: true, // We'll add our own markers
            polylineOptions: {
              strokeColor: '#2563EB',
              strokeWeight: 6,
              strokeOpacity: 0.8,
            },
            preserveViewport: false,
          })

          // Watch for location updates
          if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
              (position) => {
                const newLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                }
                onLocationUpdate(newLocation)
                updateCurrentLocationMarker(newLocation)
              },
              (error) => {
                console.error('Location watch failed:', error)
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
              }
            )
          }
        } catch (error) {
          console.error('Failed to initialize map:', error)
        }
      }

      initMap()
    }, [])

    // Update current location marker
    const updateCurrentLocationMarker = (location: Location) => {
      if (!mapRef.current) return

      // Remove existing marker
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null)
      }

      // Create new marker with enhanced styling for navigation
      currentLocationMarkerRef.current = new google.maps.Marker({
        position: location,
        map: mapRef.current,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        zIndex: 1000, // Ensure it's always on top
      })

      // Add a pulsing effect for better visibility
      if (routeData) {
        // When navigating, keep the marker centered and add pulsing
        mapRef.current.setCenter(location)
        mapRef.current.setZoom(18) // Closer zoom for navigation
      } else {
        // When not navigating, just center on location
        mapRef.current.setCenter(location)
      }
    }

    // Update route display
    useEffect(() => {
      if (!mapRef.current || !directionsRendererRef.current) return

      if (routeData && routeData.directions) {
        // Display route
        directionsRendererRef.current.setDirections(routeData.directions)
        
        // Fit map to show entire route
        const bounds = new google.maps.LatLngBounds()
        bounds.extend(routeData.origin)
        bounds.extend(routeData.destination)
        mapRef.current.fitBounds(bounds)
        
        // Add padding to bounds
        const listener = google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
          const currentBounds = mapRef.current?.getBounds()
          if (currentBounds) {
            const ne = currentBounds.getNorthEast()
            const sw = currentBounds.getSouthWest()
            const latDiff = ne.lat() - sw.lat()
            const lngDiff = ne.lng() - sw.lng()
            
            const newBounds = new google.maps.LatLngBounds(
              new google.maps.LatLng(sw.lat() - latDiff * 0.1, sw.lng() - lngDiff * 0.1),
              new google.maps.LatLng(ne.lat() + latDiff * 0.1, ne.lng() + lngDiff * 0.1)
            )
            mapRef.current?.fitBounds(newBounds)
          }
        })
      } else {
        // Clear route
        directionsRendererRef.current.setDirections(null)
      }
    }, [routeData])

    // Update current location marker when location changes
    useEffect(() => {
      if (currentLocation && isMapLoaded) {
        updateCurrentLocationMarker(currentLocation)
      }
    }, [currentLocation, isMapLoaded])

    return (
      <div className="w-full h-full relative">
        {/* Map Container */}
        <div
          id="map-canvas"
          ref={ref}
          className="w-full h-full"
        />
        
        {/* Loading Overlay */}
        {!isMapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        {/* Google Maps Attribution */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-90 px-2 py-1 rounded">
          © Google Maps
        </div>
      </div>
    )
  }
)

MapCanvas.displayName = 'MapCanvas' 