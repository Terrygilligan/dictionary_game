import type { LexiconEntry } from './types'
import { loadMasterLexicon } from './lexiconLoader'

/**
 * LexiconCache - Memoized cache for language data loading
 * 
 * This singleton cache prevents redundant I/O operations by storing
 * the loading Promise for each language code. By caching the Promise
 * itself (not just the resolved data), we ensure that concurrent
 * calls for the same language return the same pending Promise,
 * preventing cache stampedes and race conditions.
 * 
 * Architecture Notes:
 * - Zero side effects: Pure data provider
 * - Singleton pattern: Single instance exported
 * - Concurrency safe: Caches Promise, not just result
 * - Domain model purity: Deciders unaware of cache
 * 
 * @example
 * // Pre-fetch data without awaiting
 * LexiconCache.preFetch('en')
 * 
 * // Load data (uses cached promise if available)
 * const lexicon = await LexiconCache.getOrLoad('en')
 */
class LexiconCacheInternal {
  private cache: Map<string, Promise<readonly LexiconEntry[]>> = new Map()

  /**
   * Get or load lexicon data for a specific language
   * 
   * This method checks if a loading Promise already exists for the
   * given language. If it does, it returns that Promise. If not,
   * it initiates the load and caches the Promise before returning it.
   * 
   * By caching the Promise itself, we ensure that:
   * - Concurrent calls for the same language return the same Promise
   * - The JSON file is loaded exactly once per language
   * - Race conditions are prevented (user clicks "Play" while loading)
   * 
   * @param languageCode - The language code (e.g., 'en', 'bg', 'nl')
   * @returns Promise that resolves to the lexicon data for the language
   */
  async getOrLoad(languageCode: string): Promise<readonly LexiconEntry[]> {
    // Check if promise already exists for this language
    if (this.cache.has(languageCode)) {
      return this.cache.get(languageCode)!
    }

    // Create and cache the loading promise
    const loadPromise = this.loadLanguageData(languageCode)
    this.cache.set(languageCode, loadPromise)

    return loadPromise
  }

  /**
   * Pre-fetch lexicon data for a specific language without awaiting
   * 
   * This initiates the loading process but doesn't wait for completion.
   * Useful for warming up the cache when the user navigates to a screen
   * but before they interact with it.
   * 
   * @param languageCode - The language code to pre-fetch
   */
  preFetch(languageCode: string): void {
    // Don't await - just initiate the loading process
    this.getOrLoad(languageCode)
  }

  /**
   * Clear cached data for a specific language or all languages
   * 
   * Use this to force a reload of language data (e.g., after updates).
   * 
   * @param languageCode - Optional language code to clear. If not provided, clears all.
   */
  clear(languageCode?: string): void {
    if (languageCode) {
      this.cache.delete(languageCode)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Check if data for a language is currently cached
   * 
   * @param languageCode - The language code to check
   * @returns true if the language data is cached (loading or loaded)
   */
  has(languageCode: string): boolean {
    return this.cache.has(languageCode)
  }

  /**
   * Get the current cache size (number of languages cached)
   * 
   * @returns Number of languages currently in cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Load language data from the source
   * 
   * This is a private method that performs the actual I/O operation.
   * It's called by getOrLoad when the data is not already cached.
   * 
   * @param languageCode - The language code to load
   * @returns Promise that resolves to the lexicon data
   */
  private async loadLanguageData(languageCode: string): Promise<readonly LexiconEntry[]> {
    try {
      // Load the master lexicon data
      const lexiconData = await loadMasterLexicon()
      
      // Note: Currently we load the full master lexicon for all languages.
      // In the future, this could be extended to load language-specific
      // subsets if the data structure changes to support per-language files.
      return lexiconData
    } catch (error) {
      // Remove the failed promise from cache to allow retry
      this.cache.delete(languageCode)
      throw error
    }
  }
}

// Export singleton instance
const cacheInstance = new LexiconCacheInternal()
export const LexiconCache = cacheInstance
