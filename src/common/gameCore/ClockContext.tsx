/**
 * @file ClockContext.tsx
 * @description This file provides a React context for managing and displaying local clock timers
 * that are synchronized with the master game state from Firebase. This allows for a smooth
 * countdown on the UI while Firebase remains the single source of truth.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { startLocalClock, stopLocalClock, getElapsedTime } from './clockUtils';
import { useGame } from '../../../../mySrc/contexts/GameContext';
import { GameState } from '../types/gameState';

/**
 * @interface ClockContextState
 * @description Defines the shape of the context provided to consumers.
 */
interface ClockContextState {
  /**
   * A function that returns the current display time for a given clock.
   * This will be the locally calculated time if the clock is running, or the
   * time from Firebase if it is stopped.
   * @param clockId - The identifier for the clock ('periodClock' or 'shotClock').
   * @returns The time in milliseconds.
   */
  getDisplayTime: (clockId: 'periodClock' | 'shotClock') => number;

  /**
   * A function to be called when a clock's "STOP" button is pressed.
   * It calculates the elapsed time and sends an update to Firebase.
   * @param clockId - The identifier for the clock to stop.
   */
  handleStopClock: (clockId: 'periodClock' | 'shotClock') => void;
}

const ClockContext = createContext<ClockContextState | null>(null);

/**
 * @component ClockProvider
 * @description A React component that provides the ClockContext to its children.
 * It manages the local clock timers and their synchronization with the game state.
 * It should be placed as a child of the `GameProvider`.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to render.
 */
export function ClockProvider({ children }: { children: ReactNode }) {
  const { currentGame, updateGameState } = useGame();
  const [gameClockTime, setGameClockTime] = useState(0);
  const [shotClockTime, setShotClockTime] = useState(0);

  // This effect is the core of the synchronization logic.
  // It runs whenever the `currentGame` state from Firebase changes.
  useEffect(() => {
    if (!currentGame) return;

    const { periodClock, shotClock } = currentGame;

    // Synchronize the game clock
    if (periodClock.startTime > 0) {
      // If startTime is non-zero, the clock is running. Start a local timer.
      startLocalClock('gameClock', periodClock.startTime, periodClock.msRemaining, setGameClockTime);
    } else {
      // If startTime is zero, the clock is stopped. Stop the local timer and set the display time to the value from Firebase.
      stopLocalClock('gameClock');
      setGameClockTime(periodClock.msRemaining);
    }

    // Synchronize the shot clock
    if (shotClock.startTime > 0) {
      startLocalClock('shotClock', shotClock.startTime, shotClock.msRemaining, setShotClockTime);
    } else {
      stopLocalClock('shotClock');
      setShotClockTime(shotClock.msRemaining);
    }

    // Cleanup function to stop timers when the component unmounts or `currentGame` changes.
    return () => {
      stopLocalClock('gameClock');
      stopLocalClock('shotClock');
    };
  }, [currentGame]);

  /**
   * Returns the appropriate display time for the given clock.
   */
  const getDisplayTime = (clockId: 'periodClock' | 'shotClock') => {
    return clockId === 'periodClock' ? gameClockTime : shotClockTime;
  };

  /**
   * Handles the logic for stopping a clock.
   */
  const handleStopClock = (clockId: 'periodClock' | 'shotClock') => {
    if (!currentGame) return;

    const clock = clockId === 'periodClock' ? currentGame.periodClock : currentGame.shotClock;
    if (clock.startTime === 0) return; // Clock is not running

    // Calculate the time that has passed since the clock was started.
    const elapsedTime = getElapsedTime(clock.startTime);
    const newRemainingTime = Math.max(0, clock.msRemaining - elapsedTime);

    // Prepare the update to be sent to Firebase.
    const updates: Partial<GameState> = {
      [clockId]: {
        ...clock,
        startTime: 0, // Set startTime to 0 to indicate the clock is stopped.
        msRemaining: newRemainingTime,
      },
    };

    // Send the update to Firebase. The local state will be updated via the subscription in `useEffect`.
    updateGameState(updates);
  };

  const value = {
    getDisplayTime,
    handleStopClock,
  };

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}

/**
 * @hook useLocalClock
 * @description A custom hook for consuming the ClockContext.
 * It provides an easy way for components to access the local clock state and functions.
 * @returns The ClockContext state.
 * @throws An error if used outside of a `ClockProvider`.
 */
export function useLocalClock() {
  const context = useContext(ClockContext);
  if (!context) {
    throw new Error('useLocalClock must be used within a ClockProvider');
  }
  return context;
}
