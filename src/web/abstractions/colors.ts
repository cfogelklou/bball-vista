/**
 * Centralized color definitions for the web app
 * Used across all StyleSheet.create() calls for consistent theming
 * Identical to mobile colors for consistency across platforms
 */

export const colors = {
  // Primary brand colors
  primary: '#ff6b35',        // Main brand orange
  white: '#ffffff',
  black: '#000000',

  // Background colors
  backgroundDark: '#1a1a1a',     // Main dark background
  backgroundMedium: '#2a2a2a',   // Medium background/cards
  backgroundLight: '#3a3a3a',    // Light background/inputs

  // Text colors
  textPrimary: '#ffffff',        // Primary text (white)
  textSecondary: '#ffffff',      // Secondary text (same as primary for now)
  textMuted: '#ffffff',          // Muted text with opacity applied separately

  // Status colors
  success: '#4CAF50',           // Green for success states
  error: '#f44336',             // Red for error states
  warning: '#ff6b35',           // Orange for warning (same as primary)
  info: '#007ACC',              // Blue for info states

  // Neutral colors
  grey: '#666666',              // Medium grey
  greyLight: '#6C757D',         // Light grey for text
  greyDark: '#444444',          // Dark grey

  // Border colors
  border: '#3a3a3a',            // Default border color
  borderLight: '#007ACC',       // Light border (info blue)

  // Transparent/overlay colors
  overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlay
  transparent: 'transparent',    // Transparent background

  // Receiver app specific colors (for compatibility)
  receiverDarkGrey: 'rgb(30,30,30)',
  receiverAlmostBlack: 'rgb(10,10,10)',
  receiverBlack: 'black',

  // Web app specific colors (for compatibility)
  webBackground: '#F8F9FA',
  webSuccess: '#E7F3FF',
} as const;

// Type for color keys to ensure type safety
export type ColorKey = keyof typeof colors;

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return `#${hex}${alpha}`;
  }
  // For rgb colors, convert to rgba
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  return color;
};