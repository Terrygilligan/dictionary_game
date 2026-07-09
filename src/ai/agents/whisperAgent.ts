/**
 * Whisper Agent
 * 
 * AI agent for speech-to-text processing using OpenAI's Whisper API.
 * Follows Event-Driven Architecture Blueprint with multi-tenant isolation.
 * 
 * This agent:
 * - Subscribes to audio/recorded events
 * - Calls Whisper API for transcription
 * - Emits audio/transcribed events
 * - Handles streaming and fallback scenarios
 */

import type { AIAgent, EventContext } from '../agent.ts'
import type { AudioRecordedEvent, AudioTranscribedEvent, AudioGenerationFailedEvent, AudioEventType } from '@/entities/game/model/audioEvents.ts'
import type { GameEvent } from '@/entities/game'

/**
 * Whisper API Configuration
 */
interface WhisperConfig {
  readonly apiKey: string
  readonly model: 'whisper-1' | 'whisper-1-turbo'
  readonly baseUrl: string
  readonly timeout: number
}

/**
 * Whisper Transcription Result
 */
interface WhisperTranscription {
  text: string
  language: string
  duration: number
  words: Array<{
    word: string
    start: number
    end: number
    confidence: number
  }>
}

/**
 * Whisper Agent Implementation
 * 
 * Processes audio recordings and transcribes them to text using Whisper API.
 * Maintains strict multi-tenant isolation and handles API failures gracefully.
 */
export class WhisperAgent implements AIAgent<AudioRecordedEvent | AudioTranscribedEvent | AudioGenerationFailedEvent> {
  readonly agentId = 'whisper-agent'
  readonly name = 'Whisper Speech-to-Text Agent'
  readonly description = 'Transcribes audio recordings to text using OpenAI Whisper API'

  private readonly subscribedEventTypes = new Set(['audio/recorded'])
  private eventStore: any
  private readonly config: WhisperConfig

  constructor(config?: Partial<WhisperConfig>) {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'whisper-1-turbo',
      baseUrl: 'https://api.openai.com/v1/audio/transcriptions',
      timeout: 30000, // 30 seconds
      ...config
    }

    if (!this.config.apiKey) {
      console.warn('🤖 [WHISPER] OpenAI API key not configured')
    }

    console.log('🤖 [WHISPER] Whisper Agent initialized')
  }

  /**
   * Subscribe to audio recording events
   */
  subscribe(eventTypes: string[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.add(type))
    console.log('🤖 [WHISPER] Subscribed to events:', eventTypes)
  }

  /**
   * Unsubscribe from event types
   */
  unsubscribe(eventTypes: string[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.delete(type))
    console.log('🤖 [WHISPER] Unsubscribed from events:', eventTypes)
  }

  /**
   * Get subscribed event types
   */
  getSubscribedEventTypes(): readonly AudioEventType[] {
    return Array.from(this.subscribedEventTypes) as AudioEventType[]
  }

  /**
   * Set event store for agent
   */
  setEventStore(eventStore: any): void {
    this.eventStore = eventStore
  }

  /**
   * Process audio events and transcribe them
   */
  process(context: EventContext): GameEvent[] {
    const { tenant_id, aggregate_id, eventHistory } = context

    // Find the most recent audio recorded event
    const audioEvent = [...eventHistory]
      .reverse()
      .find(e => e.event.type === 'audio/recorded')?.event as AudioRecordedEvent

    if (!audioEvent) {
      return [] // No audio to process
    }

    console.log(`🤖 [WHISPER] Processing audio for tenant: ${tenant_id}`)
    console.log(`  Audio duration: ${audioEvent.duration}s`)
    console.log(`  Audio format: ${audioEvent.format}`)
    console.log(`  Sample rate: ${audioEvent.sampleRate}Hz`)

    return this.transcribeAudio(audioEvent)
  }

  /**
   * Emit events to event store
   */
  emit(events: GameEvent[], tenant_id: string, aggregate_id: string): void {
    if (!this.eventStore) {
      throw new Error('EventStore not injected. Call setEventStore() first.')
    }

    console.log(`🤖 [WHISPER] Emitting ${events.length} events for tenant: ${tenant_id}`)

    // Ensure all events have proper tenant_id and aggregate_id
    const enrichedEvents = events.map(event => ({
      ...event,
      tenant_id,
      aggregate_id
    }))

    this.eventStore.commit(enrichedEvents, tenant_id, aggregate_id)
  }

  /**
   * Transcribe audio using Whisper API
   */
  private async transcribeAudio(audioEvent: AudioRecordedEvent): Promise<GameEvent[]> {
    const startTime = Date.now()

    try {
      // Validate configuration
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key not configured')
      }

      // Prepare FormData for Whisper API
      const formData = new FormData()
      formData.append('file', audioEvent.audioBlob, 'audio.webm')
      formData.append('model', this.config.model)
      formData.append('language', 'auto') // Auto-detect language
      formData.append('response_format', 'json')
      formData.append('temperature', '0.0')

      // Call Whisper API
      const response = await this.callWhisperAPI(formData)
      
      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status} ${response.statusText}`)
      }

      const transcription: WhisperTranscription = await response.json()
      const processingTime = Date.now() - startTime

      console.log(`🤖 [WHISPER] Transcription completed in ${processingTime}ms`)
      console.log(`  Text: "${transcription.text}"`)
      console.log(`  Language: ${transcription.language}`)
      console.log(`  Confidence: ${this.calculateAverageConfidence(transcription)}`)

      // Emit transcription event
      const transcriptionEvent: AudioTranscribedEvent = {
        type: 'audio/transcribed',
        tenant_id: audioEvent.tenant_id,
        aggregate_id: audioEvent.aggregate_id,
        transcription: transcription.text.trim(),
        confidence: this.calculateAverageConfidence(transcription),
        language: transcription.language,
        processingTime,
        originalAudioBlob: audioEvent.audioBlob
      }

      // Convert transcription to answer/submitted event
      const answerEvent = this.convertToAnswerEvent(transcriptionEvent)

      return [transcriptionEvent, answerEvent]

    } catch (error) {
      console.error('🤖 [WHISPER] Transcription failed:', error)
      
      const processingTime = Date.now() - startTime
      
      // Emit failure event
      const failureEvent: AudioGenerationFailedEvent = {
        type: 'audio/generation-failed',
        tenant_id: audioEvent.tenant_id,
        aggregate_id: audioEvent.aggregate_id,
        errorType: 'whisper',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        originalEvent: 'audio/recorded',
        fallbackText: 'Unable to transcribe audio. Please try again.'
      }

      return [failureEvent]
    }
  }

  /**
   * Call Whisper API with timeout and retry logic
   */
  private async callWhisperAPI(formData: FormData): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Whisper API request timed out')
      }
      
      throw error
    }
  }

  /**
   * Calculate average confidence from transcription
   */
  private calculateAverageConfidence(transcription: WhisperTranscription): number {
    if (!transcription.words || transcription.words.length === 0) {
      return 0.5 // Default confidence
    }

    const totalConfidence = transcription.words.reduce((sum, word) => sum + word.confidence, 0)
    return totalConfidence / transcription.words.length
  }

  /**
   * Convert transcription event to answer/submitted event
   */
  private convertToAnswerEvent(transcriptionEvent: AudioTranscribedEvent): GameEvent {
    // Extract the answer from transcription
    // This is a simplified approach - in a real implementation,
    // you might want to parse the transcription more intelligently
    const text = transcriptionEvent.transcription.toLowerCase().trim()
    
    // Try to extract a choice from the transcription
    const choiceId = this.extractChoiceFromText(text)
    const roundIndex = 0 // Default round index, could be extracted from context
    
    // Determine if the answer is correct (placeholder logic)
    const correct = this.determineCorrectness(choiceId, text)

    return {
      type: 'answer/submitted',
      tenant_id: transcriptionEvent.tenant_id,
      aggregate_id: transcriptionEvent.aggregate_id,
      roundIndex,
      choiceId,
      correct
    }
  }

  /**
   * Extract choice ID from transcribed text
   */
  private extractChoiceFromText(text: string): string {
    // Simple extraction logic - looks for common patterns
    const patterns = [
      /choice\s+([a-z]+)/i,
      /option\s+([a-z]+)/i,
      /answer\s+([a-z]+)/i,
      /([a-z]+)\s+is\s+the/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    // Fallback: use first word as choice
    const words = text.split(/\s+/).filter(word => word.length > 0)
    return words[0] || 'unknown'
  }

  /**
   * Determine correctness of the answer
   * This is a placeholder - in a real implementation,
    * you would compare against the actual correct answer
   */
  private determineCorrectness(choiceId: string, text: string): boolean {
    // Simple heuristic: positive words are "correct"
    const positiveWords = ['yes', 'correct', 'right', 'true', 'good']
    const negativeWords = ['no', 'wrong', 'false', 'bad', 'incorrect']
    
    if (positiveWords.includes(choiceId)) {
      return true
    }
    
    if (negativeWords.includes(choiceId)) {
      return false
    }
    
    // Default to false for unknown choices
    return false
  }

  /**
   * Get Whisper API status
   */
  async getAPIStatus(): Promise<{
    available: boolean
    model: string
    apiKeyConfigured: boolean
    estimatedLatency: number
  }> {
    try {
      if (!this.config.apiKey) {
        return {
          available: false,
          model: this.config.model,
          apiKeyConfigured: false,
          estimatedLatency: 0
        }
      }

      const startTime = Date.now()
      
      // Simple health check - we could make a minimal API call
      // For now, just check if the API key is present
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const latency = Date.now() - startTime

      return {
        available: response.ok,
        model: this.config.model,
        apiKeyConfigured: true,
        estimatedLatency: latency
      }

    } catch (error) {
      console.error('🤖 [WHISPER] API status check failed:', error)
      return {
        available: false,
        model: this.config.model,
        apiKeyConfigured: !!this.config.apiKey,
        estimatedLatency: 0
      }
    }
  }

  /**
   * Get agent statistics
   */
  getStats(): {
    totalProcessed: number
    successfulTranscriptions: number
    failedTranscriptions: number
    averageProcessingTime: number
    supportedLanguages: string[]
  } {
    // This would be tracked internally in a real implementation
    return {
      totalProcessed: 0,
      successfulTranscriptions: 0,
      failedTranscriptions: 0,
      averageProcessingTime: 0,
      supportedLanguages: ['auto', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'sv', 'pl', 'nl', 'tr', 'bg', 'cs', 'da', 'fi', 'no', 'he', 'th', 'vi', 'ms', 'id', 'tl', 'sw', 'ta', 'te', 'mr', 'hi', 'bn', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur', 'ne', 'si', 'km', 'lo', 'my', 'ka', 'am', 'et', 'eu', 'ca', 'gl', 'eu', 'is', 'mt', 'cy', 'ga', 'gd']
    }
  }
}

/**
 * Factory function to create Whisper agent
 */
export function createWhisperAgent(config?: Partial<WhisperConfig>): WhisperAgent {
  return new WhisperAgent(config)
}

/**
 * Default Whisper agent instance
 */
export const whisperAgent = createWhisperAgent()
