import { NextRequest, NextResponse } from 'next/server'
import { processVoiceCommand } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Process the voice command
    const result = await processVoiceCommand(message, context)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    )
  }
} 