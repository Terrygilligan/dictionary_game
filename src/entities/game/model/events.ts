import type { RoundSpec } from './types.ts'

/**
 * Base interface for all game events with explicit multi-tenant isolation
 * Following Event-Driven Architecture Blueprint compliance
 */
export interface BaseGameEvent {
  /** Unique identifier for the tenant (user, organization, etc.) */
  readonly tenant_id: string
  /** Unique identifier for the aggregate (game session, entity instance) */
  readonly aggregate_id: string
  /** Type discriminator for the specific event */
  readonly type: string
}

/**
 * The immutable facts of a game. The event log is the single source of truth;
 * {@link GameState} is derived by folding these through the evolver.
 * 
 * All events now explicitly include tenant_id and aggregate_id for multi-tenant isolation.
 */
export type GameEvent =
  | BaseGameEvent & { 
      readonly type: 'game/started'
      readonly deck: readonly RoundSpec[]
    }
  | BaseGameEvent & {
      readonly type: 'answer/submitted'
      readonly roundIndex: number
      readonly choiceId: string
      readonly correct: boolean
    }
  | BaseGameEvent & {
      readonly type: 'round/advanced'
      readonly toRoundIndex: number
    }
  | BaseGameEvent & {
      readonly type: 'streak/updated'
      readonly streak: number
    }
  | BaseGameEvent & {
      readonly type: 'language/changed'
      readonly language: string
    }
  | BaseGameEvent & {
      readonly type: 'game/finished'
      readonly correct: number
      readonly total: number
    }
  | BaseGameEvent & {
      readonly type: 'difficulty/adjusted'
      readonly newDifficulty: number
      readonly previousDifficulty: number
      readonly performanceScore: number
      readonly adjustmentReason: string
      readonly timestamp: number
    }
  | BaseGameEvent & {
      readonly type: 'audio/recorded'
      readonly audioBlob: Blob
      readonly duration: number
      readonly format: 'webm' | 'wav' | 'mp3' | 'ogg'
      readonly sampleRate: number
      readonly channels: number
    }
  | BaseGameEvent & {
      readonly type: 'audio/transcribed'
      readonly transcription: string
      readonly confidence: number
      readonly language: string
      readonly processingTime: number
      readonly originalAudioBlob: Blob
    }
  | BaseGameEvent & {
      readonly type: 'audio/generation-failed'
      readonly errorType: 'whisper' | 'elevenlabs' | 'network' | 'authentication'
      readonly errorMessage: string
      readonly originalEvent: string
      readonly fallbackText?: string
    }
  | BaseGameEvent & {
      readonly type: 'term/assigned'
      readonly term: string
      readonly language: string
      readonly context: 'feedback' | 'instruction' | 'celebration' | 'correction'
      readonly priority: 'low' | 'medium' | 'high'
    }
  | BaseGameEvent & {
      readonly type: 'feedback/generated'
      readonly feedback: string
      readonly feedbackType: 'positive' | 'negative' | 'neutral' | 'instructional'
      readonly language: string
      readonly emotionalTone: 'encouraging' | 'neutral' | 'corrective'
    }
  | BaseGameEvent & {
      readonly type: 'audio/ready'
      readonly audioBlob: Blob
      readonly text: string
      readonly voiceId: string
      readonly duration: number
      readonly format: 'mp3' | 'wav' | 'ogg'
      readonly model: string
    }
  | BaseGameEvent & {
      readonly type: 'audio/played'
      readonly audioId: string
      readonly duration: number
      readonly playbackTime: number
    }
  | BaseGameEvent & {
      readonly type: 'voice/settings-updated'
      readonly voiceId: string
      readonly language: string
      readonly voiceProvider: 'elevenlabs' | 'openai' | 'custom'
      readonly settings: {
        readonly stability: number
        readonly similarity_boost: number
        readonly style: string
        readonly use_speaker_boost: boolean
      }
    }
  | BaseGameEvent & {
      readonly type: 'game/reset'
      readonly reason: 'session-expired' | 'manual-reset' | 'navigation-change'
    }

export type GameEventType = GameEvent['type']
