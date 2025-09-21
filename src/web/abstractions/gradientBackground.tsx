import React from 'react';
import { View, ViewStyle } from 'react-native';

interface GradientBackgroundProps {
  style?: ViewStyle;
}

/**
 * GradientBackground component for web using CSS gradient.
 * Creates a full-screen BallerCast gradient that sits behind other content.
 * Use this as a separate component on screens that need the gradient background.
 */
export function GradientBackground({ style }: GradientBackgroundProps) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          background: 'linear-gradient(to bottom, #1C1D2E 0%, #E5691A 100%)',
        } as any, // Cast to any for web-specific CSS properties
        style,
      ]}
    />
  );
}

// Export as default for compatibility
export default GradientBackground;