/**
 * Web CastButton abstraction
 * Dummy implementation for web platform where Google Cast is not available
 */

import React from 'react';

interface CastButtonProps {
  style?: React.CSSProperties;
}

export const CastButton: React.FC<CastButtonProps> = ({ style }) => {
  // On web, we don't support Google Cast, so return null
  // This could be replaced with a web-specific cast solution in the future
  return null;
};

export default CastButton;