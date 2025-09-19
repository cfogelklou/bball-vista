/**
 * Clock Utilities - Manages local countdown timers for clocks.
 */

// Manages the state of active timers
const timers: Record<string, number> = {};

/**
 * Starts a local countdown timer for a clock.
 * @param clockId - A unique ID for the clock (e.g., 'gameClock').
 * @param startTime - The server timestamp when the clock started.
 * @param remainingTime - The time remaining on the clock at startTime.
 * @param onTick - Callback function executed on each timer tick, receiving the new display time.
 */
export function startLocalClock(
  clockId: string,
  startTime: number,
  remainingTime: number,
  onTick: (displayTime: number) => void
): void {
  // Stop any existing timer for this clock
  stopLocalClock(clockId);

  const intervalId = setInterval(() => {
    const elapsedTime = getElapsedTime(startTime);
    const displayTime = Math.max(0, remainingTime - elapsedTime);
    onTick(displayTime);

    if (displayTime === 0) {
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
  if (timers[clockId]) {
    clearInterval(timers[clockId]);
    delete timers[clockId];
  }
}

/**
 * Calculates the elapsed time since the clock started.
 * @param startTime - The server timestamp when the clock started.
 * @returns The elapsed time in milliseconds.
 */
export function getElapsedTime(startTime: number): number {
  if (startTime === 0) {
    return 0;
  }
  return Date.now() - startTime;
}
