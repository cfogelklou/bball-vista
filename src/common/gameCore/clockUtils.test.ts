/**
 * @file clockUtils.test.ts
 * Comprehensive tests for clock utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startLocalClock, stopLocalClock, getElapsedTime } from '@common/gameCore/clockUtils'

describe('clockUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('getElapsedTime', () => {
    it('should return 0 when timestampUtcStarted is 0', () => {
      const elapsedTime = getElapsedTime(0)
      expect(elapsedTime).toBe(0)
    })

    it('should calculate elapsed time correctly', () => {
      const startTime = Date.now()
      const futureTime = startTime + 5000 // 5 seconds later
      vi.setSystemTime(futureTime)

      const elapsedTime = getElapsedTime(startTime)
      expect(elapsedTime).toBe(5000)
    })

    it('should handle negative elapsed time (clock drift)', () => {
      const futureTime = Date.now() + 1000
      vi.setSystemTime(Date.now() - 1000) // Go back in time

      const elapsedTime = getElapsedTime(futureTime)
      expect(elapsedTime).toBe(-2000)
    })

    it('should handle large time differences', () => {
      const startTime = Date.now()
      const futureTime = startTime + (24 * 60 * 60 * 1000) // 24 hours later
      vi.setSystemTime(futureTime)

      const elapsedTime = getElapsedTime(startTime)
      expect(elapsedTime).toBe(24 * 60 * 60 * 1000)
    })
  })

  describe('startLocalClock', () => {
    it('should start a clock and call onTick with correct display time', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()
      const remainingTime = 10000 // 10 seconds

      startLocalClock('testClock', startTime, remainingTime, mockOnTick)

      // Advance time by 100ms (one tick)
      vi.advanceTimersByTime(100)

      expect(mockOnTick).toHaveBeenCalledWith(remainingTime - 100)
    })

    it('should update display time as timer progresses', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()
      const remainingTime = 5000 // 5 seconds

      startLocalClock('testClock', startTime, remainingTime, mockOnTick)

      // Advance time by multiple intervals
      vi.advanceTimersByTime(100)
      expect(mockOnTick).toHaveBeenLastCalledWith(4900)

      vi.advanceTimersByTime(200)
      expect(mockOnTick).toHaveBeenLastCalledWith(4700)

      vi.advanceTimersByTime(1000)
      expect(mockOnTick).toHaveBeenLastCalledWith(3700)
    })

    it('should stop automatically when display time reaches 0', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()
      const remainingTime = 500 // 0.5 seconds

      startLocalClock('testClock', startTime, remainingTime, mockOnTick)

      // Advance time past the remaining time
      vi.advanceTimersByTime(600)

      // Should have been called with 0 and then stopped
      expect(mockOnTick).toHaveBeenCalledWith(0)
      
      // Advance more time - should not call onTick again
      const callCount = mockOnTick.mock.calls.length
      vi.advanceTimersByTime(500)
      expect(mockOnTick.mock.calls.length).toBe(callCount)
    })

    it('should never display negative time', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()
      const remainingTime = 300 // 0.3 seconds

      startLocalClock('testClock', startTime, remainingTime, mockOnTick)

      // Advance time way past the remaining time
      vi.advanceTimersByTime(1000)

      // Should clamp to 0, never go negative
      const calls = mockOnTick.mock.calls
      const displayTimes = calls.map(call => call[0])
      
      displayTimes.forEach(time => {
        expect(time).toBeGreaterThanOrEqual(0)
      })
    })

    it('should replace existing timer for same clockId', () => {
      const mockOnTick1 = vi.fn()
      const mockOnTick2 = vi.fn()
      const startTime = Date.now()

      // Start first clock
      startLocalClock('sameClock', startTime, 5000, mockOnTick1)
      vi.advanceTimersByTime(100)
      expect(mockOnTick1).toHaveBeenCalled()

      // Start second clock with same ID - should replace first
      startLocalClock('sameClock', startTime, 3000, mockOnTick2)
      vi.advanceTimersByTime(100)

      // First callback should not be called again
      const firstCallCount = mockOnTick1.mock.calls.length
      vi.advanceTimersByTime(100)
      expect(mockOnTick1.mock.calls.length).toBe(firstCallCount)

      // Second callback should be called
      expect(mockOnTick2).toHaveBeenCalled()
    })

    it('should handle multiple concurrent clocks with different IDs', () => {
      const mockOnTick1 = vi.fn()
      const mockOnTick2 = vi.fn()
      const startTime = Date.now()

      startLocalClock('clock1', startTime, 5000, mockOnTick1)
      startLocalClock('clock2', startTime, 3000, mockOnTick2)

      vi.advanceTimersByTime(200)

      expect(mockOnTick1).toHaveBeenCalledWith(4800)
      expect(mockOnTick2).toHaveBeenCalledWith(2800)
    })

    it('should handle clocks started at different times', () => {
      const mockOnTick = vi.fn()
      const baseTime = Date.now()
      
      // Start clock with past start time (already running)
      const pastStartTime = baseTime - 2000 // Started 2 seconds ago
      const remainingTime = 10000

      startLocalClock('pastClock', pastStartTime, remainingTime, mockOnTick)
      vi.advanceTimersByTime(100)

      // Should account for the 2 seconds that already passed
      expect(mockOnTick).toHaveBeenCalledWith(remainingTime - 2000 - 100)
    })
  })

  describe('stopLocalClock', () => {
    it('should stop an active clock', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()

      startLocalClock('testClock', startTime, 5000, mockOnTick)
      vi.advanceTimersByTime(100)
      expect(mockOnTick).toHaveBeenCalled()

      stopLocalClock('testClock')
      
      // Clear mock calls and advance time
      mockOnTick.mockClear()
      vi.advanceTimersByTime(500)
      
      // Should not have been called after stopping
      expect(mockOnTick).not.toHaveBeenCalled()
    })

    it('should handle stopping non-existent clock gracefully', () => {
      expect(() => {
        stopLocalClock('nonExistentClock')
      }).not.toThrow()
    })

    it('should not affect other clocks when stopping one', () => {
      const mockOnTick1 = vi.fn()
      const mockOnTick2 = vi.fn()
      const startTime = Date.now()

      startLocalClock('clock1', startTime, 5000, mockOnTick1)
      startLocalClock('clock2', startTime, 3000, mockOnTick2)

      vi.advanceTimersByTime(100)
      expect(mockOnTick1).toHaveBeenCalled()
      expect(mockOnTick2).toHaveBeenCalled()

      // Stop only clock1
      stopLocalClock('clock1')
      mockOnTick1.mockClear()
      mockOnTick2.mockClear()

      vi.advanceTimersByTime(100)
      expect(mockOnTick1).not.toHaveBeenCalled()
      expect(mockOnTick2).toHaveBeenCalled()
    })

    it('should handle multiple stops of the same clock', () => {
      const mockOnTick = vi.fn()
      startLocalClock('testClock', Date.now(), 5000, mockOnTick)

      expect(() => {
        stopLocalClock('testClock')
        stopLocalClock('testClock')
        stopLocalClock('testClock')
      }).not.toThrow()
    })
  })

  describe('Clock timer precision and edge cases', () => {
    it('should maintain 100ms tick intervals', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()

      startLocalClock('precisionClock', startTime, 10000, mockOnTick)

      // Advance by exact intervals
      for (let i = 1; i <= 10; i++) {
        vi.advanceTimersByTime(100)
        expect(mockOnTick).toHaveBeenCalledTimes(i)
      }
    })

    it('should tick down continuously for 5+ seconds with real timers', async () => {
      // Use real timers for this integration test
      vi.useRealTimers()
      
      const tickValues: number[] = []
      const mockOnTick = vi.fn((displayTime: number) => {
        tickValues.push(displayTime)
      })
      
      const startTime = Date.now()
      const initialTime = 10000 // 10 seconds
      
      startLocalClock('realTimerClock', startTime, initialTime, mockOnTick)
      
      // Wait for 5.5 seconds to ensure we get at least 5 seconds of ticks
      await new Promise(resolve => setTimeout(resolve, 5500))
      
      // Stop the clock to clean up
      stopLocalClock('realTimerClock')
      
      // Verify we got multiple ticks
      expect(mockOnTick).toHaveBeenCalled()
      expect(tickValues.length).toBeGreaterThanOrEqual(50) // At least 50 ticks (5 seconds / 100ms)
      
      // Verify time is decreasing
      expect(tickValues[0]).toBeLessThanOrEqual(initialTime)
      expect(tickValues[tickValues.length - 1]).toBeLessThan(tickValues[0])
      
      // Verify we ticked down at least 5 seconds worth
      const totalTimeElapsed = tickValues[0] - tickValues[tickValues.length - 1]
      expect(totalTimeElapsed).toBeGreaterThanOrEqual(4500) // Allow some tolerance
      expect(totalTimeElapsed).toBeLessThanOrEqual(6000) // Should not exceed our wait time
      
      // Verify ticks are roughly 100ms apart (allow some variance for real timers)
      for (let i = 1; i < Math.min(10, tickValues.length); i++) {
        const timeDiff = tickValues[i - 1] - tickValues[i]
        expect(timeDiff).toBeGreaterThanOrEqual(80) // Allow 20ms tolerance
        expect(timeDiff).toBeLessThanOrEqual(120) // Allow 20ms tolerance
      }
      
      // Restore fake timers for other tests
      vi.useFakeTimers()
    }, 10000) // 10 second timeout for this test

    it('should handle system time changes during countdown', () => {
      const mockOnTick = vi.fn()
      let systemTime = Date.now()
      vi.setSystemTime(systemTime)

      const startTime = systemTime
      startLocalClock('systemTimeClock', startTime, 5000, mockOnTick)

      // Simulate system time jump
      systemTime += 2000 // Jump forward 2 seconds
      vi.setSystemTime(systemTime)
      vi.advanceTimersByTime(100)

      // Should account for the time jump
      expect(mockOnTick).toHaveBeenCalledWith(5000 - 2000 - 100)
    })

    it('should handle very short remaining times', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()
      const remainingTime = 50 // 50ms

      startLocalClock('shortClock', startTime, remainingTime, mockOnTick)
      vi.advanceTimersByTime(100)

      expect(mockOnTick).toHaveBeenCalledWith(0)
    })

    it('should handle very long remaining times', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()
      const remainingTime = 24 * 60 * 60 * 1000 // 24 hours

      startLocalClock('longClock', startTime, remainingTime, mockOnTick)
      vi.advanceTimersByTime(100)

      expect(mockOnTick).toHaveBeenCalledWith(remainingTime - 100)
    })

    it('should handle zero remaining time', () => {
      const mockOnTick = vi.fn()
      const startTime = Date.now()

      startLocalClock('zeroClock', startTime, 0, mockOnTick)
      vi.advanceTimersByTime(100)

      expect(mockOnTick).toHaveBeenCalledWith(0)
    })
  })
})