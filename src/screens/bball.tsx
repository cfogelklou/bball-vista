import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Score } from '../components/score';

export type BballProps = {
  placeholder?: string;
};

export const Bball = (props: any | BballProps) => {
  const dim = Dimensions.get('window');
  const [viewH, setViewH] = useState(dim.height);
  const [viewW, setViewW] = useState(dim.width);

  const setDims = (width: number, height: number) => {
    setViewW(width);
    setViewH(height);
  };

  return (
    <View
      style={[styles.container, { width: viewW, height: viewH }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width !== viewW || viewH !== height) {
          setDims(dim.width, dim.height);
        }
      }}
    >
      <View style={styles.scoresAndClock}>
        <Score title={'home'} score={0}></Score>
        <View style={{ flex: 1 }}></View>
        <Score title={'away'} score={0}></Score>
      </View>
      <View style={styles.periodAndBonus}></View>
      <View style={styles.foulsAndShotClock}></View>
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
    backgroundColor: Themes.colors.green,
  },
  scoresAndClock: { flexDirection: 'row', flex: 1, ...debugBorders },
  periodAndBonus: { flexDirection: 'row', flex: 0.2, ...debugBorders },
  foulsAndShotClock: { flexDirection: 'row', flex: 1, ...debugBorders },
});
