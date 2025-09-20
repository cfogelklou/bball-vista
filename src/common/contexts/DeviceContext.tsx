/**
 * Device Context - Manages unique device identifier for all apps (control and receiver)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateSimpleDeviceId, DEVICE_ID_STORAGE_KEY } from '@common/utils/deviceIdentifier';
import { StorageUtils } from '@abstractions/storage';

interface DeviceContextState {
  deviceId: string | null;
}

const DeviceContext = createContext<DeviceContextState | null>(null);

interface DeviceProviderProps {
  children: ReactNode;
}

/**
 * Device Provider - Generates and stores device ID for all apps (control and receiver)
 */
export function DeviceProvider({ children }: DeviceProviderProps) {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const initializeDeviceId = async () => {
      try {
        // Check for existing device ID
        const storedDeviceId = await StorageUtils.getItem(DEVICE_ID_STORAGE_KEY);

        if (!storedDeviceId) {
          // Generate new device ID
          const newDeviceId = generateSimpleDeviceId();
          await StorageUtils.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
          setDeviceId(newDeviceId);
          console.log('📱 Generated new device ID:', newDeviceId);
        } else {
          setDeviceId(storedDeviceId);
          console.log('📱 Loaded existing device ID:', storedDeviceId);
        }
      } catch (error) {
        console.error('Failed to initialize device ID:', error);
        // Fallback to session-only device ID
        const fallbackId = generateSimpleDeviceId();
        setDeviceId(fallbackId);
        console.log('📱 Using fallback device ID:', fallbackId);
      }
    };

    initializeDeviceId();
  }, []);

  const value: DeviceContextState = {
    deviceId,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

/**
 * Hook to get the current device ID
 */
export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}