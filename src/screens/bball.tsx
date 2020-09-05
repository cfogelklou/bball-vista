import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';

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
      <Text>Bball Scoreboard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Themes.colors.green,
  },
});
