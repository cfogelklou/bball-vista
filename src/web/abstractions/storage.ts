/**
 * Storage abstraction for web using localStorage
 */

export class StorageUtils {
  /**
   * Store a value
   */
  static async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  /**
   * Retrieve a value
   */
  static async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  /**
   * Remove a value
   */
  static async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  /**
   * Clear all storage
   */
  static async clear(): Promise<void> {
    localStorage.clear();
  }

  /**
   * Get all keys
   */
  static async getAllKeys(): Promise<string[]> {
    return Object.keys(localStorage);
  }
}