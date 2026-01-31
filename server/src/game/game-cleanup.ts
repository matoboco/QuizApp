import { gameStateManager } from './game-state.manager';
import { gameRepository } from '../db/repositories';
import { getDb } from '../db/connection';

const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours
const FINISHED_CLEANUP_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

class GameCleanup {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Find game sessions older than 4 hours that are not finished,
   * mark them as finished in the database, and remove their in-memory state.
   */
  cleanupStaleGames(): number {
    const db = getDb();
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

    // Find all sessions that were created more than 4 hours ago and are not finished
    const staleSessions = db
      .prepare(
        `SELECT id FROM game_sessions
         WHERE status != 'finished'
           AND created_at < ?`
      )
      .all(cutoff) as { id: string }[];

    let cleaned = 0;
    for (const row of staleSessions) {
      try {
        // Mark as finished in DB
        gameRepository.updateStatus(row.id, 'finished', {
          finishedAt: new Date().toISOString(),
        });

        // Remove from in-memory state
        gameStateManager.removeGameState(row.id);

        cleaned++;
        console.log(`[game-cleanup] Cleaned up stale game session ${row.id}`);
      } catch (err) {
        console.error(`[game-cleanup] Error cleaning up session ${row.id}:`, err);
      }
    }

    if (cleaned > 0) {
      console.log(`[game-cleanup] Cleaned up ${cleaned} stale game session(s)`);
    }

    return cleaned;
  }

  /**
   * Remove in-memory state for a finished game after a delay (5 minutes).
   * Call this when a game transitions to the "finished" status.
   */
  cleanupFinishedGame(sessionId: string): void {
    setTimeout(() => {
      gameStateManager.removeGameState(sessionId);
      console.log(`[game-cleanup] Removed in-memory state for finished session ${sessionId}`);
    }, FINISHED_CLEANUP_DELAY_MS);
  }

  /**
   * Start the periodic cleanup interval (runs cleanupStaleGames every 30 minutes).
   */
  startCleanupInterval(): void {
    if (this.intervalId) {
      // Already running
      return;
    }

    console.log('[game-cleanup] Starting periodic cleanup (every 30 minutes)');
    this.intervalId = setInterval(() => {
      try {
        this.cleanupStaleGames();
      } catch (err) {
        console.error('[game-cleanup] Error during periodic cleanup:', err);
      }
    }, CLEANUP_INTERVAL_MS);

    // Run an initial cleanup on startup
    try {
      this.cleanupStaleGames();
    } catch (err) {
      console.error('[game-cleanup] Error during initial cleanup:', err);
    }
  }

  /**
   * Stop the periodic cleanup interval.
   */
  stopCleanupInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[game-cleanup] Stopped periodic cleanup');
    }
  }
}

export const gameCleanup = new GameCleanup();
