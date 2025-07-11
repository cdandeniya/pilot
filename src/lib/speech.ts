// Speech recognition interface
export interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: any) => any) | null
  onerror: ((this: SpeechRecognition, ev: any) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

// Speech synthesis interface
export interface SpeechSynthesis extends EventTarget {
  speak(utterance: SpeechSynthesisUtterance): void
  cancel(): void
  getVoices(): SpeechSynthesisVoice[]
}

// Speech synthesis utterance interface
export interface SpeechSynthesisUtterance extends EventTarget {
  text: string
  lang: string
  pitch: number
  rate: number
  volume: number
  voice: SpeechSynthesisVoice | null
}

// Speech synthesis voice interface
export interface SpeechSynthesisVoice {
  voiceURI: string
  name: string
  lang: string
  localService: boolean
  default: boolean
}

// Voice state enum
export enum VoiceState {
  IDLE = 'idle',
  LISTENING = 'listening',
  THINKING = 'thinking',
  SPEAKING = 'speaking',
}

// Speech recognition class
export class VoiceRecognition {
  private recognition: SpeechRecognition | null = null
  private isListening = false
  private onResult: ((text: string) => void) | null = null
  private onError: ((error: string) => void) | null = null
  private onStateChange: ((state: VoiceState) => void) | null = null

  constructor() {
    this.initializeRecognition()
  }

  private initializeRecognition() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported')
      return
    }

    this.recognition = new SpeechRecognition()
    if (!this.recognition) return
    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = 'en-US'

    this.recognition.onstart = () => {
      this.isListening = true
      this.onStateChange?.(VoiceState.LISTENING)
    }

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results as any[])
        .map(result => result[0])
        .map(result => result.transcript)
        .join('')

      this.onResult?.(transcript)
    }

    this.recognition.onerror = (event) => {
      this.isListening = false
      const error = (event as any).error
      this.onError?.(error)
      this.onStateChange?.(VoiceState.IDLE)
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.onStateChange?.(VoiceState.IDLE)
    }
  }

  // Start listening for voice input
  startListening(
    onResult: (text: string) => void,
    onError: (error: string) => void,
    onStateChange: (state: VoiceState) => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition not supported')
      return
    }

    this.onResult = onResult
    this.onError = onError
    this.onStateChange = onStateChange

    try {
      this.recognition.start()
    } catch (error) {
      onError('Failed to start speech recognition')
    }
  }

  // Stop listening
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  // Check if currently listening
  get isActive() {
    return this.isListening
  }
}

// Speech synthesis class
export class VoiceSynthesis {
  private synthesis: SpeechSynthesis
  private isSpeaking = false
  private onStateChange: ((state: VoiceState) => void) | null = null

  constructor() {
    this.synthesis = window.speechSynthesis
  }

  // Speak text using TTS
  speak(
    text: string,
    options: {
      rate?: number
      pitch?: number
      volume?: number
      voice?: string
    } = {}
  ) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate || 1.0
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0
    utterance.lang = 'en-US'

    // Set voice if specified
    if (options.voice) {
      const voices = this.synthesis.getVoices()
      const voice = voices.find(v => v.name === options.voice)
      if (voice) {
        utterance.voice = voice
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true
      this.onStateChange?.(VoiceState.SPEAKING)
    }

    utterance.onend = () => {
      this.isSpeaking = false
      this.onStateChange?.(VoiceState.IDLE)
    }

    utterance.onerror = () => {
      this.isSpeaking = false
      this.onStateChange?.(VoiceState.IDLE)
    }

    this.synthesis.speak(utterance)
  }

  // Stop speaking
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.isSpeaking = false
      this.onStateChange?.(VoiceState.IDLE)
    }
  }

  // Check if currently speaking
  get isActive() {
    return this.isSpeaking
  }

  // Set state change callback
  setStateChangeCallback(callback: (state: VoiceState) => void) {
    this.onStateChange = callback
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }
}

// Voice controller that manages both recognition and synthesis
export class VoiceController {
  private recognition: VoiceRecognition
  private synthesis: VoiceSynthesis
  private currentState = VoiceState.IDLE

  constructor() {
    this.recognition = new VoiceRecognition()
    this.synthesis = new VoiceSynthesis()
  }

  // Start voice interaction cycle
  startVoiceInteraction(
    onCommand: (command: string) => void,
    onStateChange: (state: VoiceState) => void
  ) {
    this.recognition.startListening(
      (text) => {
        onCommand(text)
        this.setState(VoiceState.THINKING)
      },
      (error) => {
        console.error('Speech recognition error:', error)
        this.setState(VoiceState.IDLE)
      },
      (state) => {
        this.setState(state)
        onStateChange(state)
      }
    )
  }

  // Speak response
  speakResponse(text: string) {
    this.setState(VoiceState.SPEAKING)
    this.synthesis.speak(text, {
      rate: 0.9, // Slightly slower for better comprehension
      pitch: 1.0,
      volume: 0.8,
    })
  }

  // Stop all voice activity
  stop() {
    this.recognition.stopListening()
    this.synthesis.stop()
    this.setState(VoiceState.IDLE)
  }

  // Get current state
  get state() {
    return this.currentState
  }

  // Set state
  private setState(state: VoiceState) {
    this.currentState = state
  }

  // Check if voice is active
  get isActive() {
    return this.recognition.isActive || this.synthesis.isActive
  }
}

// Utility function to check browser support
export const checkVoiceSupport = () => {
  const hasRecognition = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  const hasSynthesis = !!window.speechSynthesis

  return {
    recognition: hasRecognition,
    synthesis: hasSynthesis,
    supported: hasRecognition && hasSynthesis,
  }
} 