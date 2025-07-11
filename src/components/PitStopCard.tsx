'use client'

import { MapPin, Star, DollarSign } from 'lucide-react'

interface PitStop {
  id: string
  name: string
  address: string
  rating?: number
  priceLevel?: number
  distance?: number // Make optional
  type: string
}

interface PitStopCardProps {
  pitStop: PitStop
  onSelect: () => void
}

export function PitStopCard({ pitStop, onSelect }: PitStopCardProps) {
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    } else {
      return `${(distance / 1000).toFixed(1)}km`
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'gas':
      case 'gas_station':
        return '⛽'
      case 'food':
      case 'restaurant':
        return '🍽️'
      case 'coffee':
      case 'cafe':
        return '☕'
      case 'restroom':
        return '🚻'
      case 'hotel':
      case 'lodging':
        return '🏨'
      case 'parking':
        return '🅿️'
      case 'atm':
        return '🏧'
      case 'pharmacy':
        return '💊'
      default:
        return '📍'
    }
  }

  const getPriceLevel = (level?: number) => {
    if (!level) return null
    return Array(level).fill('$').join('')
  }

  return (
    <div 
      className="card p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onSelect}
    >
      <div className="flex items-start space-x-3">
        {/* Type Icon */}
        <div className="text-2xl flex-shrink-0">
          {getTypeIcon(pitStop.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {pitStop.name}
              </h3>
              
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600 truncate">
                  {pitStop.address}
                </p>
              </div>
            </div>

            {/* Distance */}
            <div className="text-sm text-gray-500 flex-shrink-0 ml-2">
              {formatDistance(pitStop.distance || 0)}
            </div>
          </div>

          {/* Rating and Price */}
          <div className="flex items-center space-x-3 mt-2">
            {pitStop.rating && (
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">
                  {pitStop.rating.toFixed(1)}
                </span>
              </div>
            )}
            
            {pitStop.priceLevel && (
              <div className="flex items-center space-x-1">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {getPriceLevel(pitStop.priceLevel)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 