/**
 * Cross-platform Device Identifier Utility
 * Generates and persists unique device IDs for clock synchronization tracking
 */

// AsyncStorage works on both React Native and web via react-native-web
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@ballercast_device_id';
const DEVICE_ID_PREFIX = 'DEV-';

interface DeviceCharacteristics {
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  timezone: string;
  language: string;
}

class DeviceIdentifierService {
  private deviceId: string | null = null;
  private initializationPromise: Promise<string> | null = null;

  /**
   * Get the device ID, initializing if necessary
   */
  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    // Ensure only one initialization happens at a time
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initializeDeviceId();
    this.deviceId = await this.initializationPromise;
    this.initializationPromise = null;

    return this.deviceId;
  }

  /**
   * Initialize device ID - load from storage or generate new one
   */
  private async initializeDeviceId(): Promise<string> {
    try {
      // Try to load existing device ID
      const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (storedId && this.isValidDeviceId(storedId)) {
        console.log('Loaded existing device ID:', storedId);
        return storedId;
      }

      // Generate new device ID
      const newId = await this.generateDeviceId();

      // Store for future use
      try {
        await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
        console.log('Generated and stored new device ID:', newId);
      } catch (storageError) {
        console.warn('Failed to store device ID, will use session-only ID:', storageError);
      }

      return newId;
    } catch (error) {
      console.error('Error initializing device ID:', error);
      // Fallback to session-only ID
      return this.generateFallbackId();
    }
  }

  /**
   * Generate a new device ID using UUID or fallback method
   */
  private async generateDeviceId(): Promise<string> {
    try {
      // Try to use crypto.randomUUID if available (modern browsers/environments)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        const uuid = crypto.randomUUID();
        return DEVICE_ID_PREFIX + uuid.substring(0, 8).toUpperCase();
      }

      // Fallback to deterministic ID based on device characteristics
      return this.generateDeterministicId();
    } catch (error) {
      console.warn('UUID generation failed, using fallback:', error);
      return this.generateFallbackId();
    }
  }

  /**
   * Generate deterministic ID based on device characteristics
   */
  private generateDeterministicId(): string {
    const characteristics = this.getDeviceCharacteristics();

    // Create a hash from device characteristics
    const hashInput = JSON.stringify(characteristics);
    const hash = this.simpleHash(hashInput);

    // Convert to base36 and take first 6 characters
    const shortHash = hash.toString(36).substring(0, 6).toUpperCase();

    return DEVICE_ID_PREFIX + shortHash;
  }

  /**
   * Get device characteristics for fingerprinting
   */
  private getDeviceCharacteristics(): DeviceCharacteristics {
    // Get screen dimensions (works on both web and React Native)
    const screenWidth = typeof window !== 'undefined'
      ? window.screen?.width || window.innerWidth || 1920
      : 1920;
    const screenHeight = typeof window !== 'undefined'
      ? window.screen?.height || window.innerHeight || 1080
      : 1080;

    // Get user agent (web) or fallback for React Native
    const userAgent = typeof navigator !== 'undefined'
      ? navigator.userAgent
      : 'ReactNative';

    // Get timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    // Get language
    const language = typeof navigator !== 'undefined'
      ? navigator.language || 'en-US'
      : 'en-US';

    return {
      screenWidth,
      screenHeight,
      userAgent,
      timezone,
      language
    };
  }

  /**
   * Simple hash function for device characteristics
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate a simple fallback ID when all else fails
   */
  private generateFallbackId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return DEVICE_ID_PREFIX + (timestamp + random).substring(0, 6).toUpperCase();
  }

  /**
   * Validate device ID format
   */
  private isValidDeviceId(id: string): boolean {
    return typeof id === 'string' &&
           id.startsWith(DEVICE_ID_PREFIX) &&
           id.length >= 8 &&
           id.length <= 16;
  }

  /**
   * Reset device ID (for testing/debugging)
   */
  async resetDeviceId(): Promise<string> {
    try {
      await AsyncStorage.removeItem(DEVICE_ID_KEY);
    } catch (error) {
      console.warn('Failed to remove stored device ID:', error);
    }

    this.deviceId = null;
    this.initializationPromise = null;

    return this.getDeviceId();
  }

  /**
   * Get device characteristics for debugging
   */
  getDeviceInfo(): DeviceCharacteristics {
    return this.getDeviceCharacteristics();
  }
}

// Export singleton instance
export const deviceIdentifier = new DeviceIdentifierService();

// Export for direct use
export default deviceIdentifier;