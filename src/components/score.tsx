import React, { useState, memo } from 'react';

import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Themes } from '../themes/themes';

export type ScoreProps = {
  title?: string;
  numDigits?: number;
  containerStyle?: any;
  score: number;
  color?: string;
  isHorizontal?: boolean;
  onPressRight?: () => void;
  onPressLeft?: () => void;
  onLongPressRight?: () => void;
  onLongPressLeft?: () => void;
};

export const _Score = (props: ScoreProps) => {
  const score = props.score ? props.score : 0;
  const title = props.title ? props.title.toUpperCase() : '';
  const color = props.color ? props.color : 'green';

  const [titleSize, setTitleSize] = useState(1);
  const [fontSize, setFontSize] = useState(1);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [margin, setMargin] = useState(1);

  const handleOnPress = (isLeft: boolean) => {
    const cb = isLeft ? props.onPressLeft : props.onPressRight;
    if (cb) {
      cb();
    }
  };

  const handleOnLongPress = (isLeft: boolean) => {
    const cb = isLeft ? props.onLongPressLeft : props.onLongPressRight;
    if (cb) {
      cb();
    }
  };

  const calculateSizes = (width: number, height: number, isHorizontal?: boolean) => {
    const multiply = isHorizontal ? 2 : 1;
    setTitleSize(height * 0.15 * multiply);
    setFontSize(height * 0.4 * multiply);
    setWidth(width);
    setHeight(height);
    setMargin(height * 0.05 * multiply);
  };

  const titleAndScore = props.isHorizontal ? styles.titleAndScoreHoriz : styles.titleAndScore;

  return (
    <>
      <View
        style={[styles.container, { ...props.containerStyle }]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          console.log('Score got layout:', event.nativeEvent.layout);
          calculateSizes(width, height, props.isHorizontal);
        }}
      >
        <View style={titleAndScore}>
          <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
          <View style={[styles.scoreView, { margin: margin }]}>
            <Text style={[styles.score, { fontSize: fontSize, color: color }]}>{score}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          handleOnPress(true);
        }}
        onLongPress={() => {
          handleOnLongPress(true);
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
          handleOnPress(false);
        }}
        onLongPress={() => {
          handleOnLongPress(false);
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

export const Score = memo(_Score);

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleAndScore: {
    backgroundColor: Themes.colors.almost_black,
    alignSelf: 'stretch',
  },
  titleAndScoreHoriz: {
    backgroundColor: Themes.colors.almost_black,
    flexDirection: 'row',
    alignSelf: 'center',
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
