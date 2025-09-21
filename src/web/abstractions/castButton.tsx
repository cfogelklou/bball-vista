/**
 * Web CastButton abstraction
 * Dummy implementation for web platform where Google Cast is not available
 */

import React from 'react';

export interface CastButtonProps {
  style?: React.CSSProperties;
  size?: number;
  label?: string;
}

export const CastButton: React.FC<CastButtonProps> = ({ style, size, label }) => {
  // On web, we don't support Google Cast, so return null
  // This could be replaced with a web-specific cast solution in the future
  return null;
};

export default CastButton;