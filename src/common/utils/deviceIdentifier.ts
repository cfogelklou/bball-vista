/**
 * Simple Device Identifier Utility
 * Generates a simple 8-character device ID for mobile/web control apps
 * Receiver apps don't need device IDs since they only consume events
 */

/**
 * Generate a simple 8-character device ID (letters and numbers)
 * Used by mobile app and web PWA control surfaces
 */
export function generateSimpleDeviceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0, O, 1, I
  let result = '';

  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Simple storage key for device ID
 */
export const DEVICE_ID_STORAGE_KEY = '@ballercast_device_id';