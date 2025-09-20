/**
 * Game Context for managing global GameState and Firebase synchronization
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { GameState, createDefaultGameState } from '@common/types/gameState';
import { FirebaseUtils } from '@abstractions/firebaseUtils';
import { GameStorageService } from '@common/services/GameStorageService';

// Context State Interface
interface GameContextState {
  // Current game state
  currentGame: GameState | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Current session info
  currentGameId: string | null;
  currentSessionUuid: string | null;

  // Actions
  createNewGame: (gameId?: string) => Promise<{ success: boolean; error?: string }>;
  loadGame: (gameId: string) => Promise<{ success: boolean; error?: string }>;
  updateGameState: (updates: Partial<GameState>) => Promise<{ success: boolean; error?: string }>;
  disconnectFromGame: () => void;

  // Real-time status
  lastUpdateTime: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

// Action Types
type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connecting' | 'connected' | 'disconnected' | 'error' }
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'SET_CURRENT_SESSION'; payload: { gameId: string; sessionUuid: string } }
  | { type: 'CLEAR_CURRENT_SESSION' }
  | { type: 'UPDATE_LAST_UPDATE_TIME' };

// Reducer
function gameReducer(state: Omit<GameContextState, 'createNewGame' | 'loadGame' | 'updateGameState' | 'disconnectFromGame'>, action: GameAction): Omit<GameContextState, 'createNewGame' | 'loadGame' | 'updateGameState' | 'disconnectFromGame'> {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'SET_GAME_STATE':
      return {
        ...state,
        currentGame: action.payload,
        isConnected: true,
        lastUpdateTime: Date.now(),
        connectionStatus: 'connected',
        error: null,
      };

    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentGameId: action.payload.gameId,
        currentSessionUuid: action.payload.sessionUuid,
      };

    case 'CLEAR_CURRENT_SESSION':
      return {
        ...state,
        currentGame: null,
        currentGameId: null,
        currentSessionUuid: null,
        isConnected: false,
        connectionStatus: 'disconnected',
      };

    case 'UPDATE_LAST_UPDATE_TIME':
      return { ...state, lastUpdateTime: Date.now() };

    default:
      return state;
  }
}

// Initial State
const initialState: Omit<GameContextState, 'createNewGame' | 'loadGame' | 'updateGameState' | 'disconnectFromGame'> = {
  currentGame: null,
  isConnected: false,
  isLoading: false,
  error: null,
  currentGameId: null,
  currentSessionUuid: null,
  lastUpdateTime: 0,
  connectionStatus: 'disconnected',
};

// Context
const GameContext = createContext<GameContextState | null>(null);

// Provider Component
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Firebase listener cleanup function
  const firebaseCleanupRef = React.useRef<(() => void) | null>(null);

  // Create new game
  const createNewGame = useCallback(async (gameId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const result = await FirebaseUtils.createGameSession(gameId);

      if (result.success && result.gameId && result.uuid) {
        dispatch({
          type: 'SET_CURRENT_SESSION',
          payload: { gameId: result.gameId, sessionUuid: result.uuid },
        });

        // Save to local storage
        await GameStorageService.saveGame(result.gameId, result.uuid);

        return { success: true };
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create game' });
        return { success: false, error: result.error || 'Failed to create game' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load existing game
  const loadGame = useCallback(async (gameId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });

      // Clean up any existing Firebase listener
      if (firebaseCleanupRef.current) {
        firebaseCleanupRef.current();
        firebaseCleanupRef.current = null;
      }

      // Connect to Firebase by getting the game state
      const result = await FirebaseUtils.getGameStateByGameId(gameId);

      if (result.success && result.data) {
        const sessionUuid = FirebaseUtils.gameIdToUuid(gameId);
        dispatch({
          type: 'SET_CURRENT_SESSION',
          payload: { gameId, sessionUuid },
        });

        // Set the initial game state
        dispatch({ type: 'SET_GAME_STATE', payload: result.data });

        // Set up real-time listener
        firebaseCleanupRef.current = FirebaseUtils.subscribeToGameStateByGameId(gameId, (gameState) => {
          if (gameState) {
            dispatch({ type: 'SET_GAME_STATE', payload: gameState });
            
            // Update saved game with latest state
            GameStorageService.updateGame(gameId, gameState).catch(console.error);
          }
        });

        return { success: true };
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load game' });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
        return { success: false, error: result.error || 'Failed to load game' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Update game state
  const updateGameState = useCallback(async (updates: Partial<GameState>): Promise<{ success: boolean; error?: string }> => {
    if (!state.currentGameId) {
      return { success: false, error: 'No active game' };
    }

    try {
      // Ensure authentication before updating (automatically detects control vs receiver apps)
      const authResult = await FirebaseUtils.ensureAuthenticated();
      if (!authResult.success) {
        return { success: false, error: `Authentication failed: ${authResult.error}` };
      }

      const result = await FirebaseUtils.updateGameStateByGameId(state.currentGameId, updates);
      
      if (result.success) {
        dispatch({ type: 'UPDATE_LAST_UPDATE_TIME' });
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to update game state' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  }, [state.currentGameId]);

  // Disconnect from game
  const disconnectFromGame = useCallback(() => {
    // Clean up Firebase listener
    if (firebaseCleanupRef.current) {
      firebaseCleanupRef.current();
      firebaseCleanupRef.current = null;
    }

    dispatch({ type: 'CLEAR_CURRENT_SESSION' });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (firebaseCleanupRef.current) {
        firebaseCleanupRef.current();
      }
    };
  }, []);

  const contextValue: GameContextState = {
    ...state,
    createNewGame,
    loadGame,
    updateGameState,
    disconnectFromGame,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}