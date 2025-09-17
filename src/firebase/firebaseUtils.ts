/**
 * Firebase Firestore utility functions for BallerCast Web App
 */

import {
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
import { firestore } from './config';
import { GameState, createDefaultGameState } from '@common/types/gameState';

// Deterministically hash gameID to a valid UUID format using Web Crypto API
async function hashGameIdToUuid(gameId: string): Promise<string> {
  // Encode the input string as a Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(gameId);
  // Compute SHA-1 hash
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data); // 20 bytes
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // 40 hex chars
  // UUID format: 8-4-4-4-12
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4 UUID
    ((parseInt(hash.substring(16, 18), 16) & 0x3f | 0x80).toString(16)).padStart(2, '0') + hash.substring(18, 20), // Variant bits
    hash.substring(20, 32)
  ].join('-');
  return uuid;
}

export class FirebaseUtils {
  /**
   * Test Firebase connection by attempting to read from Firestore
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use the new modular API for Firebase operations
      const testCollection = collection(firestore, 'test');
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
      // Generate gameID if not provided
      const sessionGameId = gameId || this.generateGameId();
      const sessionUuid = this.gameIdToUuid(sessionGameId);

      const gameRef = doc(firestore, 'games', sessionUuid);

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
      const gameRef = doc(firestore, 'games', sessionUuid);

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
    const gameRef = doc(firestore, 'games', sessionUuid);

    return onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const gameState = docSnap.data() as GameState;
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
      const gameRef = doc(firestore, 'games', sessionUuid);
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