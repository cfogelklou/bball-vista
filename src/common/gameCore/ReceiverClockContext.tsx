/**
 * @file ReceiverClockContext.tsx
 * @description Receiver-specific clock context that works with Cast receiver game state
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { startLocalClock, stopLocalClock, getElapsedTime } from './clockUtils';
import { GameState } from '../types/gameState';
import clockSynchronizer from './clockSync';

interface ReceiverClockContextState {
  getDisplayTime: (clockId: 'periodClock' | 'shotClock') => number;
  getSyncStats: () => {
    sampleCount: number;
    averageDifference: number;
    latestDifference: number | null;
    latestDeviceId: string | null;
    standardDeviation: number;
    deviceStats: { [deviceId: string]: {
      sampleCount: number;
      averageDifference: number;
      latestDifference: number;
      standardDeviation: number;
      lastSeen: number;
    } };
  };
}

const ReceiverClockContext = createContext<ReceiverClockContextState | null>(null);

export function ReceiverClockProvider({
  children,
  gameState
}: {
  children: ReactNode;
  gameState: GameState;
}) {
  const [gameClockTime, setGameClockTime] = useState(0);
  const [shotClockTime, setShotClockTime] = useState(0);

  // Track previous state to detect transitions from stopped to running
  const previousGameStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    if (!gameState) return;

    const { periodClock, shotClock } = gameState;
    const previousGameState = previousGameStateRef.current;

    // Synchronize the game clock
    if (periodClock.timestampUtcStarted > 0) {
      // Check if clock just started (transition from stopped to running)
      const wasRunning = (previousGameState?.periodClock?.timestampUtcStarted ?? 0) > 0;

      if (!wasRunning) {
        // Clock just started - record time difference for synchronization
        clockSynchronizer.recordTimeDifference(periodClock.timestampUtcStarted, periodClock.startedByDeviceId);

        // Use local timestamp and full remaining time
        startLocalClock('gameClock', Date.now(), periodClock.msRemaining, setGameClockTime);
      }
      // If already running, don't restart timer (avoid interrupting smooth countdown)
    } else {
      stopLocalClock('gameClock');
      setGameClockTime(periodClock.msRemaining);
    }

    // Synchronize the shot clock
    if (shotClock.timestampUtcStarted > 0) {
      // Check if clock just started (transition from stopped to running)
      const wasRunning = (previousGameState?.shotClock?.timestampUtcStarted ?? 0) > 0;

      if (!wasRunning) {
        // Clock just started - record time difference for synchronization
        clockSynchronizer.recordTimeDifference(shotClock.timestampUtcStarted, shotClock.startedByDeviceId);

        // Use local timestamp and full remaining time
        startLocalClock('shotClock', Date.now(), shotClock.msRemaining, setShotClockTime);
      }
      // If already running, don't restart timer (avoid interrupting smooth countdown)
    } else {
      stopLocalClock('shotClock');
      setShotClockTime(shotClock.msRemaining);
    }

    // Update previous state reference for next comparison
    previousGameStateRef.current = gameState;

    return () => {
      stopLocalClock('gameClock');
      stopLocalClock('shotClock');
    };
  }, [gameState]);

  const getDisplayTime = (clockId: 'periodClock' | 'shotClock') => {
    return clockId === 'periodClock' ? gameClockTime : shotClockTime;
  };

  const getSyncStats = () => {
    return clockSynchronizer.getSyncStats();
  };

  const value = {
    getDisplayTime,
    getSyncStats,
  };

  return <ReceiverClockContext.Provider value={value}>{children}</ReceiverClockContext.Provider>;
}

export function useReceiverClock() {
  const context = useContext(ReceiverClockContext);
  if (!context) {
    throw new Error('useReceiverClock must be used within a ReceiverClockProvider');
  }
  return context;
}