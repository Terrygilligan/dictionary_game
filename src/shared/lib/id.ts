/**
 * Deterministically-testable id generation. Uses `crypto.randomUUID` when
 * available and falls back to a counter-based id otherwise (e.g. non-secure
 * contexts). The generator can be swapped in tests via `setIdFactory`.
 */
let counter = 0
let factory: () => string = defaultFactory

function defaultFactory(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } }
  if (g.crypto?.randomUUID) return g.crypto.randomUUID()
  counter += 1
  return `id-${Date.now().toString(36)}-${counter.toString(36)}`
}

export function nextId(): string {
  return factory()
}

export function setIdFactory(next: () => string): void {
  factory = next
}

export function resetIdFactory(): void {
  factory = defaultFactory
  counter = 0
}
