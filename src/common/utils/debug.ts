/**
 * Debug Utility - Conditional logging for development and debugging
 * Allows enabling/disabling debug logs via environment variables or runtime config
 */
export const debugEnabled = false; // Default disabled, can be enabled via env or runtime


export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DebugConfig {
  enabled: boolean;
  level: LogLevel;
  modules: Set<string>;
}

class DebugLogger {
  private config: DebugConfig = {
    enabled: false,
    level: 'debug',
    modules: new Set(),
  };

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    // Check environment variables
    if (typeof process !== 'undefined' && process.env) {
      // Enable debug if DEBUG env var is set
      if (process.env.DEBUG) {
        this.config.enabled = true;
        // Parse modules from DEBUG env var (e.g., DEBUG=clock,firebase,game)
        const modules = process.env.DEBUG.split(',').map(m => m.trim());
        modules.forEach(module => this.config.modules.add(module));
      }

      // Set log level from env
      if (process.env.DEBUG_LEVEL) {
        this.config.level = process.env.DEBUG_LEVEL as LogLevel;
      }
    }

    // Enable debug in development mode
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      this.config.enabled = true;
    }

    // For web environments, check localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const debugEnabled = localStorage.getItem('debug');
      if (debugEnabled === 'true') {
        this.config.enabled = true;
      }

      const debugModules = localStorage.getItem('debug-modules');
      if (debugModules) {
        const modules = debugModules.split(',').map(m => m.trim());
        modules.forEach(module => this.config.modules.add(module));
      }
    }
  }

  /**
   * Enable debug logging
   */
  enable(modules?: string | string[]) {
    this.config.enabled = true;
    if (modules) {
      const moduleList = Array.isArray(modules) ? modules : [modules];
      moduleList.forEach(module => this.config.modules.add(module));
    }
  }

  /**
   * Disable debug logging
   */
  disable() {
    this.config.enabled = false;
    this.config.modules.clear();
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel) {
    this.config.level = level;
  }

  /**
   * Check if logging is enabled for a module
   */
  isEnabled(module?: string): boolean {
    // Master switch - if debugEnabled is false, debug is disabled regardless of other config
    if (!debugEnabled) return false;
    if (!this.config.enabled) return false;
    if (!module) return true;
    if (this.config.modules.size === 0) return true; // No specific modules = log all
    return this.config.modules.has(module) || this.config.modules.has('*');
  }

  /**
   * Create a logger for a specific module
   */
  createLogger(module: string) {
    return {
      debug: (...args: any[]) => this.log('debug', module, ...args),
      info: (...args: any[]) => this.log('info', module, ...args),
      warn: (...args: any[]) => this.log('warn', module, ...args),
      error: (...args: any[]) => this.log('error', module, ...args),
    };
  }

  private log(level: LogLevel, module: string, ...args: any[]) {
    if (!this.isEnabled(module)) return;

    const levelOrder = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levelOrder[level] < levelOrder[this.config.level]) return;

    const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        break;
    }
  }
}

// Global debug instance
export const debug = new DebugLogger();

// Convenience function for quick debugging
export const createDebugLogger = (module: string) => debug.createLogger(module);

// Quick enable/disable functions for runtime use
export const enableDebug = (modules?: string | string[]) => debug.enable(modules);
export const disableDebug = () => debug.disable();

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).ballercastDebug = {
    enable: enableDebug,
    disable: disableDebug,
    setLevel: (level: LogLevel) => debug.setLevel(level),
  };
}