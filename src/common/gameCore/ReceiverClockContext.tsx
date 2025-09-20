/**
 * @file ReceiverClockContextWrapper.tsx - Receiver App Clock Context
 * @description Wrapper for receiver apps that takes gameState as props
 */

import React, { ReactNode } from 'react';
import { BaseClockProvider, useClock, ClockContextState } from '@common/contexts/ClockContext';
import { GameState } from '@common/types/gameState';

/**
 * Receiver-specific context state (no handleStopClock)
 */
export type ReceiverClockContextState = Omit<ClockContextState, 'handleStopClock'>;

/**
 * Clock Provider for Receiver Apps
 * Takes gameState as prop and uses receiver-optimized logic
 */
export function ReceiverClockProvider({
  children,
  gameState
}: {
  children: ReactNode;
  gameState: GameState;
}) {
  return (
    <BaseClockProvider
      gameState={gameState}
      updateGameState={undefined} // No control functionality for receivers
      useReceiverLogic={true}
    >
      {children}
    </BaseClockProvider>
  );
}

/**
 * Hook for receiver apps - excludes stop clock functionality
 */
export function useReceiverClock(): ReceiverClockContextState {
  const context = useClock();

  // Remove handleStopClock from the context for receivers
  const { handleStopClock: _handleStopClock, ...receiverContext } = context;

  return receiverContext;
}