/**
 * Cross-platform game utilities for BallerCast
 * Contains game ID generation, UUID conversion, and core game logic
 * @package @ballercast/shared-core
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { GameState, createDefaultGameState } from '../types/gameState';

// Simple hash function to convert gameID to UUID
function hashGameIdToUuid(gameId: string): string {
  let hash = 0;
  for (let i = 0; i < gameId.length; i++) {
    const char = gameId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert hash to positive number and create UUID format
  const positiveHash = Math.abs(hash);
  const hashStr = positiveHash.toString(16).padStart(8, '0');

  // Create a deterministic UUID from the hash
  const uuid = [
    hashStr.substring(0, 8),
    hashStr.substring(0, 4),
    '4' + hashStr.substring(1, 4), // Version 4 UUID
    '8' + hashStr.substring(1, 4), // Variant bits
    hashStr.substring(0, 12)
  ].join('-');

  return uuid;
}

export interface FirebaseUtilsConfig {
  app: FirebaseApp;
}

export class GameUtils {
  private static config: FirebaseUtilsConfig | null = null;

  /**
   * Initialize Firebase utils with app instance
   */
  static initialize(config: FirebaseUtilsConfig) {
    this.config = config;
  }

  /**
   * Get the initialized Firestore instance
   */
  private static getFirestore() {
    if (!this.config) {
      throw new Error('FirebaseUtils not initialized. Call FirebaseUtils.initialize() first.');
    }
    return getFirestore(this.config.app);
  }

  /**
   * Test Firebase connection by attempting to read from Firestore
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getFirestore();
      const testCollection = collection(db, 'test');
      const q = query(testCollection, limit(1));
      await getDocs(q);

      console.log('Firebase connection test successful');
      return { success: true };
    } catch (error) {
      console.error('Firebase connection test failed:', error);

      // Provide more helpful error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('No Firebase App')) {
          errorMessage = 'Firebase app not initialized. Check your configuration files.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Check your internet connection.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Check your Firestore security rules.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate a 6-character game ID (uppercase letters and numbers)
   */
  static generateGameId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Convert gameID to UUID using deterministic hash
   */
  static gameIdToUuid(gameId: string): string {
    return hashGameIdToUuid(gameId);
  }

  /**
   * Initialize a game session in Firestore using gameID and UUID
   */
  static async createGameSession(gameId?: string) {
    try {
      const db = this.getFirestore();

      // Generate gameID if not provided
      const sessionGameId = gameId || this.generateGameId();
      const sessionUuid = this.gameIdToUuid(sessionGameId);

      const gameRef = doc(db, 'games', sessionUuid);

      // Create a default game state using the new interface
      const defaultGameState = createDefaultGameState(sessionUuid);

      await setDoc(gameRef, {
        ...defaultGameState,
        gameId: sessionGameId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true, gameId: sessionGameId, uuid: sessionUuid };
    } catch (error) {
      console.error('Failed to create game session:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update game state in Firestore
   */
  static async updateGameState(sessionUuid: string, gameState: Partial<GameState>) {
    try {
      const db = this.getFirestore();
      const gameRef = doc(db, 'games', sessionUuid);

      await updateDoc(gameRef, {
        ...gameState,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update game state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Listen to game state changes
   */
  static subscribeToGameState(sessionUuid: string, callback: (gameState: GameState) => void) {
    const db = this.getFirestore();
    const gameRef = doc(db, 'games', sessionUuid);

    return onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        const gameState = doc.data() as GameState;
        callback(gameState);
      }
    }, (error) => {
      console.error('Error listening to game state:', error);
    });
  }

  /**
   * Get current game state by UUID
   */
  static async getGameState(sessionUuid: string) {
    try {
      const db = this.getFirestore();
      const gameRef = doc(db, 'games', sessionUuid);
      const docSnap = await getDoc(gameRef);

      if (docSnap.exists()) {
        const gameState = docSnap.data() as GameState;
        return { success: true, data: gameState };
      } else {
        return { success: false, error: 'Game session not found' };
      }
    } catch (error) {
      console.error('Failed to get game state:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current game state by gameID
   */
  static async getGameStateByGameId(gameId: string) {
    const uuid = this.gameIdToUuid(gameId);
    return this.getGameState(uuid);
  }

  /**
   * Update game state by gameID
   */
  static async updateGameStateByGameId(gameId: string, gameState: Partial<GameState>) {
    const uuid = this.gameIdToUuid(gameId);
    return this.updateGameState(uuid, gameState);
  }

  /**
   * Subscribe to game state changes by gameID
   */
  static subscribeToGameStateByGameId(gameId: string, callback: (gameState: GameState) => void) {
    const uuid = this.gameIdToUuid(gameId);
    return this.subscribeToGameState(uuid, callback);
  }

  /**
   * Generate a new UUID for game sessions (deprecated - use generateGameId instead)
   * @deprecated Use generateGameId() and gameIdToUuid() instead
   */
  static generateSessionUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }
}