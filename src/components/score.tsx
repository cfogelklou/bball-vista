import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Themes } from '../themes/themes';

export type ScoreProps = {
  title?: string;
  numDigits?: number;
  containerStyle?: any;
  score: number;
};

export const Score = (props: ScoreProps) => {
  const score = props.score ? props.score : 0;
  return (
    <View
      style={[styles.container, { ...props.containerStyle }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        console.log('Score got layout:', event.nativeEvent.layout);
      }}
    >
      <View style={styles.black}>
        ({props.title && <Text style={styles.score}>{props.title}</Text>})
        <Text style={styles.score}>{score}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  black: {
    backgroundColor: Themes.colors.black,
  },
  score: {
    alignSelf: 'center',
    fontFamily: 'monotype',
    color: 'white',
  },
});
