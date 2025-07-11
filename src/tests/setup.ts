import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Speech API
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  },
  writable: true,
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: class MockSpeechRecognition {
    start = vi.fn()
    stop = vi.fn()
    abort = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
  },
  writable: true,
})

// Mock Google Maps
global.google = {
  maps: {
    Map: vi.fn(),
    DirectionsRenderer: vi.fn(),
    DirectionsService: vi.fn(),
    Geocoder: vi.fn(),
    PlacesService: vi.fn(),
    LatLng: vi.fn(),
    LatLngBounds: vi.fn(),
    MapTypeId: {
      ROADMAP: 'roadmap',
    },
  },
} as any

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
}) 