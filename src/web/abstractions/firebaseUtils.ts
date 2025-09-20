/**
 * Firebase Firestore utility functions for BallerCast Web App
 * This is a wrapper around the common GameUtils class to provide
 * web-specific Firebase configuration.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, User } from 'firebase/auth';
import { GameUtils } from '@common/utils/gameUtils';
import { GameState } from '@common/types/gameState';

// Import Firebase configuration from the config file
import '../../firebase/config';

// Initialize GameUtils with the Firebase app instance
const initializeGameUtils = () => {
  try {
    // Use the Firebase app that was already initialized by config.ts
    const app = getApps()[0];
    if (!app) {
      throw new Error('Firebase app not initialized. Make sure config.ts is imported first.');
    }
    GameUtils.initialize({ app });
  } catch (error) {
    console.error('Failed to initialize GameUtils with Firebase app:', error);
  }
};

// Initialize on module load
initializeGameUtils();

/**
 * Web-specific wrapper around common GameUtils
 * Delegates all functionality to the common GameUtils class
 */
export class FirebaseUtils {
  /**
   * Ensure user is authenticated (sign in anonymously if needed)
   * Only authenticates for control apps (PWA), not receiver apps
   */
  static async ensureAuthenticated(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if this is a receiver app (read-only) vs control app (PWA)
      // Receivers typically don't have DOM elements like buttons for game control
      const isReceiverApp = !document.querySelector('[data-testid="button"]') &&
                           !document.querySelector('button');

      if (isReceiverApp) {
        console.log('🔐 Receiver app detected - skipping authentication (read-only mode)');
        return { success: true };
      }

      const app = getApps()[0];
      if (!app) {
        throw new Error('Firebase app not initialized');
      }

      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      console.log('🔐 PWA - Current user before auth check:', currentUser ? 'User exists' : 'No user');

      if (!currentUser) {
        console.log('🔐 PWA - No authenticated user, signing in anonymously...');
        const userCredential = await signInAnonymously(auth);
        console.log('🔐 PWA - Anonymous authentication successful:', userCredential.user.uid);
        console.log('🔐 PWA - User is anonymous:', userCredential.user.isAnonymous);
      } else {
        console.log('🔐 PWA - User already authenticated:', currentUser.uid);
        console.log('🔐 PWA - User is anonymous:', currentUser.isAnonymous);
      }

      // Double-check authentication worked
      const finalUser = auth.currentUser;
      if (!finalUser) {
        throw new Error('Authentication completed but no user found');
      }

      console.log('🔐 PWA - Final auth check - User ID:', finalUser.uid);
      return { success: true };
    } catch (error) {
      console.error('🔐 Authentication failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }
  /**
   * Test Firebase connection by attempting to read from Firestore
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    return GameUtils.testConnection();
  }

  /**
   * Generate a 6-character game ID (uppercase letters and numbers)
   */
  static generateGameId(): string {
    return GameUtils.generateGameId();
  }

  /**
   * Convert gameID to UUID using deterministic hash
   */
  static gameIdToUuid(gameId: string): string {
    return GameUtils.gameIdToUuid(gameId);
  }

  /**
   * Initialize a game session in Firestore using gameID and UUID
   */
  static async createGameSession(gameId?: string) {
    return GameUtils.createGameSession(gameId);
  }

  /**
   * Update game state in Firestore
   */
  static async updateGameState(sessionUuid: string, gameState: Partial<GameState>) {
    return GameUtils.updateGameState(sessionUuid, gameState);
  }

  /**
   * Listen to game state changes
   */
  static subscribeToGameState(sessionUuid: string, callback: (gameState: GameState) => void) {
    return GameUtils.subscribeToGameState(sessionUuid, callback);
  }

  /**
   * Get current game state by UUID
   */
  static async getGameState(sessionUuid: string) {
    return GameUtils.getGameState(sessionUuid);
  }

  /**
   * Get current game state by gameID
   */
  static async getGameStateByGameId(gameId: string) {
    return GameUtils.getGameStateByGameId(gameId);
  }

  /**
   * Update game state by gameID
   */
  static async updateGameStateByGameId(gameId: string, gameState: Partial<GameState>) {
    return GameUtils.updateGameStateByGameId(gameId, gameState);
  }

  /**
   * Subscribe to game state changes by gameID
   */
  static subscribeToGameStateByGameId(gameId: string, callback: (gameState: GameState) => void) {
    return GameUtils.subscribeToGameStateByGameId(gameId, callback);
  }

  /**
   * Generate a new UUID for game sessions (deprecated - use generateGameId instead)
   * @deprecated Use generateGameId() and gameIdToUuid() instead
   */
  static generateSessionUuid(): string {
    return GameUtils.generateSessionUuid();
  }
}