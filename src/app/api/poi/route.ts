import { NextRequest, NextResponse } from 'next/server'
import { findNearbyPlaces } from '@/lib/googleMaps'

export async function POST(request: NextRequest) {
  try {
    const { location, type, radius = 5000, maxResults = 10 } = await request.json()

    if (!location || !type) {
      return NextResponse.json(
        { error: 'Location and type are required' },
        { status: 400 }
      )
    }

    // Find nearby places
    const places = await findNearbyPlaces(location, type, radius)

    // Format and limit results
    const formattedPlaces = places.slice(0, maxResults).map((place, index) => ({
      id: place.place_id || `place-${index}`,
      name: place.name || 'Unknown',
      address: place.vicinity || place.formatted_address || 'Address not available',
      location: place.geometry?.location ? {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      } : null,
      rating: place.rating,
      priceLevel: place.price_level,
      types: place.types || [],
      photos: place.photos?.slice(0, 3).map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })) || [],
      openingHours: place.opening_hours,
    }))

    return NextResponse.json({
      success: true,
      data: {
        places: formattedPlaces,
        total: places.length,
        type,
        radius,
      },
    })
  } catch (error) {
    console.error('POI API error:', error)
    return NextResponse.json(
      { error: 'Failed to find nearby places' },
      { status: 500 }
    )
  }
} 