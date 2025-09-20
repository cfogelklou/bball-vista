/**
 * @file ClockContext.tsx - Shared Clock Context Base
 * @description Provides shared clock synchronization logic that can be used by both
 * control apps (with useGame) and receiver apps (with direct gameState props)
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import { startLocalClock, stopLocalClock, getElapsedTime } from '@common/gameCore/clockUtils';
import { GameState } from '@common/types/gameState';
import clockSynchronizer from '@common/gameCore/clockSync';
import { useDevice } from './DeviceContext';

/**
 * Shared Clock Context State Interface
 */
export interface ClockContextState {
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
  handleStopClock?: (clockId: 'periodClock' | 'shotClock') => void;
}

export const ClockContext = createContext<ClockContextState | null>(null);

/**
 * Base Clock Provider Props
 */
interface BaseClockProviderProps {
  children: ReactNode;
  gameState: GameState | null;
  updateGameState?: (updates: Partial<GameState>) => Promise<{ success: boolean; error?: string }>;
  useReceiverLogic?: boolean;
}

/**
 * Base Clock Provider - handles shared clock synchronization logic
 */
export function BaseClockProvider({
  children,
  gameState,
  updateGameState,
  useReceiverLogic = false
}: BaseClockProviderProps) {
  const [gameClockTime, setGameClockTime] = useState(0);
  const [shotClockTime, setShotClockTime] = useState(0);

  // Get device ID for synchronization comparison
  const { deviceId: currentDeviceId } = useDevice();

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

        // Determine start time based on who started the clock
        const startedByThisDevice = periodClock.startedByDeviceId === currentDeviceId && currentDeviceId != null;
        const startTime = (useReceiverLogic || startedByThisDevice) ? Date.now() : periodClock.timestampUtcStarted;

        console.log('🕐 PERIOD CLOCK START:', {
          startedByDeviceId: periodClock.startedByDeviceId,
          currentDeviceId,
          startedByThisDevice,
          useReceiverLogic,
          startTime,
          timestampUtcStarted: periodClock.timestampUtcStarted,
          msRemaining: periodClock.msRemaining
        });

        startLocalClock('gameClock', startTime, periodClock.msRemaining, setGameClockTime);
      }
      // If already running, don't restart timer (avoid interrupting smooth countdown)
    } else {
      console.log('🕐 PERIOD CLOCK STOP shotClock.timestampUtcStarted == 0 (1)');
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

        // Determine start time based on who started the clock
        const startedByThisDevice = shotClock.startedByDeviceId === currentDeviceId && currentDeviceId != null;
        const startTime = (useReceiverLogic || startedByThisDevice) ? Date.now() : shotClock.timestampUtcStarted;

        console.log('⏱️ SHOT CLOCK START:', {
          startedByDeviceId: shotClock.startedByDeviceId,
          currentDeviceId,
          startedByThisDevice,
          useReceiverLogic,
          startTime,
          timestampUtcStarted: shotClock.timestampUtcStarted,
          msRemaining: shotClock.msRemaining
        });

        startLocalClock('shotClock', startTime, shotClock.msRemaining, setShotClockTime);
      }
      // If already running, don't restart timer (avoid interrupting smooth countdown)
    } else {
      console.log('🕐 PERIOD CLOCK STOP shotClock.timestampUtcStarted == 0 (2)');
      stopLocalClock('shotClock');
      setShotClockTime(shotClock.msRemaining);
    }

    // Update previous state reference for next comparison
    previousGameStateRef.current = gameState;

    // Only cleanup on unmount or when clocks should actually be stopped
    return () => {
      if (!gameState || gameState.periodClock.timestampUtcStarted === 0) {
        console.log('🕐 PERIOD CLOCK STOP during BaseClockProvider unmounting (period stopped)');
        stopLocalClock('gameClock');
      }
      if (!gameState || gameState.shotClock.timestampUtcStarted === 0) {
        console.log('🕐 SHOT CLOCK STOP during BaseClockProvider unmounting (shot stopped)');
        stopLocalClock('shotClock');
      }
    };
  }, [gameState, useReceiverLogic, currentDeviceId]);

  const getDisplayTime = useCallback((clockId: 'periodClock' | 'shotClock') => {
    return clockId === 'periodClock' ? gameClockTime : shotClockTime;
  }, [gameClockTime, shotClockTime]);

  const handleStopClock = updateGameState ? (clockId: 'periodClock' | 'shotClock') => {
    if (!gameState || !updateGameState) return;

    const clock = clockId === 'periodClock' ? gameState.periodClock : gameState.shotClock;
    if (clock.timestampUtcStarted === 0) return; // Clock is not running

    // Calculate the time that has passed since the clock was started
    const elapsedTime = getElapsedTime(clock.timestampUtcStarted);
    const newRemainingTime = Math.max(0, clock.msRemaining - elapsedTime);

    // Prepare the update to be sent to Firebase
    const updates: Partial<GameState> = {
      [clockId]: {
        ...clock,
        timestampUtcStarted: 0, // Set to 0 to indicate the clock is stopped
        msRemaining: newRemainingTime,
      },
    };

    // Send the update to Firebase
    updateGameState(updates);
  } : undefined;

  const getSyncStats = useCallback(() => {
    return clockSynchronizer.getSyncStats();
  }, []);

  const value: ClockContextState = useMemo(() => ({
    getDisplayTime,
    getSyncStats,
    ...(handleStopClock && { handleStopClock }),
  }), [getDisplayTime, getSyncStats, handleStopClock]);

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}

/**
 * Hook for consuming the Clock Context
 */
export function useClock() {
  const context = useContext(ClockContext);
  if (!context) {
    throw new Error('useClock must be used within a ClockProvider');
  }
  return context;
}