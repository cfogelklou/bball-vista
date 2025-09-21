import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { ErrorMessage } from '../../components/ErrorOverlay';

export interface ErrorManagerContextValue {
  errors: ErrorMessage[];
  addError: (message: string, level: ErrorMessage['level'], source?: string) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  isOverlayVisible: boolean;
  showOverlay: () => void;
  hideOverlay: () => void;
  toggleOverlay: () => void;
}

const ErrorManagerContext = createContext<ErrorManagerContextValue | undefined>(undefined);

export interface ErrorManagerProviderProps {
  children: React.ReactNode;
  maxErrors?: number;
  autoShowOnError?: boolean;
  autoHideDelay?: number;
}

export const ErrorManagerProvider: React.FC<ErrorManagerProviderProps> = ({
  children,
  maxErrors = 50,
  autoShowOnError = true,
  autoHideDelay = 10000, // 10 seconds
}) => {
  const [errors, setErrors] = useState<ErrorMessage[]>([]);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const errorIdCounter = useRef(0);
  const autoHideTimeoutRef = useRef<number | null>(null);

  const generateId = (): string => {
    errorIdCounter.current += 1;
    return `error-${errorIdCounter.current}-${Date.now()}`;
  };

  const addError = useCallback((
    message: string, 
    level: ErrorMessage['level'] = 'error', 
    source?: string
  ) => {
    const newError: ErrorMessage = {
      id: generateId(),
      message,
      level,
      timestamp: new Date(),
      source,
    };

    setErrors((prevErrors) => {
      const updatedErrors = [...prevErrors, newError];
      // Keep only the most recent maxErrors
      return updatedErrors.slice(-maxErrors);
    });

    // Auto-show overlay for errors and warnings
    if (autoShowOnError && (level === 'error' || level === 'warn')) {
      setIsOverlayVisible(true);

      // Clear any existing auto-hide timeout
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }

      // Set new auto-hide timeout
      if (autoHideDelay > 0) {
        autoHideTimeoutRef.current = window.setTimeout(() => {
          setIsOverlayVisible(false);
          autoHideTimeoutRef.current = null;
        }, autoHideDelay);
      }
    }
  }, [maxErrors, autoShowOnError, autoHideDelay]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors((prevErrors) => prevErrors.filter(error => error.id !== id));
  }, []);

  const showOverlay = useCallback(() => {
    setIsOverlayVisible(true);
    
    // Clear auto-hide timeout when manually showing
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }
  }, []);

  const hideOverlay = useCallback(() => {
    setIsOverlayVisible(false);
    
    // Clear auto-hide timeout when manually hiding
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
      autoHideTimeoutRef.current = null;
    }
  }, []);

  const toggleOverlay = useCallback(() => {
    if (isOverlayVisible) {
      hideOverlay();
    } else {
      showOverlay();
    }
  }, [isOverlayVisible, hideOverlay, showOverlay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: ErrorManagerContextValue = {
    errors,
    addError,
    clearErrors,
    clearError,
    isOverlayVisible,
    showOverlay,
    hideOverlay,
    toggleOverlay,
  };

  return (
    <ErrorManagerContext.Provider value={contextValue}>
      {children}
    </ErrorManagerContext.Provider>
  );
};

export const useErrorManager = (): ErrorManagerContextValue => {
  const context = useContext(ErrorManagerContext);
  if (!context) {
    throw new Error('useErrorManager must be used within an ErrorManagerProvider');
  }
  return context;
};

// Convenience hooks for specific error types
export const useErrorLogger = () => {
  const { addError } = useErrorManager();
  
  return {
    logError: (message: string, source?: string) => addError(message, 'error', source),
    logWarning: (message: string, source?: string) => addError(message, 'warn', source),
    logInfo: (message: string, source?: string) => addError(message, 'info', source),
    logDebug: (message: string, source?: string) => addError(message, 'debug', source),
  };
};

// Hook to create a logger for a specific source/module
export const useModuleLogger = (moduleName: string) => {
  const { addError } = useErrorManager();
  
  return {
    logError: (message: string) => addError(message, 'error', moduleName),
    logWarning: (message: string) => addError(message, 'warn', moduleName),
    logInfo: (message: string) => addError(message, 'info', moduleName),
    logDebug: (message: string) => addError(message, 'debug', moduleName),
  };
};