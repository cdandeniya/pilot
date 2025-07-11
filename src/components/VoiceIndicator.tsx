'use client'

import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react'
import { VoiceState } from '@/lib/speech'

interface VoiceIndicatorProps {
  state: VoiceState
}

export function VoiceIndicator({ state }: VoiceIndicatorProps) {
  const getIndicatorState = () => {
    switch (state) {
      case VoiceState.LISTENING:
        return {
          icon: <Mic className="w-4 h-4 text-accent-500" />,
          className: 'text-accent-500',
          text: 'Listening',
        }
      case VoiceState.THINKING:
        return {
          icon: <Loader2 className="w-4 h-4 text-accent-500 animate-spin" />,
          className: 'text-accent-500',
          text: 'Thinking',
        }
      case VoiceState.SPEAKING:
        return {
          icon: <Volume2 className="w-4 h-4 text-green-500" />,
          className: 'text-green-500',
          text: 'Speaking',
        }
      default:
        return {
          icon: <MicOff className="w-4 h-4 text-gray-400" />,
          className: 'text-gray-400',
          text: 'Voice Off',
        }
    }
  }

  const indicatorState = getIndicatorState()

  return (
    <div className={`flex items-center space-x-2 ${indicatorState.className}`}>
      {indicatorState.icon}
      <span className="text-sm font-medium hidden sm:inline">
        {indicatorState.text}
      </span>
    </div>
  )
} 