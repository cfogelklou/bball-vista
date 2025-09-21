/**
 * Unified BallerCast Color System
 * Shared across all apps (PWA, Mobile, Web)
 * 
 * This consolidates all color definitions to ensure consistency
 * across different platforms and components.
 */

export const ballercastColors = {
  // === BRAND COLORS ===
  // Primary brand colors (BallerCast Blue)
  primary: '#0D6EFD',           // BallerCast blue
  primaryVariant: '#0056CC',    // Darker blue
  onPrimary: '#FFFFFF',

  // Secondary brand colors (BallerCast Orange)
  secondary: '#FD7E14',         // BallerCast orange
  secondaryVariant: '#E5691A',  // Darker orange
  onSecondary: '#FFFFFF',

  // === BACKGROUND COLORS ===
  background: '#1C1D2E',        // Dark base background
  backgroundGradientStart: '#1C1D2E',
  backgroundGradientEnd: '#4A2F1A',
  backgroundDark: '#1a1a1a',     // Main dark background (mobile)
  backgroundMedium: '#2a2a2a',   // Medium background/cards
  backgroundLight: '#3a3a3a',    // Light background/inputs
  
  surface: '#FFFFFF',           // Light surface (cards, sheets)
  surfaceDark: '#2A2A2A',      // Dark surface variant

  // === TEXT COLORS ===
  textPrimary: '#ffffff',        // Primary text (white) - updated for dark theme
  textOnDark: '#FFFFFF',         // Main text on dark surfaces
  textOnLight: '#212529',        // Main text on light surfaces
  textSecondary: '#6C757D',      // Secondary/muted text
  textMuted: '#ffffff',          // Muted text (with opacity applied separately)
  textDisabled: '#A0A0A0',       // Disabled text

  // === STATUS COLORS ===
  success: '#4CAF50',           // Green for success states
  error: '#f44336',             // Red for error states (mobile version)
  errorAlt: '#B00020',          // Alternative red (web version)
  warning: '#FF9800',           // Amber for warnings
  warningAlt: '#ff6b35',        // Alternative orange warning
  info: '#2196F3',              // Blue for info states
  infoAlt: '#007ACC',           // Alternative blue (mobile version)

  // === NEUTRAL COLORS ===
  white: '#ffffff',
  black: '#000000',
  neutral: '#6C757D',           // Gray for tertiary elements
  neutralLight: '#E0E0E0',      // Light gray
  neutralDark: '#424242',       // Dark gray
  grey: '#666666',              // Medium grey
  greyLight: '#6C757D',         // Light grey for text
  greyDark: '#444444',          // Dark grey

  // === BORDER AND OUTLINE COLORS ===
  outline: '#6C757D',
  border: '#E0E0E0',            // Default light border
  borderDark: '#3A3A3A',        // Dark border
  borderLight: '#007ACC',       // Light border (info blue)

  // === TRANSPARENCY AND OVERLAY ===
  overlay: 'rgba(0, 0, 0, 0.8)',
  transparent: 'transparent',
  whiteTransparent10: 'rgba(255, 255, 255, 0.1)',
  whiteTransparent20: 'rgba(255, 255, 255, 0.2)',
  white20: 'rgba(255, 255, 255, 0.2)', // Alias for whiteTransparent20

  // === COMPONENT-SPECIFIC COLORS ===
  buttonDisabled: '#E0E0E0',
  buttonDisabledText: '#A0A0A0',

  // === LEGACY COMPATIBILITY COLORS ===
  // (Keep for backward compatibility, gradually phase out)
  receiverDarkGrey: 'rgb(30,30,30)',
  receiverAlmostBlack: 'rgb(10,10,10)',
  receiverBlack: 'black',
  webBackground: '#F8F9FA',
  webSuccess: '#E7F3FF',
} as const;

// === ALIASES FOR BACKWARD COMPATIBILITY ===
// Export both naming conventions to ease transition
export const colors = ballercastColors;

// === TYPE DEFINITIONS ===
export type BallerCastColor = keyof typeof ballercastColors;
export type ColorKey = keyof typeof colors;

// === UTILITY FUNCTIONS ===

/**
 * Helper function to get color with opacity
 * @param color - The color to modify
 * @param opacity - Opacity value between 0 and 1
 * @returns Color string with applied opacity
 */
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

/**
 * Get a color by key with fallback
 * @param colorKey - The color key to retrieve
 * @param fallback - Fallback color if key doesn't exist
 * @returns Color string
 */
export const getColor = (colorKey: keyof typeof ballercastColors, fallback: string = '#000000'): string => {
  return ballercastColors[colorKey] || fallback;
};

// === THEME VARIATIONS ===
export const lightTheme = {
  ...ballercastColors,
  background: ballercastColors.surface,
  textPrimary: ballercastColors.textOnLight,
  surface: ballercastColors.surface,
};

export const darkTheme = {
  ...ballercastColors,
  background: ballercastColors.backgroundDark,
  textPrimary: ballercastColors.textOnDark,
  surface: ballercastColors.surfaceDark,
};

export default ballercastColors;