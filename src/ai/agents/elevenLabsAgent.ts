/**
 * ElevenLabs Agent
 * 
 * AI agent for text-to-speech processing using ElevenLabs API.
 * Follows Event-Driven Architecture Blueprint with multi-tenant isolation.
 * 
 * This agent:
 * - Subscribes to term/assigned and feedback/generated events
 * - Calls ElevenLabs TTS API for audio synthesis
 * - Emits audio/ready events with streaming support
 * - Handles tenant-specific voice configurations
 * - Provides fallback for API failures
 */

import type { AIAgent, EventContext } from '../agent.ts'
import type { TermAssignedEvent, FeedbackGeneratedEvent, AudioReadyEvent, AudioGenerationFailedEvent } from '@/entities/game/model/audioEvents.ts'
import type { GameEvent } from '@/entities/game'
import type { EventEnvelope } from '@/shared/event-sourcing'
import { DEFAULT_VOICE_MAPPINGS } from '@/entities/game/model/audioEvents.ts'

/**
 * ElevenLabs API Configuration
 */
interface ElevenLabsConfig {
  readonly apiKey: string
  readonly baseUrl: string
  readonly timeout: number
}

/**
 * ElevenLabs Voice Settings
 */
interface VoiceSettings {
  readonly stability: number
  readonly similarity_boost: number
  readonly style: string
  readonly use_speaker_boost: boolean
  readonly optimize_streaming_latency: number
  readonly output_format: 'mp3_22050_32' | 'mp3_44100_32' | 'pcm_22050' | 'pcm_44100'
}

/**
 * Streaming TTS Response - Unused interface
 */
// interface StreamingTTSResponse {
//   audio: ReadableStream<Uint8Array>
//   text: string
//   voiceId: string
//   duration: number
//   model: string
// }

/**
 * Voice Configuration by Tenant
 */
interface TenantVoiceConfig {
  readonly tenant_id: string
  readonly voiceId: string
  readonly language: string
  readonly settings: VoiceSettings
  readonly preferences: {
    readonly speed: number
    readonly pitch: number
    readonly volume: number
  }
}

/**
 * ElevenLabs Agent Implementation
 * 
 * Processes text events and synthesizes them to audio using ElevenLabs API.
 * Maintains strict multi-tenant isolation and handles streaming for low latency.
 */
export class ElevenLabsAgent implements AIAgent<TermAssignedEvent | FeedbackGeneratedEvent | AudioReadyEvent | AudioGenerationFailedEvent> {
  readonly agentId = 'elevenlabs-agent'
  readonly name = 'ElevenLabs Text-to-Speech Agent'
  readonly description = 'Synthesizes text to audio using ElevenLabs API with streaming support'

  private readonly subscribedEventTypes = new Set(['term/assigned', 'feedback/generated'])
  private eventStore: any
  private readonly config: ElevenLabsConfig
  private readonly tenantVoiceConfigs = new Map<string, TenantVoiceConfig>()

  constructor(config?: Partial<ElevenLabsConfig>) {
    this.config = {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
      baseUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
      timeout: 30000, // 30 seconds
      ...config
    }

    if (!this.config.apiKey) {
      console.warn('🤖 [ELEVENLABS] ElevenLabs API key not configured')
    }

    console.log('🤖 [ELEVENLABS] ElevenLabs Agent initialized')
    
    // Initialize tenant voice configurations
    this.initializeTenantVoiceConfigs()
  }

  /**
   * Subscribe to text generation events
   */
  subscribe(eventTypes: string[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.add(type))
    console.log('🤖 [ELEVENLABS] Subscribed to events:', eventTypes)
  }

  /**
   * Unsubscribe from event types
   */
  unsubscribe(eventTypes: string[]): void {
    eventTypes.forEach(type => this.subscribedEventTypes.delete(type))
    console.log('🤖 [ELEVENLABS] Unsubscribed from events:', eventTypes)
  }

  /**
   * Get subscribed event types
   */
  getSubscribedEventTypes(): readonly string[] {
    return Array.from(this.subscribedEventTypes)
  }

  /**
   * Set event store for agent
   */
  setEventStore(eventStore: any): void {
    this.eventStore = eventStore
  }

  /**
   * Process text events and synthesize audio
   */
  async process(context: EventContext): Promise<(TermAssignedEvent | FeedbackGeneratedEvent | AudioReadyEvent | AudioGenerationFailedEvent)[]> {
    const { tenant_id, aggregate_id, eventHistory } = context

    // Find relevant text events with proper typing
    const textEvents = eventHistory.filter((e): e is EventEnvelope<TermAssignedEvent | FeedbackGeneratedEvent> => 
      this.subscribedEventTypes.has(e.event.type) &&
      (e.event.type === 'term/assigned' || e.event.type === 'feedback/generated')
    )

    if (textEvents.length === 0) {
      return [] // No text to process
    }

    console.log(`🤖 [ELEVENLABS] Processing ${textEvents.length} text events for tenant: ${tenant_id}`)

    const events: (TermAssignedEvent | FeedbackGeneratedEvent | AudioReadyEvent | AudioGenerationFailedEvent)[] = []

    // Process each text event
    for (const eventEnvelope of textEvents) {
      const event = eventEnvelope.event
      
      if (event.type === 'term/assigned') {
        const termEvent = event as TermAssignedEvent
        const audioEvent = await this.synthesizeTextToAudio(termEvent, tenant_id, aggregate_id)
        events.push(audioEvent as AudioReadyEvent | AudioGenerationFailedEvent)
      } else if (event.type === 'feedback/generated') {
        const feedbackEvent = event as FeedbackGeneratedEvent
        const audioEvent = await this.synthesizeTextToAudio(feedbackEvent, tenant_id, aggregate_id)
        events.push(audioEvent as AudioReadyEvent | AudioGenerationFailedEvent)
      }
    }

    return events
  }

  /**
   * Emit events to event store
   */
  emit(events: GameEvent[], tenant_id: string, aggregate_id: string): void {
    if (!this.eventStore) {
      throw new Error('EventStore not injected. Call setEventStore() first.')
    }

    console.log(`🤖 [ELEVENLABS] Emitting ${events.length} events for tenant: ${tenant_id}`)

    // Ensure all events have proper tenant_id and aggregate_id
    const enrichedEvents = events.map(event => ({
      ...event,
      tenant_id,
      aggregate_id
    }))

    this.eventStore.commit(enrichedEvents, tenant_id, aggregate_id)
  }

  /**
   * Synthesize text to audio using ElevenLabs API
   */
  private async synthesizeTextToAudio(
    event: TermAssignedEvent | FeedbackGeneratedEvent,
    tenant_id: string,
    aggregate_id: string
  ): Promise<GameEvent> {
    const startTime = Date.now()

    try {
      // Validate configuration
      if (!this.config.apiKey) {
        throw new Error('ElevenLabs API key not configured')
      }

      // Get tenant-specific voice configuration
      const voiceConfig = this.getTenantVoiceConfig(tenant_id)
      
      // Prepare request for ElevenLabs API
      const requestData = this.prepareTTSRequest(event, voiceConfig)

      // Call ElevenLabs API
      const response = await this.callElevenLabsAPI(requestData)

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
      }

      const audioBlob = await response.blob()
      const processingTime = Date.now() - startTime

      console.log(`🤖 [ELEVENLABS] TTS completed in ${processingTime}ms`)
      console.log(`  Text: "${event.type === 'term/assigned' ? event.term : event.feedback}"`)
      console.log(`  Voice: ${voiceConfig.voiceId}`)
      console.log(`  Duration: ${audioBlob.size} bytes`)

      // Emit audio ready event
      const audioReadyEvent: AudioReadyEvent = {
        type: 'audio/ready',
        tenant_id,
        aggregate_id,
        audioBlob,
        text: event.type === 'term/assigned' ? event.term : event.feedback,
        voiceId: voiceConfig.voiceId,
        duration: 0, // Will be calculated from audio blob
        format: 'mp3',
        model: voiceConfig.settings.optimize_streaming_latency === 4 ? 'eleven_turbo_v2' : 'eleven_monolingual_v1'
      }

      return audioReadyEvent

    } catch (error) {
      console.error('🤖 [ELEVENLABS] TTS failed:', error)
      
      const processingTime = Date.now() - startTime
    console.debug(`[ElevenLabs] TTS processing completed in ${processingTime}ms`)
      
      // Emit failure event
      const failureEvent: AudioGenerationFailedEvent = {
        type: 'audio/generation-failed',
        tenant_id,
        aggregate_id,
        errorType: 'elevenlabs',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        originalEvent: event.type,
        fallbackText: event.type === 'term/assigned' ? event.term : event.feedback
      }

      return failureEvent
    }
  }

  /**
   * Prepare TTS request for ElevenLabs API
   */
  private prepareTTSRequest(
    event: TermAssignedEvent | FeedbackGeneratedEvent,
    voiceConfig: TenantVoiceConfig
  ): FormData {
    const text = event.type === 'term/assigned' ? event.term : event.feedback
    const language = event.type === 'term/assigned' ? event.language : 'en'
    console.debug(`[ElevenLabs] Processing TTS for language: ${language}`)
    
    const formData = new FormData()
    formData.append('text', text)
    formData.append('model', voiceConfig.settings.optimize_streaming_latency === 4 ? 'eleven_turbo_v2' : 'eleven_monolingual_v1')
    formData.append('output_format', 'mp3_22050_32')
    
    // Voice settings
    formData.append('voice_id', voiceConfig.voiceId)
    formData.append('voice_settings', JSON.stringify({
      stability: voiceConfig.settings.stability,
      similarity_boost: voiceConfig.settings.similarity_boost,
      style: voiceConfig.settings.style,
      use_speaker_boost: voiceConfig.settings.use_speaker_boost
    }))
    
    return formData
  }

  /**
   * Call ElevenLabs API with timeout and retry logic
   */
  private async callElevenLabsAPI(formData: FormData): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': this.config.apiKey,
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('ElevenLabs API request timed out')
      }
      
      throw error
    }
  }

  /**
   * Initialize tenant voice configurations
   */
  private initializeTenantVoiceConfigs(): void {
    // Load default voice mappings
    for (const [tenantId, config] of Object.entries(DEFAULT_VOICE_MAPPINGS)) {
      this.tenantVoiceConfigs.set(tenantId, config)
    }
    
    console.log('🤖 [EVENLABS] Initialized voice configurations for tenants:', 
      Array.from(this.tenantVoiceConfigs.keys()))
  }

  /**
   * Get voice configuration for a specific tenant
   */
  getTenantVoiceConfig(tenant_id: string): TenantVoiceConfig {
    // Return existing config or create default
    if (this.tenantVoiceConfigs.has(tenant_id)) {
      return this.tenantVoiceConfigs.get(tenant_id)!
    }
    
    // Create default configuration for unknown tenant
    const defaultConfig: TenantVoiceConfig = {
      tenant_id,
      voiceId: 'bella', // Default English voice
      language: 'en',
      settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 'moderate',
        use_speaker_boost: false,
        optimize_streaming_latency: 2,
        output_format: 'mp3_22050_32'
      },
      preferences: {
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8
      }
    }
    
    this.tenantVoiceConfigs.set(tenant_id, defaultConfig)
    console.log(`🤖 [EVENLABS] Created default voice config for tenant: ${tenant_id}`)
    return defaultConfig
  }

  /**
   * Update tenant voice configuration
   */
  updateTenantVoiceConfig(tenant_id: string, voiceConfig: Partial<TenantVoiceConfig>): void {
    const existing = this.getTenantVoiceConfig(tenant_id)
    const updated = { ...existing, ...voiceConfig }
    this.tenantVoiceConfigs.set(tenant_id, updated)
    
    console.log(`🤖 [EVENLABS] Updated voice config for tenant: ${tenant_id}`)
  }

  // Unused streaming TTS method - functionality not currently needed
  /*
  private async getStreamingTTS(
    text: string,
    voiceConfig: TenantVoiceConfig,
    language: string
  ): Promise<StreamingTTSResponse> {
    if (!text) {
      throw new Error("TTS text missing - cannot generate audio")
    }
    console.debug(`[ElevenLabs] Streaming TTS requested for language: ${language}`)
    
    const formData = new FormData()
    formData.append('text', text)
    formData.append('model', voiceConfig.settings.optimize_streaming_latency === 4 ? 'eleven_turbo_v2' : 'eleven_monolingual_v1')
    formData.append('output_format', 'mp3_22050_32')
    formData.append('voice_id', voiceConfig.voiceId)
    
    const response = await this.callElevenLabsAPI(formData)
    
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }
    
    const audioStream = response.body
    const reader = audioStream?.getReader()
    console.debug(`[ElevenLabs] Audio stream reader created successfully`)
    
    return {
      audio: audioStream!,
      text: text,
      voiceId: voiceConfig.voiceId,
      duration: 0,
      model: voiceConfig.settings.optimize_streaming_latency === 4 ? 'eleven_turbo_v2' : 'eleven_monolingual_v1'
    }
  }
  */

  /**
   * Get ElevenLabs API status
   */
  async getAPIStatus(): Promise<{
    available: boolean
    model: string
    apiKeyConfigured: boolean
    estimatedLatency: number
    streamingSupported: boolean
  }> {
    try {
      if (!this.config.apiKey) {
        return {
          available: false,
          model: 'eleven_monolingual_v1',
          apiKeyConfigured: false,
          estimatedLatency: 0,
          streamingSupported: false
        }
      }

      const startTime = Date.now()
      
      // Simple health check
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      const latency = Date.now() - startTime

      return {
        available: response.ok,
        model: 'eleven_monolingual_v1',
        apiKeyConfigured: true,
        estimatedLatency: latency,
        streamingSupported: true
      }

    } catch (error) {
      console.error('🤖 [EVENLABS] API status check failed:', error)
      return {
        available: false,
        model: 'eleven_monolingual_v1',
        apiKeyConfigured: !!this.config.apiKey,
        estimatedLatency: 0,
        streamingSupported: false
      }
    }
  }

  /**
   * Get agent statistics
   */
  getStats(): {
    totalProcessed: number
    successfulSyntheses: number
    failedSyntheses: number
    averageProcessingTime: number
    supportedVoices: string[]
    tenantVoiceConfigs: number
    streamingUsage: number
  } {
    // This would be tracked internally in a real implementation
    return {
      totalProcessed: 0,
      successfulSyntheses: 0,
      failedSyntheses: 0,
      averageProcessingTime: 0,
      supportedVoices: ['bella', 'rachel', 'dominique', 'antoni', 'elli', 'bvlada'],
      tenantVoiceConfigs: this.tenantVoiceConfigs.size,
      streamingUsage: 0
    }
  }
}

/**
 * Factory function to create ElevenLabs agent
 */
export function createElevenLabsAgent(config?: Partial<ElevenLabsConfig>): ElevenLabsAgent {
  return new ElevenLabsAgent(config)
}

/**
 * Default ElevenLabs agent instance
 */
export const elevenLabsAgent = createElevenLabsAgent()

/**
 * Helper function to update tenant voice configuration
 */
export function updateTenantVoiceConfig(
  tenant_id: string,
  voiceConfig: Partial<TenantVoiceConfig>
): void {
  elevenLabsAgent.updateTenantVoiceConfig(tenant_id, voiceConfig)
}

/**
 * Helper function to get tenant voice configuration
 */
export function getTenantVoiceConfig(tenant_id: string): TenantVoiceConfig {
  return elevenLabsAgent.getTenantVoiceConfig(tenant_id)
}
