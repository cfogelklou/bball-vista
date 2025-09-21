import { useEffect } from 'react';
import { ErrorCaptureAPI, CapturedError } from '../utils/debug';
import { useErrorManager } from '../contexts/ErrorManagerContext';

/**
 * Bridge component that connects the debug system's error capture
 * to the React error management context
 */
export const ErrorCaptureIntegration: React.FC = () => {
  const { addError } = useErrorManager();

  useEffect(() => {
    // Add existing errors to the error manager
    const existingErrors = ErrorCaptureAPI.getErrors();
    existingErrors.forEach((capturedError: CapturedError) => {
      addError(capturedError.message, capturedError.level, capturedError.source);
    });

    // Listen for new errors from the debug system
    const removeListener = ErrorCaptureAPI.addListener((capturedError: CapturedError) => {
      addError(capturedError.message, capturedError.level, capturedError.source);
    });

    // Cleanup listener on unmount
    return removeListener;
  }, [addError]);

  // This component doesn't render anything visible
  return null;
};