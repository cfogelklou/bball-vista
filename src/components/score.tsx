import React, { useState } from 'react';

import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Themes } from '../themes/themes';

export type ScoreProps = {
  title?: string;
  numDigits?: number;
  containerStyle?: any;
  score: number;
  color?: string;
  onPressRight?: () => void;
  onPressLeft?: () => void;
  onLongPressRight?: () => void;
  onLongPressLeft?: () => void;
};

type ScoreDimensions = {
  myWidth: number;
  myHeight: number;
};

export const Score = (props: ScoreProps) => {
  const score = props.score ? props.score : 0;
  const title = props.title ? props.title.toUpperCase() : '';
  const color = props.color ? props.color : 'green';

  const [titleSize, setTitleSize] = useState(1);
  const [fontSize, setFontSize] = useState(1);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [margin, setMargin] = useState(1);

  const calculateSizes = (width: number, height: number) => {
    setTitleSize(height * 0.15);
    setFontSize(height * 0.4);
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
          console.log('Score got layout:', event.nativeEvent.layout);
          calculateSizes(width, height);
        }}
      >
        <View style={styles.black}>
          <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
          <View style={[styles.scoreView, { margin: margin }]}>
            <Text style={[styles.score, { fontSize: fontSize, color: color }]}>{score}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: width / 2,
          height: height,
          borderWidth: 1,
          borderColor: 'green',
        }}
      ></TouchableOpacity>
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 0,
          left: width / 2,
          width: width / 2,
          height: height,
          borderWidth: 1,
          borderColor: 'green',
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
  scoreView: {
    alignSelf: 'stretch',
    backgroundColor: Themes.colors.black,
  },
  score: {
    alignSelf: 'center',
    fontFamily: 'ehsmb',
  },
});
