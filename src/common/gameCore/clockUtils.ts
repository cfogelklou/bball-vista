/**
 * Clock Utilities - Manages local countdown timers for clocks.
 */

import { createDebugLogger } from '@common/utils/debug';

const logger = createDebugLogger('clock');

// Manages the state of active timers
const timers: Record<string, number> = {};

/**
 * Starts a local countdown timer for a clock.
 * @param clockId - A unique ID for the clock (e.g., 'gameClock').
 * @param timestampUtcStarted - The server timestamp when the clock started.
 * @param remainingTime - The time remaining on the clock at timestampUtcStarted.
 * @param onTick - Callback function executed on each timer tick, receiving the new display time.
 */
export function startLocalClock(
  clockId: string,
  timestampUtcStarted: number,
  remainingTime: number,
  onTick: (displayTime: number) => void
): void {
  // Stop any existing timer for this clock
  stopLocalClock(clockId);

  const intervalId = setInterval(() => {
    const elapsedTime = getElapsedTime(timestampUtcStarted);
    const displayTime = Math.max(0, remainingTime - elapsedTime);
    logger.debug(`[${clockId}] Timer tick: ${displayTime}ms remaining`);
    onTick(displayTime);

    if (displayTime === 0) {
      logger.info(`[${clockId}] Timer reached zero, stopping`);
      stopLocalClock(clockId);
    }
  }, 100);

  timers[clockId] = intervalId as any;
}

/**
 * Stops a local countdown timer.
 * @param clockId - The ID of the clock to stop.
 */
export function stopLocalClock(clockId: string): void {
  logger.info(`[${clockId}] Stopping local clock`);
  if (timers[clockId]) {
    clearInterval(timers[clockId]);
    delete timers[clockId];
  }
}

/**
 * Calculates the elapsed time since the clock started.
 * @param timestampUtcStarted - The server timestamp when the clock started.
 * @returns The elapsed time in milliseconds.
 */
export function getElapsedTime(timestampUtcStarted: number): number {
  if (timestampUtcStarted === 0) {
    return 0;
  }
  return Date.now() - timestampUtcStarted;
}
