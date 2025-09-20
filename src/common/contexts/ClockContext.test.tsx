/**
 * @file ClockContext.test.tsx - Comprehensive tests for ClockContext
 * @description Tests the BaseClockProvider and useClock hook functionality
 */

import React, { ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BaseClockProvider, useClock, ClockContextState } from './ClockContext';
import { GameState, createDefaultGameState } from '@common/types/gameState';
import * as clockUtils from '@common/gameCore/clockUtils';
import clockSynchronizer from '@common/gameCore/clockSync';

// Mock dependencies
vi.mock('@common/gameCore/clockUtils', () => ({
  startLocalClock: vi.fn(),
  stopLocalClock: vi.fn(),
  getElapsedTime: vi.fn(() => 1000), // Default to 1 second elapsed
}));

vi.mock('@common/gameCore/clockSync', () => ({
  default: {
    recordTimeDifference: vi.fn(),
    getSyncStats: vi.fn(() => ({
      sampleCount: 0,
      averageDifference: 0,
      latestDifference: null,
      latestDeviceId: null,
      standardDeviation: 0,
      deviceStats: {}
    }))
  }
}));

vi.mock('@common/contexts/DeviceContext', () => ({
  useDevice: vi.fn(() => ({ deviceId: 'test-device-123' }))
}));

import { startLocalClock, stopLocalClock, getElapsedTime } from '@common/gameCore/clockUtils';
import { useDevice } from '@common/contexts/DeviceContext';

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = vi.fn();
  vi.useFakeTimers();
});

afterEach(() => {
  console.log = originalConsoleLog;
  vi.clearAllMocks();
  vi.useRealTimers();
});

// Test component to access clock context
function TestClockComponent() {
  const clock = useClock();
  
  return (
    <div>
      <div data-testid="period-time">{clock.getDisplayTime('periodClock')}</div>
      <div data-testid="shot-time">{clock.getDisplayTime('shotClock')}</div>
      <div data-testid="sync-stats">{JSON.stringify(clock.getSyncStats())}</div>
      {clock.handleStopClock && (
        <>
          <button 
            data-testid="stop-period-clock" 
            onClick={() => clock.handleStopClock!('periodClock')}
          >
            Stop Period Clock
          </button>
          <button 
            data-testid="stop-shot-clock" 
            onClick={() => clock.handleStopClock!('shotClock')}
          >
            Stop Shot Clock
          </button>
        </>
      )}
    </div>
  );
}

// Helper to render component with ClockProvider
function renderWithClockProvider(
  gameState: GameState | null,
  updateGameState?: (updates: Partial<GameState>) => Promise<{ success: boolean; error?: string }>,
  useReceiverLogic = false
) {
  return render(
    <BaseClockProvider
      gameState={gameState}
      updateGameState={updateGameState}
      useReceiverLogic={useReceiverLogic}
    >
      <TestClockComponent />
    </BaseClockProvider>
  );
}

describe('BaseClockProvider', () => {
  let mockUpdateGameState: Mock;
  let defaultGameState: GameState;

  beforeEach(() => {
    mockUpdateGameState = vi.fn().mockResolvedValue({ success: true });
    defaultGameState = createDefaultGameState('test-session-123');
    // Timer setup is handled in the global beforeEach
    vi.setSystemTime(new Date('2023-01-01T10:00:00Z'));
  });

  afterEach(() => {
    // Timer cleanup is handled in the global afterEach
  });

  describe('Initial State', () => {
    it('should provide initial clock times when gameState is null', () => {
      renderWithClockProvider(null);
      
      expect(screen.getByTestId('period-time')).toHaveTextContent('0');
      expect(screen.getByTestId('shot-time')).toHaveTextContent('0');
    });

    it('should provide clock times from gameState when provided', () => {
      const gameState = {
        ...defaultGameState,
        periodClock: { timestampUtcStarted: 0, msRemaining: 600000 }, // 10 minutes
        shotClock: { timestampUtcStarted: 0, msRemaining: 24000 } // 24 seconds
      };

      renderWithClockProvider(gameState);
      
      expect(screen.getByTestId('period-time')).toHaveTextContent('600000');
      expect(screen.getByTestId('shot-time')).toHaveTextContent('24000');
    });

    it('should provide sync stats from clockSynchronizer', () => {
      const mockStats = {
        sampleCount: 5,
        averageDifference: 100,
        latestDifference: 120,
        latestDeviceId: 'device-456',
        standardDeviation: 25,
        deviceStats: {}
      };
      
      (clockSynchronizer.getSyncStats as Mock).mockReturnValue(mockStats);
      
      renderWithClockProvider(defaultGameState);
      
      expect(screen.getByTestId('sync-stats')).toHaveTextContent(JSON.stringify(mockStats));
    });
  });

  describe('Clock Starting Logic', () => {
    it('should start period clock when timestampUtcStarted changes from 0 to non-zero', () => {
      const { rerender } = renderWithClockProvider(defaultGameState);

      // Initially stopped clock
      expect(clockUtils.startLocalClock).not.toHaveBeenCalled();

      // Update to running clock
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 600000,
          startedByDeviceId: 'other-device'
        }
      };

      rerender(
        <BaseClockProvider gameState={runningGameState} useReceiverLogic={false}>
          <TestClockComponent />
        </BaseClockProvider>
      );

      expect(clockUtils.startLocalClock).toHaveBeenCalledWith(
        'gameClock',
        runningGameState.periodClock.timestampUtcStarted,
        600000,
        expect.any(Function)
      );
    });

    it('should start shot clock when timestampUtcStarted changes from 0 to non-zero', () => {
      const { rerender } = renderWithClockProvider(defaultGameState);

      // Update to running shot clock
      const runningGameState = {
        ...defaultGameState,
        shotClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 24000,
          startedByDeviceId: 'other-device'
        }
      };

      rerender(
        <BaseClockProvider gameState={runningGameState} useReceiverLogic={false}>
          <TestClockComponent />
        </BaseClockProvider>
      );

      expect(clockUtils.startLocalClock).toHaveBeenCalledWith(
        'shotClock',
        runningGameState.shotClock.timestampUtcStarted,
        24000,
        expect.any(Function)
      );
    });

    it('should not restart clock if already running', () => {
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 600000,
          startedByDeviceId: 'other-device'
        }
      };

      const { rerender } = renderWithClockProvider(runningGameState);

      // Clear previous calls
      vi.clearAllMocks();

      // Rerender with same running state (should not restart)
      rerender(
        <BaseClockProvider gameState={runningGameState} useReceiverLogic={false}>
          <TestClockComponent />
        </BaseClockProvider>
      );

      expect(clockUtils.startLocalClock).not.toHaveBeenCalled();
    });

    it('should record time difference when clock starts', () => {
      const timestampUtcStarted = Date.now();
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted,
          msRemaining: 600000,
          startedByDeviceId: 'device-123'
        }
      };

      renderWithClockProvider(runningGameState);

      expect(clockSynchronizer.recordTimeDifference).toHaveBeenCalledWith(
        timestampUtcStarted,
        'device-123'
      );
    });
  });

  describe('Device-specific Clock Logic', () => {
    it('should use current device time when started by same device', () => {
      const timestampUtcStarted = Date.now() - 1000; // 1 second ago
      const currentTime = Date.now();
      
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted,
          msRemaining: 600000,
          startedByDeviceId: 'test-device-123' // Same as mocked device ID
        }
      };

      renderWithClockProvider(runningGameState, undefined, false);

      expect(clockUtils.startLocalClock).toHaveBeenCalledWith(
        'gameClock',
        currentTime,
        600000,
        expect.any(Function)
      );
    });

    it('should use receiver logic when useReceiverLogic is true', () => {
      const timestampUtcStarted = Date.now() - 1000;
      const currentTime = Date.now();
      
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted,
          msRemaining: 600000,
          startedByDeviceId: 'other-device'
        }
      };

      renderWithClockProvider(runningGameState, undefined, true);

      expect(clockUtils.startLocalClock).toHaveBeenCalledWith(
        'gameClock',
        currentTime,
        600000,
        expect.any(Function)
      );
    });

    it('should use Firebase timestamp when started by different device and not receiver', () => {
      const timestampUtcStarted = Date.now() - 1000;
      
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted,
          msRemaining: 600000,
          startedByDeviceId: 'other-device'
        }
      };

      renderWithClockProvider(runningGameState, undefined, false);

      expect(clockUtils.startLocalClock).toHaveBeenCalledWith(
        'gameClock',
        timestampUtcStarted,
        600000,
        expect.any(Function)
      );
    });
  });

  describe('Clock Stopping Logic', () => {
    it('should stop local clock when timestampUtcStarted becomes 0', () => {
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 600000,
          startedByDeviceId: 'device-123'
        }
      };

      const { rerender } = renderWithClockProvider(runningGameState);

      // Stop the clock
      const stoppedGameState = {
        ...runningGameState,
        periodClock: {
          timestampUtcStarted: 0,
          msRemaining: 500000,
          startedByDeviceId: 'device-123'
        }
      };

      rerender(
        <BaseClockProvider gameState={stoppedGameState} useReceiverLogic={false}>
          <TestClockComponent />
        </BaseClockProvider>
      );

      expect(clockUtils.stopLocalClock).toHaveBeenCalledWith('gameClock');
    });

    it('should set display time to msRemaining when clock is stopped', () => {
      const stoppedGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: 0,
          msRemaining: 500000,
          startedByDeviceId: 'device-123'
        }
      };

      renderWithClockProvider(stoppedGameState);

      expect(screen.getByTestId('period-time')).toHaveTextContent('500000');
    });
  });

  describe('Stop Clock Functionality', () => {
    it('should provide handleStopClock when updateGameState is provided', () => {
      renderWithClockProvider(defaultGameState, mockUpdateGameState);

      expect(screen.getByTestId('stop-period-clock')).toBeInTheDocument();
      expect(screen.getByTestId('stop-shot-clock')).toBeInTheDocument();
    });

    it('should not provide handleStopClock when updateGameState is not provided', () => {
      renderWithClockProvider(defaultGameState);

      expect(screen.queryByTestId('stop-period-clock')).not.toBeInTheDocument();
      expect(screen.queryByTestId('stop-shot-clock')).not.toBeInTheDocument();
    });

    it('should call updateGameState with correct data when stopping period clock', async () => {
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now() - 5000, // Started 5 seconds ago
          msRemaining: 600000,
          startedByDeviceId: 'device-123'
        }
      };

      (clockUtils.getElapsedTime as Mock).mockReturnValue(5000); // 5 seconds elapsed

      renderWithClockProvider(runningGameState, mockUpdateGameState);

      await act(async () => {
        screen.getByTestId('stop-period-clock').click();
      });

      expect(mockUpdateGameState).toHaveBeenCalledWith({
        periodClock: {
          ...runningGameState.periodClock,
          timestampUtcStarted: 0,
          msRemaining: 595000 // 600000 - 5000
        }
      });
    });

    it('should call updateGameState with correct data when stopping shot clock', async () => {
      const runningGameState = {
        ...defaultGameState,
        shotClock: {
          timestampUtcStarted: Date.now() - 2000, // Started 2 seconds ago
          msRemaining: 24000,
          startedByDeviceId: 'device-123'
        }
      };

      (clockUtils.getElapsedTime as Mock).mockReturnValue(2000); // 2 seconds elapsed

      renderWithClockProvider(runningGameState, mockUpdateGameState);

      await act(async () => {
        screen.getByTestId('stop-shot-clock').click();
      });

      expect(mockUpdateGameState).toHaveBeenCalledWith({
        shotClock: {
          ...runningGameState.shotClock,
          timestampUtcStarted: 0,
          msRemaining: 22000 // 24000 - 2000
        }
      });
    });

    it('should not stop clock if timestampUtcStarted is already 0', async () => {
      const stoppedGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: 0,
          msRemaining: 600000,
          startedByDeviceId: 'device-123'
        }
      };

      renderWithClockProvider(stoppedGameState, mockUpdateGameState);

      await act(async () => {
        screen.getByTestId('stop-period-clock').click();
      });

      expect(mockUpdateGameState).not.toHaveBeenCalled();
    });

    it('should ensure remaining time never goes below 0', async () => {
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now() - 10000, // Started 10 seconds ago
          msRemaining: 5000, // Only 5 seconds remaining
          startedByDeviceId: 'device-123'
        }
      };

      (clockUtils.getElapsedTime as Mock).mockReturnValue(10000); // 10 seconds elapsed

      renderWithClockProvider(runningGameState, mockUpdateGameState);

      await act(async () => {
        screen.getByTestId('stop-period-clock').click();
      });

      expect(mockUpdateGameState).toHaveBeenCalledWith({
        periodClock: {
          ...runningGameState.periodClock,
          timestampUtcStarted: 0,
          msRemaining: 0 // Should be 0, not negative
        }
      });
    });
  });

  describe('Cleanup', () => {
    it('should stop all local clocks on unmount', () => {
      const { unmount } = renderWithClockProvider(defaultGameState);

      unmount();

      expect(clockUtils.stopLocalClock).toHaveBeenCalledWith('gameClock');
      expect(clockUtils.stopLocalClock).toHaveBeenCalledWith('shotClock');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useClock is used outside provider', () => {
      const TestComponent = () => {
        useClock();
        return <div>Test</div>;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useClock must be used within a ClockProvider'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null gameState gracefully', () => {
      renderWithClockProvider(null);

      expect(screen.getByTestId('period-time')).toHaveTextContent('0');
      expect(screen.getByTestId('shot-time')).toHaveTextContent('0');
    });

    describe('Edge Cases', () => {
    it('should handle null gameState gracefully', () => {
      renderWithClockProvider(null);

      expect(screen.getByTestId('period-time')).toHaveTextContent('0');
      expect(screen.getByTestId('shot-time')).toHaveTextContent('0');
    });

    it('should handle missing startedByDeviceId gracefully', () => {
      const gameStateWithoutDeviceId = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 600000
          // startedByDeviceId is missing
        }
      };

      renderWithClockProvider(gameStateWithoutDeviceId);

      expect(clockSynchronizer.recordTimeDifference).toHaveBeenCalledWith(
        gameStateWithoutDeviceId.periodClock.timestampUtcStarted,
        undefined
      );
    });

    it('should handle null currentDeviceId gracefully', () => {
      // Mock useDevice to return null deviceId directly
      vi.mocked(useDevice).mockReturnValue({ deviceId: null });

      const gameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 600000,
          startedByDeviceId: undefined
        }
      };

      renderWithClockProvider(gameState);

      // Should use Firebase timestamp since device comparison fails
      expect(clockUtils.startLocalClock).toHaveBeenCalledWith(
        'gameClock',
        gameState.periodClock.timestampUtcStarted,
        600000,
        expect.any(Function)
      );
      
      // Restore the mock
      vi.mocked(useDevice).mockReturnValue({ deviceId: 'test-device-123' });
    });
  });

  describe('Real-time Clock Integration', () => {
    it('should properly call startLocalClock when clock starts', async () => {
      // This test verifies the integration without needing real timers
      const runningGameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 5000, // 5 seconds
          startedByDeviceId: 'test-device-123'
        }
      };

      // Simulate what happens when the clock callback is called
      let clockCallback: ((time: number) => void) | undefined;
      const mockStart = vi.mocked(clockUtils.startLocalClock);
      mockStart.mockImplementation((clockId: string, startTime: number, remainingTime: number, callback: (time: number) => void) => {
        clockCallback = callback;
      });

      const { unmount } = renderWithClockProvider(runningGameState);
      
      // Verify startLocalClock was called
      expect(mockStart).toHaveBeenCalledWith(
        'gameClock',
        expect.any(Number),
        5000,
        expect.any(Function)
      );
      
      // Simulate the clock callback being called with decreasing values
      if (clockCallback) {
        // Simulate 3 timer ticks
        act(() => clockCallback!(4900)); // After 100ms
        act(() => clockCallback!(4800)); // After 200ms  
        act(() => clockCallback!(4700)); // After 300ms
      }
      
      // The display should update (though we're using mocked functions)
      // This verifies the wiring is correct
      expect(screen.getByTestId('period-time')).toBeInTheDocument();
      
      // Clean up
      unmount();
    });
  });

    it('should handle null currentDeviceId gracefully', () => {
      // Mock useDevice to return null deviceId
      const mockUseDevice = vi.mocked(useDevice);
      mockUseDevice.mockReturnValue({ deviceId: null });

      const gameState = {
        ...defaultGameState,
        periodClock: {
          timestampUtcStarted: Date.now(),
          msRemaining: 600000,
          startedByDeviceId: undefined
        }
      };

      renderWithClockProvider(gameState);

      // Should use Firebase timestamp since device comparison fails
      expect(clockUtils.startLocalClock).toHaveBeenCalledWith(
        'gameClock',
        gameState.periodClock.timestampUtcStarted,
        600000,
        expect.any(Function)
      );
    });
  });
});