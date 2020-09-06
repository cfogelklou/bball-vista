import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Themes } from '../themes/themes';

export type ScoreProps = {
  title?: string;
  numDigits?: number;
  containerStyle?: any;
  score: number;
};

type ScoreDimensions = {
  myWidth: number;
  myHeight: number;
};

export const Score = (props: ScoreProps) => {
  const score = props.score ? props.score : 0;
  const title = props.title ? props.title.toUpperCase() : '';

  const [titleSize, setTitleSize] = useState(1);
  const [fontSize, setFontSize] = useState(1);

  const calculateSizes = (width: number, height: number) => {
    setTitleSize(height * 0.15);
    setFontSize(height * 0.4);
  };

  return (
    <View
      style={[styles.container, { ...props.containerStyle }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        console.log('Score got layout:', event.nativeEvent.layout);
        calculateSizes(width, height);
      }}
    >
      <TouchableOpacity style={styles.black}>
        <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
        <Text style={[styles.score, { fontSize: fontSize }]}>{score}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  black: {
    backgroundColor: Themes.colors.black,
  },
  title: {
    alignSelf: 'center',
    fontFamily: 'monotype',

    color: 'white',
  },
  score: {
    alignSelf: 'center',
    fontFamily: 'EHSMB',

    color: 'green',
  },
});
