/**
 * Clock Synchronization Utility
 * Tracks the difference between local device time and Firebase server time
 * to enable accurate cross-device time measurements and per-device drift analysis.
 */

interface TimeDifferenceSample {
  deviceId: string; // ID of the device that provided this sample
  localTime: number;
  firebaseTime: number;
  difference: number; // localTime - firebaseTime
  timestamp: number; // when this sample was taken
}

interface DeviceStats {
  sampleCount: number;
  averageDifference: number;
  latestDifference: number;
  standardDeviation: number;
  lastSeen: number; // timestamp of last sample from this device
}

class ClockSynchronizer {
  private samples: TimeDifferenceSample[] = [];
  private maxSamples = 10; // Keep last 10 samples for averaging
  private currentAverageDifference = 0;

  /**
   * Record a new time difference sample when we detect a clock start event
   * @param firebaseTimestamp - The timestamp from Firebase when clock started
   * @param deviceId - ID of the device that started the clock (from Firebase)
   */
  recordTimeDifference(firebaseTimestamp: number, deviceId?: string): void {
    const localTime = Date.now();
    const difference = localTime - firebaseTimestamp;
    const sampleDeviceId = deviceId || 'UNKNOWN';

    const sample: TimeDifferenceSample = {
      deviceId: sampleDeviceId,
      localTime,
      firebaseTime: firebaseTimestamp,
      difference,
      timestamp: localTime
    };

    // Add new sample
    this.samples.push(sample);

    // Keep only the most recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // Update average
    this.updateAverageDifference();

    console.log(`Clock sync [${sampleDeviceId}]: Local-Firebase difference = ${difference}ms, Average = ${this.currentAverageDifference}ms`);
  }

  /**
   * Calculate the running average of time differences
   */
  private updateAverageDifference(): void {
    if (this.samples.length === 0) {
      this.currentAverageDifference = 0;
      return;
    }

    const sum = this.samples.reduce((acc, sample) => acc + sample.difference, 0);
    this.currentAverageDifference = sum / this.samples.length;
  }

  /**
   * Get the current average time difference between local and Firebase time
   * @returns The average difference in milliseconds (localTime - firebaseTime)
   */
  getAverageTimeDifference(): number {
    return this.currentAverageDifference;
  }

  /**
   * Convert a Firebase timestamp to estimated local time equivalent
   * @param firebaseTimestamp - Timestamp from Firebase
   * @returns Estimated local time equivalent
   */
  firebaseToLocalTime(firebaseTimestamp: number): number {
    return firebaseTimestamp + this.currentAverageDifference;
  }

  /**
   * Convert a local timestamp to estimated Firebase time equivalent
   * @param localTimestamp - Local device timestamp
   * @returns Estimated Firebase time equivalent
   */
  localToFirebaseTime(localTimestamp: number): number {
    return localTimestamp - this.currentAverageDifference;
  }

  /**
   * Calculate the actual elapsed time between two Firebase events
   * accounting for potential device clock differences
   * @param startFirebaseTime - Firebase timestamp when event started
   * @param stopFirebaseTime - Firebase timestamp when event stopped
   * @returns Actual elapsed time in milliseconds
   */
  calculateActualElapsedTime(startFirebaseTime: number, stopFirebaseTime: number): number {
    // If we have sync data, use it to get more accurate elapsed time
    if (this.samples.length > 0) {
      // Convert both timestamps to local time equivalent for consistent calculation
      const localStart = this.firebaseToLocalTime(startFirebaseTime);
      const localStop = this.firebaseToLocalTime(stopFirebaseTime);
      return localStop - localStart;
    }

    // Fallback to direct Firebase time difference
    return stopFirebaseTime - startFirebaseTime;
  }

  /**
   * Get statistics about the clock synchronization
   */
  getSyncStats(): {
    sampleCount: number;
    averageDifference: number;
    latestDifference: number | null;
    latestDeviceId: string | null;
    standardDeviation: number;
    deviceStats: { [deviceId: string]: DeviceStats };
  } {
    if (this.samples.length === 0) {
      return {
        sampleCount: 0,
        averageDifference: 0,
        latestDifference: null,
        latestDeviceId: null,
        standardDeviation: 0,
        deviceStats: {}
      };
    }

    const latest = this.samples[this.samples.length - 1];

    // Calculate standard deviation
    const mean = this.currentAverageDifference;
    const squaredDifferences = this.samples.map(sample => Math.pow(sample.difference - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / this.samples.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate per-device statistics
    const deviceStats = this.calculateDeviceStats();

    return {
      sampleCount: this.samples.length,
      averageDifference: this.currentAverageDifference,
      latestDifference: latest.difference,
      latestDeviceId: latest.deviceId,
      standardDeviation,
      deviceStats
    };
  }

  /**
   * Calculate statistics per device
   */
  private calculateDeviceStats(): { [deviceId: string]: DeviceStats } {
    const deviceGroups: { [deviceId: string]: TimeDifferenceSample[] } = {};

    // Group samples by device ID
    this.samples.forEach(sample => {
      if (!deviceGroups[sample.deviceId]) {
        deviceGroups[sample.deviceId] = [];
      }
      deviceGroups[sample.deviceId].push(sample);
    });

    // Calculate stats for each device
    const deviceStats: { [deviceId: string]: DeviceStats } = {};

    Object.entries(deviceGroups).forEach(([deviceId, samples]) => {
      const differences = samples.map(s => s.difference);
      const sampleCount = samples.length;
      const averageDifference = differences.reduce((acc, val) => acc + val, 0) / sampleCount;
      const latestSample = samples[samples.length - 1];

      // Calculate standard deviation for this device
      const squaredDiffs = differences.map(diff => Math.pow(diff - averageDifference, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sampleCount;
      const standardDeviation = Math.sqrt(variance);

      deviceStats[deviceId] = {
        sampleCount,
        averageDifference,
        latestDifference: latestSample.difference,
        standardDeviation,
        lastSeen: latestSample.timestamp
      };
    });

    return deviceStats;
  }
}

// Singleton instance
const clockSynchronizer = new ClockSynchronizer();

export default clockSynchronizer;