/**
 * Audio Events for Voice Interaction
 * 
 * Following Event-Driven Architecture Blueprint with multi-tenant isolation.
 * These events enable voice input/output integration with Whisper and ElevenLabs.
 */

import type { BaseGameEvent } from './events.ts'

/**
 * Audio Recorded Event
 * 
 * Emitted when user records audio input for speech-to-text processing
 */
export interface AudioRecordedEvent extends BaseGameEvent {
  readonly type: 'audio/recorded'
  readonly audioBlob: Blob
  readonly duration: number
  readonly format: 'webm' | 'wav' | 'mp3' | 'ogg'
  readonly sampleRate: number
  readonly channels: number
}

/**
 * Audio Transcribed Event
 * 
 * Emitted when Whisper API successfully transcribes audio to text
 */
export interface AudioTranscribedEvent extends BaseGameEvent {
  readonly type: 'audio/transcribed'
  readonly transcription: string
  readonly confidence: number
  readonly language: string
  readonly processingTime: number
  readonly originalAudioBlob: Blob
}

/**
 * Audio Generation Failed Event
 * 
 * Emitted when audio API (Whisper or ElevenLabs) fails
 */
export interface AudioGenerationFailedEvent extends BaseGameEvent {
  readonly type: 'audio/generation-failed'
  readonly errorType: 'whisper' | 'elevenlabs' | 'network' | 'authentication'
  readonly errorMessage: string
  readonly originalEvent: string
  readonly fallbackText?: string
}

/**
 * Term Assigned Event
 * 
 * Emitted when a term/concept is assigned for TTS processing
 */
export interface TermAssignedEvent extends BaseGameEvent {
  readonly type: 'term/assigned'
  readonly term: string
  readonly language: string
  readonly context: 'feedback' | 'instruction' | 'celebration' | 'correction'
  readonly priority: 'low' | 'medium' | 'high'
}

/**
 * Feedback Generated Event
 * 
 * Emitted when feedback text is ready for audio synthesis
 */
export interface FeedbackGeneratedEvent extends BaseGameEvent {
  readonly type: 'feedback/generated'
  readonly feedback: string
  readonly feedbackType: 'positive' | 'negative' | 'neutral' | 'instructional'
  readonly language: string
  readonly emotionalTone: 'encouraging' | 'neutral' | 'corrective'
}

/**
 * Audio Ready Event
 * 
 * Emitted when ElevenLabs TTS audio is ready for playback
 */
export interface AudioReadyEvent extends BaseGameEvent {
  readonly type: 'audio/ready'
  readonly audioBlob: Blob
  readonly text: string
  readonly voiceId: string
  readonly duration: number
  readonly format: 'mp3' | 'wav' | 'ogg'
  readonly model: string
}

/**
 * Audio Played Event
 * 
 * Emitted when audio playback completes
 */
export interface AudioPlayedEvent extends BaseGameEvent {
  readonly type: 'audio/played'
  readonly audioId: string
  readonly duration: number
  readonly playbackTime: number
}

/**
 * Voice Settings Updated Event
 * 
 * Emitted when user voice preferences are updated
 */
export interface VoiceSettingsUpdatedEvent extends BaseGameEvent {
  readonly type: 'voice/settings-updated'
  readonly voiceId: string
  readonly language: string
  readonly voiceProvider: 'elevenlabs' | 'openai' | 'custom'
  readonly settings: {
    readonly stability: number
    readonly similarity_boost: number
    readonly style: string
    readonly use_speaker_boost: boolean
    readonly optimize_streaming_latency: number
  }
}

/**
 * Audio Event Types Union
 */
export type AudioEvent = 
  | AudioRecordedEvent
  | AudioTranscribedEvent
  | AudioGenerationFailedEvent
  | TermAssignedEvent
  | FeedbackGeneratedEvent
  | AudioReadyEvent
  | AudioPlayedEvent
  | VoiceSettingsUpdatedEvent

/**
 * Audio Event Type Discriminator
 */
export type AudioEventType = AudioEvent['type']

/**
 * Voice Configuration Interface
 * Used for tenant-specific voice settings
 */
export interface VoiceConfiguration {
  readonly tenant_id: string
  readonly voiceId: string
  readonly language: string
  readonly provider: 'elevenlabs' | 'openai' | 'custom'
  readonly settings: {
    readonly stability: number
    readonly similarity_boost: number
    readonly style: string
    readonly use_speaker_boost: boolean
  }
  readonly preferences: {
    readonly speed: number
    readonly pitch: number
    readonly volume: number
  }
}

/**
 * Audio Processing Configuration
 */
export interface AudioProcessingConfig {
  readonly whisper: {
    readonly model: 'whisper-1' | 'whisper-1-turbo'
    readonly language: string | 'auto'
    readonly temperature: number
    readonly response_format: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  }
  readonly elevenlabs: {
    readonly model: string
    readonly optimize_streaming_latency: number
    readonly output_format: 'mp3_22050_32' | 'mp3_44100_32' | 'pcm_22050' | 'pcm_44100'
    readonly voice_settings: {
      readonly stability: number
      readonly similarity_boost: number
      readonly style: string
      readonly use_speaker_boost: boolean
    }
  }
}

/**
 * Default Audio Processing Configuration
 */
export const DEFAULT_AUDIO_CONFIG: AudioProcessingConfig = {
  whisper: {
    model: 'whisper-1-turbo',
    language: 'auto',
    temperature: 0.0,
    response_format: 'json'
  },
  elevenlabs: {
    model: 'eleven_monolingual_v1',
    optimize_streaming_latency: 2,
    output_format: 'mp3_22050_32',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 'moderate',
      use_speaker_boost: false
    }
  }
}

/**
 * Voice Mappings by Language and Tenant
 * Maps tenants to their preferred voice configurations
 */
export interface VoiceMapping {
  readonly [tenant_id: string]: VoiceConfiguration
}

/**
 * Default Voice Mappings
 * Can be extended with tenant-specific configurations
 */
export const DEFAULT_VOICE_MAPPINGS: VoiceMapping = {
  // Bulgarian voices
  'tenant_bg_001': {
    tenant_id: 'tenant_bg_001',
    voiceId: 'bvlada', // Bulgarian female voice
    language: 'bg',
    provider: 'elevenlabs',
    settings: {
      stability: 0.4,
      similarity_boost: 0.6,
      style: 'gentle',
      use_speaker_boost: true
    },
    preferences: {
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8
    }
  },
  // French voices
  'tenant_fr_001': {
    tenant_id: 'tenant_fr_001',
    voiceId: 'rachel', // French female voice
    language: 'fr',
    provider: 'elevenlabs',
    settings: {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 'moderate',
      use_speaker_boost: false
    },
    preferences: {
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8
    }
  },
  // English voices
  'tenant_en_001': {
    tenant_id: 'tenant_en_001',
    voiceId: 'bella', // English female voice
    language: 'en',
    provider: 'elevenlabs',
    settings: {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 'moderate',
      use_speaker_boost: false
    },
    preferences: {
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8
    }
  }
}

/**
 * Audio Event Factory Functions
 * Helper functions to create audio events with proper tenant context
 */

export function createAudioRecordedEvent(
  tenant_id: string,
  aggregate_id: string,
  audioBlob: Blob,
  metadata: {
    duration: number
    format: 'webm' | 'wav' | 'mp3' | 'ogg'
    sampleRate: number
    channels: number
  }
): AudioRecordedEvent {
  return {
    type: 'audio/recorded',
    tenant_id,
    aggregate_id,
    audioBlob,
    duration: metadata.duration,
    format: metadata.format,
    sampleRate: metadata.sampleRate,
    channels: metadata.channels
  }
}

export function createAudioTranscribedEvent(
  tenant_id: string,
  aggregate_id: string,
  transcription: string,
  metadata: {
    confidence: number
    language: string
    processingTime: number
    originalAudioBlob: Blob
  }
): AudioTranscribedEvent {
  return {
    type: 'audio/transcribed',
    tenant_id,
    aggregate_id,
    transcription,
    confidence: metadata.confidence,
    language: metadata.language,
    processingTime: metadata.processingTime,
    originalAudioBlob: metadata.originalAudioBlob
  }
}

export function createAudioGenerationFailedEvent(
  tenant_id: string,
  aggregate_id: string,
  errorType: 'whisper' | 'elevenlabs' | 'network' | 'authentication',
  errorMessage: string,
  originalEvent: string,
  fallbackText?: string
): AudioGenerationFailedEvent {
  return {
    type: 'audio/generation-failed',
    tenant_id,
    aggregate_id,
    errorType,
    errorMessage,
    originalEvent,
    fallbackText
  }
}

export function createTermAssignedEvent(
  tenant_id: string,
  aggregate_id: string,
  term: string,
  metadata: {
    language: string
    context: 'feedback' | 'instruction' | 'celebration' | 'correction'
    priority: 'low' | 'medium' | 'high'
  }
): TermAssignedEvent {
  return {
    type: 'term/assigned',
    tenant_id,
    aggregate_id,
    term,
    language: metadata.language,
    context: metadata.context,
    priority: metadata.priority
  }
}

export function createFeedbackGeneratedEvent(
  tenant_id: string,
  aggregate_id: string,
  feedback: string,
  metadata: {
    feedbackType: 'positive' | 'negative' | 'neutral' | 'instructional'
    language: string
    emotionalTone: 'encouraging' | 'neutral' | 'corrective'
  }
): FeedbackGeneratedEvent {
  return {
    type: 'feedback/generated',
    tenant_id,
    aggregate_id,
    feedback,
    feedbackType: metadata.feedbackType,
    language: metadata.language,
    emotionalTone: metadata.emotionalTone
  }
}

export function createAudioReadyEvent(
  tenant_id: string,
  aggregate_id: string,
  audioBlob: Blob,
  text: string,
  metadata: {
    voiceId: string
    duration: number
    format: 'mp3' | 'wav' | 'ogg'
    model: string
  }
): AudioReadyEvent {
  return {
    type: 'audio/ready',
    tenant_id,
    aggregate_id,
    audioBlob,
    text,
    voiceId: metadata.voiceId,
    duration: metadata.duration,
    format: metadata.format,
    model: metadata.model
  }
}

export function createAudioPlayedEvent(
  tenant_id: string,
  aggregate_id: string,
  audioId: string,
  metadata: {
    duration: number
    playbackTime: number
  }
): AudioPlayedEvent {
  return {
    type: 'audio/played',
    tenant_id,
    aggregate_id,
    audioId,
    duration: metadata.duration,
    playbackTime: metadata.playbackTime
  }
}

export function createVoiceSettingsUpdatedEvent(
  tenant_id: string,
  aggregate_id: string,
  voiceId: string,
  metadata: {
    language: string
    voiceProvider: 'elevenlabs' | 'openai' | 'custom'
    settings: {
      stability: number
      similarity_boost: number
      style: string
      use_speaker_boost: boolean
    }
  }
): VoiceSettingsUpdatedEvent {
  return {
    type: 'voice/settings-updated',
    tenant_id,
    aggregate_id,
    voiceId,
    language: metadata.language,
    voiceProvider: metadata.voiceProvider,
    settings: metadata.settings
  }
}
