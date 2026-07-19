import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('GUEST_SESSION');

/**
 * Guest Session Service
 * 
 * Manages guest play sessions with local-only tracking.
 * Prevents abuse by limiting guest play to 5 games per session.
 * No Firestore writes - all state is local (localStorage).
 */
export class GuestSessionService {
  private static readonly STORAGE_KEY = 'guest_session_games_played';
  private static readonly MAX_GUEST_GAMES = 5;
  private gamesPlayed: number = 0;

  constructor() {
    this.loadSession();
  }

  /**
   * Load guest session from localStorage
   */
  private loadSession(): void {
    try {
      const stored = localStorage.getItem(GuestSessionService.STORAGE_KEY);
      this.gamesPlayed = stored ? parseInt(stored, 10) : 0;
      logger.log('Guest session loaded', { gamesPlayed: this.gamesPlayed });
    } catch (error) {
      logger.error('Failed to load guest session from localStorage', error);
      this.gamesPlayed = 0;
    }
  }

  /**
   * Save guest session to localStorage
   */
  private saveSession(): void {
    try {
      localStorage.setItem(GuestSessionService.STORAGE_KEY, this.gamesPlayed.toString());
      logger.log('Guest session saved', { gamesPlayed: this.gamesPlayed });
    } catch (error) {
      logger.error('Failed to save guest session to localStorage', error);
    }
  }

  /**
   * Check if guest can start a new game
   */
  canStartGame(): boolean {
    const canStart = this.gamesPlayed < GuestSessionService.MAX_GUEST_GAMES;
    logger.log('Guest game start check', { 
      gamesPlayed: this.gamesPlayed, 
      maxGames: GuestSessionService.MAX_GUEST_GAMES,
      canStart 
    });
    return canStart;
  }

  /**
   * Record that a guest game has been played
   */
  recordGamePlayed(): void {
    this.gamesPlayed++;
    this.saveSession();
    logger.log('Guest game recorded', { 
      gamesPlayed: this.gamesPlayed, 
      maxGames: GuestSessionService.MAX_GUEST_GAMES 
    });
  }

  /**
   * Get the number of games played by the guest
   */
  getGamesPlayed(): number {
    return this.gamesPlayed;
  }

  /**
   * Get the maximum number of games allowed for guests
   */
  getMaxGames(): number {
    return GuestSessionService.MAX_GUEST_GAMES;
  }

  /**
   * Get the number of remaining games for the guest
   */
  getRemainingGames(): number {
    return Math.max(0, GuestSessionService.MAX_GUEST_GAMES - this.gamesPlayed);
  }

  /**
   * Reset the guest session (call when guest signs in or session ends)
   */
  resetSession(): void {
    this.gamesPlayed = 0;
    this.saveSession();
    logger.log('Guest session reset');
  }

  /**
   * End the guest session and clear localStorage
   */
  endSession(): void {
    this.gamesPlayed = 0;
    try {
      localStorage.removeItem(GuestSessionService.STORAGE_KEY);
      logger.log('Guest session ended and cleared');
    } catch (error) {
      logger.error('Failed to clear guest session from localStorage', error);
    }
  }
}

// Export singleton instance for app-wide use
export const guestSessionService = new GuestSessionService();
