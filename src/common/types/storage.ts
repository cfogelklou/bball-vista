/**
 * Shared types for game storage
 */

export interface SavedGame {
  gameId: string;
  sessionUuid: string;
  lastActive: number;
  homeScore: number;
  awayScore: number;
  period: number;
  createdAt: number;
}