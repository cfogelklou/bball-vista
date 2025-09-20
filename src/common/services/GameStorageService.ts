/**
 * Game Storage Service for persisting owned games using storage abstraction
 */

import { StorageUtils } from '@abstractions/storage';
import { SavedGame } from '@common/types/storage';
import { GameState } from '@common/types/gameState';

const SAVED_GAMES_KEY = '@ballercast_saved_games';

export class GameStorageService {
  /**
   * Get all saved games from storage
   */
  static async getSavedGames(): Promise<SavedGame[]> {
    try {
      const gamesJson = await StorageUtils.getItem(SAVED_GAMES_KEY);
      if (!gamesJson) {
        return [];
      }

      const games: SavedGame[] = JSON.parse(gamesJson);
      // Sort by lastActive descending (most recent first)
      return games.sort((a, b) => b.lastActive - a.lastActive);
    } catch (error) {
      console.error('Error loading saved games:', error);
      return [];
    }
  }

  /**
   * Save a new game to storage
   */
  static async saveGame(gameId: string, sessionUuid: string, gameState?: GameState): Promise<void> {
    try {
      const existingGames = await this.getSavedGames();

      // Remove existing game with same ID if it exists
      const filteredGames = existingGames.filter(game => game.gameId !== gameId);

      // Create new saved game entry
      const savedGame: SavedGame = {
        gameId,
        sessionUuid,
        lastActive: Date.now(),
        homeScore: gameState?.home.score || 0,
        awayScore: gameState?.away.score || 0,
        period: gameState?.period || 1,
        createdAt: gameState?.timestampUtcGameStartedMs || Date.now(),
      };

      // Add to beginning of array (most recent)
      const updatedGames = [savedGame, ...filteredGames];

      // Keep only the most recent 20 games
      const trimmedGames = updatedGames.slice(0, 20);

      await StorageUtils.setItem(SAVED_GAMES_KEY, JSON.stringify(trimmedGames));
    } catch (error) {
      console.error('Error saving game:', error);
      throw error;
    }
  }

  /**
   * Update an existing saved game with current state
   */
  static async updateGame(gameId: string, gameState: GameState): Promise<void> {
    try {
      const existingGames = await this.getSavedGames();
      const gameIndex = existingGames.findIndex(game => game.gameId === gameId);

      if (gameIndex !== -1) {
        // Update existing game
        existingGames[gameIndex] = {
          ...existingGames[gameIndex],
          lastActive: Date.now(),
          homeScore: gameState.home.score,
          awayScore: gameState.away.score,
          period: gameState.period,
        };

        // Re-sort by lastActive
        const sortedGames = existingGames.sort((a, b) => b.lastActive - a.lastActive);

        await StorageUtils.setItem(SAVED_GAMES_KEY, JSON.stringify(sortedGames));
      }
    } catch (error) {
      console.error('Error updating game:', error);
    }
  }

  /**
   * Remove a game from saved games
   */
  static async removeGame(gameId: string): Promise<void> {
    try {
      const existingGames = await this.getSavedGames();
      const filteredGames = existingGames.filter(game => game.gameId !== gameId);

      await StorageUtils.setItem(SAVED_GAMES_KEY, JSON.stringify(filteredGames));
    } catch (error) {
      console.error('Error removing game:', error);
      throw error;
    }
  }

  /**
   * Clear all saved games (for debugging/reset)
   */
  static async clearAllGames(): Promise<void> {
    try {
      await StorageUtils.removeItem(SAVED_GAMES_KEY);
    } catch (error) {
      console.error('Error clearing all games:', error);
      throw error;
    }
  }

  /**
   * Get a specific saved game by gameId
   */
  static async getSavedGame(gameId: string): Promise<SavedGame | null> {
    try {
      const games = await this.getSavedGames();
      return games.find(game => game.gameId === gameId) || null;
    } catch (error) {
      console.error('Error getting saved game:', error);
      return null;
    }
  }
}