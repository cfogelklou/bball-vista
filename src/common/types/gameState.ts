/**
 * GameState TypeScript interfaces for BallerCast
 * Based on PRD specification v1.4
 *
 * @package @ballercast/shared-core
 */

export interface TeamState {
  score: number;
  fouls: number;
  timeouts: number;
}

export interface ClockState {
  // 0 when not running, otherwise UTC milliseconds when the clock started running
  timestampUtcStarted: number;
  // Number of milliseconds remaining on the clock
  msRemaining: number;
  // ID of the device that started this clock (optional for backward compatibility)
  startedByDeviceId?: string;
}

export interface GameState {
  // This is a randomized UUID, created when the user selects to create a new game
  sessionUuid: string;

  // 6-character game ID for easy reference (optional for backward compatibility)
  gameId?: string;

  // Timestamp, in UTC milliseconds, of when this gamestate was created. Used to delete old sessions
  timestampUtcGameStartedMs: number;

  periodClock: ClockState;
  shotClock: ClockState;

  home: TeamState;
  away: TeamState;
  period: number;

  // Does the home team have possession?
  possessionHome: boolean;
}

/**
 * Helper function to create a default GameState
 */
export function createDefaultGameState(sessionUuid: string): GameState {
  const now = Date.now();

  return {
    sessionUuid,
    timestampUtcGameStartedMs: now,
    periodClock: {
      timestampUtcStarted: 0, // Clock not running
      msRemaining: 10 * 60 * 1000 // 10 minutes default
    },
    shotClock: {
      timestampUtcStarted: 0, // Clock not running
      msRemaining: 24 * 1000 // 24 seconds
    },
    home: {
      score: 0,
      fouls: 0,
      timeouts: 0
    },
    away: {
      score: 0,
      fouls: 0,
      timeouts: 0
    },
    period: 1,
    possessionHome: true
  };
}

/**
 * Helper function to calculate current remaining time for a clock
 * Returns the actual milliseconds remaining, accounting for elapsed time if clock is running
 */
export function getCurrentClockTime(clock: ClockState): number {
  if (clock.timestampUtcStarted === 0) {
    // Clock is not running, return the stored remaining time
    return clock.msRemaining;
  }

  // Clock is running, calculate elapsed time
  const now = Date.now();
  const elapsed = now - clock.timestampUtcStarted;
  const remaining = Math.max(0, clock.msRemaining - elapsed);

  return remaining;
}

/**
 * Helper function to check if a clock is currently running
 */
export function isClockRunning(clock: ClockState): boolean {
  return clock.timestampUtcStarted > 0;
}

/**
 * Helper function to start a clock
 */
export function startClock(clock: ClockState, deviceId?: string): ClockState {
  // First, calculate current remaining time
  const currentRemaining = getCurrentClockTime(clock);

  return {
    timestampUtcStarted: Date.now(),
    msRemaining: currentRemaining,
    startedByDeviceId: deviceId
  };
}

/**
 * Helper function to stop a clock
 */
export function stopClock(clock: ClockState): ClockState {
  // Calculate current remaining time and store it
  const currentRemaining = getCurrentClockTime(clock);

  return {
    timestampUtcStarted: 0,
    msRemaining: currentRemaining
  };
}

/**
 * Helper function to reset a clock to a specific time
 */
export function resetClock(msRemaining: number): ClockState {
  return {
    timestampUtcStarted: 0,
    msRemaining
  };
}