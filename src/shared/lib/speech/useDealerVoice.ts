import { useEffect, useRef } from 'react'

// Types for the speech hook
interface SpeechEvent {
  text: string
  priority?: number
}

interface SpeechQueue {
  events: SpeechEvent[]
  isSpeaking: boolean
}

/**
 * useDealerVoice Hook
 * 
 * Provides text-to-speech functionality for the Dictionary Game dealer.
 * Uses Web Speech API to announce phase changes and game events.
 * Implements a queue system to prevent overlapping speech.
 */
export function useDealerVoice(gameState: any, eventLog: any[] = []) {
  const queueRef = useRef<SpeechQueue>({
    events: [],
    isSpeaking: false
  })

  const speechSynthesis = window.speechSynthesis

  // Phase-to-speech mapping
  const phaseAnnouncements: Record<string, string> = {
    idle: "Welcome to the Dictionary Game. Press Start to begin.",
    scroll: "Flicking through dictionary sections...",
    page: "Section locked. Select your page side.",
    column: "Page locked. Choose your column.",
    wordNumber: "Column locked. Enter the approximate word number.",
    ready: "Coordinates locked. Ready to seal the word.",
    sealed: "Word sealed. The Dealer is ready.",
    revealed: "Word revealed!"
  }

  // Add speech event to queue
  const enqueueSpeech = (text: string, priority: number = 1) => {
    queueRef.current.events.push({ text, priority })
    processQueue()
  }

  // Process the speech queue
  const processQueue = () => {
    if (queueRef.current.isSpeaking || queueRef.current.events.length === 0) {
      return
    }

    // Sort by priority (higher priority first)
    queueRef.current.events.sort((a, b) => (b.priority || 1) - (a.priority || 1))
    
    const event = queueRef.current.events.shift()
    if (!event) return

    queueRef.current.isSpeaking = true

    const utterance = new SpeechSynthesisUtterance(event.text)
    utterance.rate = 0.9 // Slightly slower for clarity
    utterance.pitch = 1.0
    utterance.volume = 0.8

    utterance.onend = () => {
      queueRef.current.isSpeaking = false
      // Process next event after a short delay
      setTimeout(processQueue, 100)
    }

    utterance.onerror = () => {
      queueRef.current.isSpeaking = false
      setTimeout(processQueue, 100)
    }

    speechSynthesis.speak(utterance)
  }

  // Speak immediately (high priority)
  const speakNow = (text: string) => {
    // Cancel current speech and clear queue for immediate announcements
    speechSynthesis.cancel()
    queueRef.current.events = []
    queueRef.current.isSpeaking = false
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    speechSynthesis.speak(utterance)
  }

  // Monitor game state changes
  useEffect(() => {
    if (!gameState || !gameState.phase) return

    const currentPhase = gameState.phase
    const announcement = phaseAnnouncements[currentPhase]

    if (announcement) {
      enqueueSpeech(announcement, 1)
    }
  }, [gameState?.phase])

  // Monitor event log for specific events
  useEffect(() => {
    if (!eventLog || eventLog.length === 0) return

    const latestEvent = eventLog[eventLog.length - 1]
    
    // Announce specific events
    switch (latestEvent?.type) {
      case 'scroll/selected':
        enqueueSpeech("Section selected.", 2)
        break
      case 'page/selected':
        enqueueSpeech("Page selected.", 2)
        break
      case 'column/selected':
        enqueueSpeech("Column selected.", 2)
        break
      case 'wordNumber/selected':
        enqueueSpeech("Word number selected.", 2)
        break
      case 'word/sealed':
        enqueueSpeech("Word sealed successfully.", 3)
        break
      case 'word/revealed':
        // Higher priority for word reveal
        if (latestEvent.payload?.word) {
          speakNow(`The word is: ${latestEvent.payload.word}`)
        }
        break
    }
  }, [eventLog])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel()
    }
  }, [])

  return {
    speakNow,
    enqueueSpeech,
    isSupported: 'speechSynthesis' in window
  }
}
