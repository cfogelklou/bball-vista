/**
 * Firebase Firestore utility functions for BallerCast Web App
 * This is a wrapper around the common GameUtils class to provide
 * web-specific Firebase configuration.
 */

import { getApp } from 'firebase/app';
import { GameUtils } from '@common/utils/gameUtils';
import { GameState } from '@common/types/gameState';

// Initialize GameUtils with the Firebase app instance
const initializeGameUtils = () => {
  try {
    const app = getApp();
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