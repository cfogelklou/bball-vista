import React, { useState, memo, useEffect, useRef } from 'react';

import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Themes } from '../themes/themes';

export type ScoreProps = {
  title?: string;
  numDigits?: number;
  containerStyle?: any;
  score?: number;
  scoreText?: string;
  color?: string;
  isHorizontal?: boolean;
  subtitle?: string;
  onPressRight?: () => void;
  onPressLeft?: () => void;
  onLongPressRight?: () => void;
  onLongPressLeft?: () => void;
  onPressIn?: (rightSide: boolean) => void;
  onPressOut?: (rightSide: boolean) => void;
};

export const Score = (props: ScoreProps) => {
  const score = props.score ? props.score : 0;
  const scoreText = props.scoreText ? props.scoreText : score.toString();
  const title = props.title ? props.title.toUpperCase() : '';
  const color = props.color ? props.color : 'green';

  const [titleSize, setTitleSize] = useState(1);
  const [subTitleSize, setSubTitleSize] = useState(1);
  const [fontSize, setFontSize] = useState(1);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [margin, setMargin] = useState(1);

  function handleOnPress(cb?: () => void) {
    if (cb) {
      cb();
    }
  }

  function handleOnPressInOut(rightSide: boolean, cb?: (rightSide: boolean) => void) {
    if (cb) {
      cb(rightSide);
    }
  }

  const calculateSizes = (width: number, height: number, isHorizontal?: boolean) => {
    const multiply = isHorizontal ? 2 : 1;
    setTitleSize(height * 0.15 * multiply);
    setFontSize(height * 0.4 * multiply);
    setWidth(width);
    setHeight(height);
    setMargin(height * 0.05 * multiply);
    setSubTitleSize(height * 0.1 * multiply);
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
            <Text style={[styles.score, { fontSize: fontSize, color: color }]}>{scoreText}</Text>
          </View>
          <Text style={[styles.subtitle, { fontSize: subTitleSize, color: color }]}>
            {props.subtitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            console.log('onPressLeft');
            handleOnPress(props.onPressLeft);
          }}
          onLongPress={() => {
            handleOnPress(props.onLongPressLeft);
          }}
          onPressIn={() => {
            handleOnPressInOut(false, props.onPressIn);
          }}
          onPressOut={() => {
            handleOnPressInOut(false, props.onPressOut);
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
            console.log('onPressRight');
            handleOnPress(props.onPressRight);
          }}
          onLongPress={() => {
            handleOnPress(props.onLongPressRight);
          }}
          onPressIn={() => {
            handleOnPressInOut(true, props.onPressIn);
          }}
          onPressOut={() => {
            handleOnPressInOut(true, props.onPressOut);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: width / 2,
            width: width / 2,
            height: height,
          }}
        ></TouchableOpacity>
      </View>
    </>
  );
};

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
  subtitle: {
    fontFamily: 'monotype',
    backgroundColor: Themes.colors.almost_black,
    alignSelf: 'center',
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
