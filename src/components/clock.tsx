import React, { useState } from 'react';

import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Themes } from '../themes/themes';

export type ClockProps = {
  containerStyle?: any;
  clock: number;
  color?: string;
  onPressRight?: () => void;
  onPressLeft?: () => void;
  onLongPressRight?: () => void;
  onLongPressLeft?: () => void;
};

type ClockDimensions = {
  myWidth: number;
  myHeight: number;
};

function clockToString(c: number, showTensAlways: boolean = false) {
  let d = c;
  let tens = 0;
  let ones = 0;
  if (showTensAlways) {
    tens = Math.floor(d / 10) % 10;
    d = d - tens * 10;
    ones = Math.floor(d / 1) % 10;
  } else {
    ones = Math.floor(d / 1);
  }
  d = d - ones * 1;
  const tenths = Math.floor(d * 10) % 10;
  d = d - tenths / 10;
  const hundredths = Math.floor(d * 100) % 10;
  d = d - hundredths / 100;
  if (showTensAlways) {
    return tens.toString() + ones.toString() + ':' + tenths.toString() + hundredths.toString();
  } else {
    return ones.toString() + ':' + tenths.toString() + hundredths.toString();
  }
}

export const Clock = (props: ClockProps) => {
  // xx.xx
  const clock = props.clock ? props.clock : 0;
  const color = props.color ? props.color : 'green';

  const [fontSize, setFontSize] = useState(1);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [margin, setMargin] = useState(1);

  const onPress = (isLeft: boolean) => {
    const cb = isLeft ? props.onPressLeft : props.onPressRight;
    if (cb) {
      cb();
    }
  };

  const onLongPress = (isLeft: boolean) => {
    const cb = isLeft ? props.onLongPressLeft : props.onLongPressRight;
    if (cb) {
      cb();
    }
  };

  const calculateSizes = (width: number, height: number) => {
    setFontSize(height * 0.5);
    setWidth(width);
    setHeight(height);
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
            <Text style={[styles.clock, { fontSize: fontSize, color: color }]}>
              {clockToString(clock)}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          onPress(false);
        }}
        onLongPress={() => {
          onLongPress(false);
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width / 2,
          height: height,
        }}
      ></TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          onPress(true);
        }}
        onLongPress={() => {
          onLongPress(true);
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: width / 2,
          width: width / 2,
          height: height,
        }}
      ></TouchableOpacity>
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
