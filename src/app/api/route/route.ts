import { NextRequest, NextResponse } from 'next/server'
import { getDirections, geocodeAddress } from '@/lib/googleMaps'

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, mode = 'driving' } = await request.json()

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      )
    }

    // Geocode addresses if they're strings
    let originLocation = origin
    let destinationLocation = destination

    if (typeof origin === 'string') {
      originLocation = await geocodeAddress(origin)
      if (!originLocation) {
        return NextResponse.json(
          { error: `Could not find location for origin: ${origin}` },
          { status: 400 }
        )
      }
    }

    if (typeof destination === 'string') {
      destinationLocation = await geocodeAddress(destination)
      if (!destinationLocation) {
        return NextResponse.json(
          { error: `Could not find location for destination: ${destination}` },
          { status: 400 }
        )
      }
    }

    // Get directions
    const directions = await getDirections(originLocation, destinationLocation)

    if (!directions) {
      return NextResponse.json(
        { error: 'Could not find a route between the specified locations' },
        { status: 400 }
      )
    }

    // Extract route information
    const route = directions.routes[0]
    const leg = route.legs[0]

    const routeData = {
      origin: originLocation,
      destination: destinationLocation,
      directions,
      distance: leg.distance?.text || '',
      duration: leg.duration?.text || '',
      steps: leg.steps?.map((step: any) => ({
        instruction: step.maneuver?.instruction || step.html_instructions,
        distance: step.distance?.text || '',
        duration: step.duration?.text || '',
      })) || [],
    }

    return NextResponse.json({
      success: true,
      data: routeData,
    })
  } catch (error) {
    console.error('Route API error:', error)
    return NextResponse.json(
      { error: 'Failed to get directions' },
      { status: 500 }
    )
  }
} 