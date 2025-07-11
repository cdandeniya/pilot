import Link from 'next/link'
import { ArrowRight, Mic, MapPin, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Cruise</h1>
          </div>
          <Link 
            href="/navigation" 
            className="btn-primary flex items-center space-x-2"
          >
            <span>Start Navigation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Sparkles className="w-6 h-6 text-accent-500" />
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900">
              Conversational Copilot
            </h2>
            <Sparkles className="w-6 h-6 text-accent-500" />
          </div>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 text-balance">
            Voice-controlled navigation that understands natural language. 
            Get turn-by-turn directions, find pit stops, and ask questions—all hands-free.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/navigation" className="btn-primary text-lg px-8 py-4">
              Start Your Journey
            </Link>
            <button className="btn-secondary text-lg px-8 py-4 flex items-center justify-center space-x-2">
              <Mic className="w-5 h-5" />
              <span>Try Voice Demo</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mic className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Voice Control</h3>
            <p className="text-gray-600">
              Speak naturally to navigate, find places, and get answers without touching your device.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-accent-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Navigation</h3>
            <p className="text-gray-600">
              Turn-by-turn directions powered by Google Maps with real-time traffic and route optimization.
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600">
              Ask questions about your route, find nearby amenities, and get contextual information.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Try These Voice Commands</h3>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="card p-4">
              <p className="text-sm text-gray-600 mb-2">Navigation</p>
              <p className="font-medium">"Navigate to 1600 Amphitheatre Parkway"</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-600 mb-2">Find Places</p>
              <p className="font-medium">"Find the cheapest gas station"</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-600 mb-2">Route Info</p>
              <p className="font-medium">"How long until we arrive?"</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-600 mb-2">General Questions</p>
              <p className="font-medium">"What's the weather like?"</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center text-gray-500">
          <p>&copy; 2024 Cruise. Built with Next.js, Google Maps, and OpenAI.</p>
        </div>
      </footer>
    </div>
  )
}
