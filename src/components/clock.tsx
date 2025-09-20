import React, { useState } from 'react';

import { View, StyleSheet, Text } from 'react-native';
import { Themes } from '../themes/themes';

export type ClockProps = {
  containerStyle?: any;
  clock: string;
  color?: string;
};

export const Clock = (props: ClockProps) => {
  // xx.xx
  const clock = props.clock ? props.clock : 0;
  const color = props.color ? props.color : 'green';

  const [fontSize, setFontSize] = useState(1);
  const [margin, setMargin] = useState(1);


  const calculateSizes = (width: number, height: number) => {
    setFontSize(height * 0.5);
    setMargin(height * 0.05);
  };

  return (
    <>
      <View
        style={[styles.container, { ...props.containerStyle }]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          console.log('Clock got layout:', event.nativeEvent.layout);
          calculateSizes(width, height);
        }}
      >
        <View style={styles.black}>
          <View style={[styles.clockView, { margin: margin }]}>
            <Text style={[styles.clock, { fontSize: fontSize, color: color }]}>{clock}</Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  black: {
    backgroundColor: Themes.colors.almost_black,
    alignSelf: 'stretch',
  },
  title: {
    fontFamily: 'monotype',
    backgroundColor: Themes.colors.almost_black,
    alignSelf: 'center',
    color: 'white',
  },
  clockView: {
    alignSelf: 'stretch',
    backgroundColor: Themes.colors.black,
    borderWidth: 1,
    borderColor: 'white',
  },
  clock: {
    alignSelf: 'center',
    fontFamily: 'ehsmb',
  },
});
