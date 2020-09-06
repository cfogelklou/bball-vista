import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Scoreboard } from '../components/scoreboard';

export type BballProps = {
  placeholder?: string;
};

export const Bball = (props: any | BballProps) => {
  const dim = Dimensions.get('window');

  return (
    <View style={[styles.container, { width: dim.width, height: dim.height }]}>
      <Scoreboard width={dim.width} height={dim.height} />
    </View>
  );
};

const debugBorders = {
  borderWidth: 1,
  borderColor: 'red',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Themes.colors.almost_black,
  },
  scoresAndClock: { flexDirection: 'row', flex: 1, ...debugBorders },
  periodAndBonus: { flexDirection: 'row', flex: 0.2, ...debugBorders },
  foulsAndShotClock: { flexDirection: 'row', flex: 1, ...debugBorders },
});
