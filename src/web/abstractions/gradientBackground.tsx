import React from 'react';
import { View, ViewStyle } from 'react-native';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * GradientBackground component for web using CSS gradient.
 * Creates the BallerCast gradient from dark blue to dark orange.
 */
export function GradientBackground({ children, style }: GradientBackgroundProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundImage: 'linear-gradient(to bottom, #1C1D2E, #4A2F1A)',
        } as any, // Cast to any for web-specific CSS properties
        style
      ]}
    >
      {children}
    </View>
  );
}