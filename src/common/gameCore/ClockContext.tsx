/**
 * @file ClockContextWrapper.tsx - Control App Clock Context
 * @description Wrapper for control apps that integrates with GameContext
 */

import React, { ReactNode } from 'react';
import { BaseClockProvider, useClock } from '@common/contexts/ClockContext';
import { useGame } from '@common/contexts/GameContext';

/**
 * Clock Provider for Control Apps (Mobile/PWA)
 * Integrates with GameContext to provide clock control functionality
 */
export function ClockProvider({ children }: { children: ReactNode }) {
  const { currentGame, updateGameState } = useGame();

  return (
    <BaseClockProvider
      gameState={currentGame}
      updateGameState={updateGameState}
      useReceiverLogic={false}
    >
      {children}
    </BaseClockProvider>
  );
}

/**
 * Hook for control apps - includes stop clock functionality
 */
export function useLocalClock() {
  return useClock();
}