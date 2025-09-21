/**
 * Debug Utility - Conditional logging for development and debugging
 * Allows enabling/disabling debug logs via environment variables or runtime config
 * Cross-platform compatible with web, iOS, and Android
 * Enhanced with error capture for overlay display
 */

import { isWeb } from '@abstractions/isWeb';
import { StorageUtils } from '@abstractions/storage';

export const wantDebug = true; // Set to false to disable all debug code in production builds

// Error capture interface for overlay integration
export interface CapturedError {
  id: string;
  message: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  source?: string;
  stack?: string;
}

// Global error capture system
class ErrorCapture {
  private errors: CapturedError[] = [];
  private maxErrors = 100;
  private errorIdCounter = 0;
  private listeners: Array<(error: CapturedError) => void> = [];
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };

    // Only intercept console in debug mode
    if (wantDebug) {
      this.interceptConsole();
    }
  }

  private interceptConsole() {
    // Intercept console.error
    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      this.captureError('error', this.formatArgs(args));
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      this.captureError('warn', this.formatArgs(args));
    };

    // Intercept console.info for debug purposes
    console.info = (...args: any[]) => {
      this.originalConsole.info(...args);
      if (debugEnabled) {
        this.captureError('info', this.formatArgs(args));
      }
    };

    // Intercept console.debug
    console.debug = (...args: any[]) => {
      this.originalConsole.debug(...args);
      if (debugEnabled) {
        this.captureError('debug', this.formatArgs(args));
      }
    };
  }

  private formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (arg instanceof Error) return `${arg.message}\n${arg.stack}`;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }).join(' ');
  }

  private captureError(level: CapturedError['level'], message: string, source?: string) {
    const error: CapturedError = {
      id: `error-${++this.errorIdCounter}-${Date.now()}`,
      message,
      timestamp: new Date(),
      level,
      source,
      stack: level === 'error' ? new Error().stack : undefined,
    };

    this.errors.push(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        // Don't let listener errors break the capture system
        this.originalConsole.error('Error in error capture listener:', e);
      }
    });
  }

  public addError(message: string, level: CapturedError['level'] = 'error', source?: string) {
    this.captureError(level, message, source);
  }

  public getErrors(): CapturedError[] {
    return [...this.errors];
  }

  public clearErrors() {
    this.errors = [];
  }

  public addListener(listener: (error: CapturedError) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public setMaxErrors(max: number) {
    this.maxErrors = max;
    if (this.errors.length > max) {
      this.errors = this.errors.slice(-max);
    }
  }
}

// Global error capture instance
export const errorCapture = new ErrorCapture();

/**
 * Auto-detect if we're in debug mode based on multiple criteria
 * Cross-platform compatible with web, iOS, and Android
 */
function autoDetectDebugMode(): boolean {
  if (!wantDebug) return false; // Skip detection if debugging is disabled globally

  // 1. Check environment variables
  if (typeof process !== 'undefined' && process.env) {
    // Disable debug in CI environments
    if (process.env.CI === 'true' || process.env.CI === '1') return false;
    
    // Explicit DEBUG flag
    if (process.env.DEBUG) return true;
    // Development mode
    if (process.env.NODE_ENV === 'development') return true;
    // Vite development mode
    if (process.env.DEV === 'true') return true;
  }

  // 2. Web-specific checks (URL parameters and hostname)
  if (isWeb()) {
    // Check URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('debug') === 'true') return true;
      
      // Check for localhost or common development domains
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
        return true;
      }
    }
  }

  // 3. Check persistent storage (works on both web and mobile)
  // Note: This is checked synchronously, but storage is async
  // We'll handle async storage in initializeFromStorage()

  // 4. Check for React Native development mode
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;

  return false;
}

export const debugEnabled = wantDebug && autoDetectDebugMode();

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
    if (wantDebug) {
      this.initializeFromEnv();
      // Async storage initialization moved to static create() method
    }
  }

  /**
   * Factory method to create and initialize a DebugLogger instance asynchronously.
   */
  static async create(): Promise<DebugLogger> {
    const logger = new DebugLogger();
    if (wantDebug) {
      await logger.initializeFromStorage();
    }
    return logger;
  }
  private initializeFromEnv() {
    if (!wantDebug) return; // Skip initialization if debugging is disabled globally

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
  }

  /**
   * Initialize debug settings from cross-platform storage
   * This handles both localStorage (web) and AsyncStorage (mobile)
   */
  private async initializeFromStorage() {
    if (!wantDebug) return;

    try {
      // Check if debug is enabled in storage
      const debugEnabled = await StorageUtils.getItem('ballercast-debug');
      if (debugEnabled === 'true') {
        this.config.enabled = true;
      }

      // Check debug modules from storage
      const debugModules = await StorageUtils.getItem('ballercast-debug-modules');
      if (debugModules) {
        const modules = debugModules.split(',').map(m => m.trim());
        modules.forEach(module => this.config.modules.add(module));
      }

      // Check debug level from storage
      const debugLevel = await StorageUtils.getItem('ballercast-debug-level');
      if (debugLevel) {
        this.config.level = debugLevel as LogLevel;
      }
    } catch (error) {
      // Silently fail if storage is not available
      console.warn('Debug: Failed to initialize from storage:', error);
    }
  }

  enable(modules?: string | string[]) {
    if (!wantDebug) return; // Skip if debugging is disabled globally
    this.config.enabled = true;
    if (modules) {
      const moduleList = Array.isArray(modules) ? modules : [modules];
      moduleList.forEach(module => this.config.modules.add(module));
    }
  }

  disable() {
    if (!wantDebug) return; // Skip if debugging is disabled globally
    this.config.enabled = false;
    this.config.modules.clear();
  }

  setLevel(level: LogLevel) {
    if (!wantDebug) return; // Skip if debugging is disabled globally
    this.config.level = level;
  }

  isEnabled(module?: string): boolean {
    if (!wantDebug) return false; // Skip if debugging is disabled globally
    if (!debugEnabled) return false;
    if (!this.config.enabled) return false;
    if (!module) return true;
    if (this.config.modules.size === 0) return true; // No specific modules = log all
    return this.config.modules.has(module) || this.config.modules.has('*');
  }

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

/**
 * Helper function to reload the window if possible (web only)
 */
function reloadWindowIfPossible() {
  if (typeof window !== 'undefined' && window.location?.reload) {
    window.location.reload();
  }
}

// Export for browser console access (web only)
if (isWeb() && typeof window !== 'undefined' && wantDebug) {
  (window as any).ballercastDebug = {
    enable: enableDebug,
    disable: disableDebug,
    setLevel: (level: LogLevel) => debug.setLevel(level),
    isDebugMode: () => debugEnabled,
    enablePersistent: async () => {
      await StorageUtils.setItem('ballercast-debug', 'true');
      reloadWindowIfPossible();
    },
    disablePersistent: async () => {
      await StorageUtils.removeItem('ballercast-debug');
      reloadWindowIfPossible();
    },
    setFeatures: async (features: string) => {
      await StorageUtils.setItem('ballercast-debug-features', features);
    },
    getFeatures: async () => {
      return await StorageUtils.getItem('ballercast-debug-features');
    },
    // Error testing utilities
    testErrors: {
      error: () => console.error('Test error message for overlay'),
      warning: () => console.warn('Test warning message for overlay'),
      info: () => console.info('Test info message for overlay'),
      firebase: () => errorCapture.addError('Firebase connection failed: Test error', 'error', 'Firebase'),
      chromecast: () => errorCapture.addError('Chromecast initialization failed: Test error', 'error', 'CastReceiver'),
      multiple: () => {
        errorCapture.addError('First test error', 'error', 'Test');
        errorCapture.addError('Second test warning', 'warn', 'Test');
        errorCapture.addError('Third test info', 'info', 'Test');
      }
    },
    errors: {
      get: () => errorCapture.getErrors(),
      clear: () => errorCapture.clearErrors(),
    }
  };

  // Add keyboard shortcuts for testing (Ctrl+Shift+E for error overlay toggle)
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'E') {
      event.preventDefault();
      errorCapture.addError('Keyboard shortcut test error', 'error', 'Debug');
    }
    if (event.ctrlKey && event.shiftKey && event.key === 'W') {
      event.preventDefault();
      errorCapture.addError('Keyboard shortcut test warning', 'warn', 'Debug');
    }
  });
}

/**
 * Check if we're in debug mode - useful for conditional UI features
 */
export const isDebugMode = (): boolean => debugEnabled;

/**
 * Check if a specific debug feature is enabled
 * Cross-platform compatible
 */
export const isDebugFeatureEnabled = (feature: string): boolean => {
  if (!debugEnabled) return false;
  
  // For web: Check URL parameters first
  if (isWeb() && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const debugFeatures = urlParams.get('debug-features');
    if (debugFeatures) {
      const features = debugFeatures.split(',').map(f => f.trim());
      return features.includes(feature) || features.includes('*');
    }
  }

  // Note: Storage check is async, but this function is sync
  // For now, we'll return true if debug mode is enabled
  // TODO: Consider making this async or caching storage values
  
  // Default: if debug mode is on, enable all features
  return true;
};

/**
 * Async version of isDebugFeatureEnabled that checks storage
 */
export const isDebugFeatureEnabledAsync = async (feature: string): Promise<boolean> => {
  if (!debugEnabled) return false;
  
  // For web: Check URL parameters first
  if (isWeb() && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const debugFeatures = urlParams.get('debug-features');
    if (debugFeatures) {
      const features = debugFeatures.split(',').map(f => f.trim());
      return features.includes(feature) || features.includes('*');
    }
  }

  // Check cross-platform storage
  try {
    const debugFeatures = await StorageUtils.getItem('ballercast-debug-features');
    if (debugFeatures) {
      const features = debugFeatures.split(',').map(f => f.trim());
      return features.includes(feature) || features.includes('*');
    }
  } catch (error) {
    // Silently fail if storage is not available
    console.warn('Debug: Failed to check feature from storage:', error);
  }

  // Default: if debug mode is on, enable all features
  return true;
};

/**
 * Debug feature flags for conditional functionality
 */
export const DebugFeatures = {
  CREATE_GAME: 'create-game',
  ADMIN_CONTROLS: 'admin-controls',
  PERFORMANCE_METRICS: 'performance-metrics',
  MOCK_DATA: 'mock-data',
} as const;

export type DebugFeature = typeof DebugFeatures[keyof typeof DebugFeatures];

/**
 * Enhanced storage utilities for debug settings
 */
export const DebugStorage = {
  /**
   * Enable debug features persistently
   */
  enableFeatures: async (features: string[]): Promise<void> => {
    await StorageUtils.setItem('ballercast-debug-features', features.join(','));
  },

  /**
   * Get enabled debug features
   */
  getFeatures: async (): Promise<string[]> => {
    const features = await StorageUtils.getItem('ballercast-debug-features');
    return features ? features.split(',').map(f => f.trim()) : [];
  },

  /**
   * Clear all debug settings
   */
  clearAll: async (): Promise<void> => {
    await StorageUtils.removeItem('ballercast-debug');
    await StorageUtils.removeItem('ballercast-debug-features');
    await StorageUtils.removeItem('ballercast-debug-modules');
    await StorageUtils.removeItem('ballercast-debug-level');
  },
};

/**
 * Error capture integration functions
 */
export const ErrorCaptureAPI = {
  /**
   * Get all captured errors
   */
  getErrors: () => errorCapture.getErrors(),

  /**
   * Clear all captured errors
   */
  clearErrors: () => errorCapture.clearErrors(),

  /**
   * Add a listener for new errors
   */
  addListener: (listener: (error: CapturedError) => void) => errorCapture.addListener(listener),

  /**
   * Manually add an error to the capture system
   */
  addError: (message: string, level: CapturedError['level'] = 'error', source?: string) => 
    errorCapture.addError(message, level, source),

  /**
   * Set maximum number of errors to keep
   */
  setMaxErrors: (max: number) => errorCapture.setMaxErrors(max),
};

/**
 * Enhanced debug logger that integrates with error capture
 */
export const createEnhancedDebugLogger = (module: string) => {
  const logger = debug.createLogger(module);
  
  return {
    debug: (...args: any[]) => {
      logger.debug(...args);
      if (debugEnabled) {
        errorCapture.addError(args.join(' '), 'debug', module);
      }
    },
    info: (...args: any[]) => {
      logger.info(...args);
      if (debugEnabled) {
        errorCapture.addError(args.join(' '), 'info', module);
      }
    },
    warn: (...args: any[]) => {
      logger.warn(...args);
      errorCapture.addError(args.join(' '), 'warn', module);
    },
    error: (...args: any[]) => {
      logger.error(...args);
      errorCapture.addError(args.join(' '), 'error', module);
    },
  };
};
