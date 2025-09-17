import React from 'react';
import { Text, StyleSheet } from 'react-native';

export type GameIdDisplayProps = {
  gameId?: string | null;
  sessionUuid?: string | null;
};

export const GameIdDisplay: React.FC<GameIdDisplayProps> = ({ gameId, sessionUuid }) => {
  // Don't show in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return null;
  }

  // Prefer gameId if available, otherwise show first 8 chars of UUID
  const displayId = gameId || (sessionUuid ? sessionUuid.substring(0, 8) : null);

  if (!displayId) {
    return null;
  }

  return (
    <Text style={styles.gameIdText}>
      {gameId ? `Game: ${gameId}` : `ID: ${displayId}`}
    </Text>
  );
};

const styles = StyleSheet.create({
  gameIdText: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
    zIndex: 1000,
  },
});