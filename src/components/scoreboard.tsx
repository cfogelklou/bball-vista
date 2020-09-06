import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Themes } from '../themes/themes';
import { Score } from '../components/score';

export type ScoreboardProps = {
  width: number;
  height: number;
  homeScore?: number;
  awayScore?: number;
  homeFouls?: number;
  awayFouls?: number;
  possessionHome?: boolean;
  clock?: number;
  shotClock?: number;
  period?: number;
};

const GOLDEN_RATIO = 1.414; // Golden ratio

export const Scoreboard = (props: ScoreboardProps) => {
  const [width, setWidth] = useState(1.0);
  const [height, setHeight] = useState(1.0);
  const [scoreboardWidth, setScoreboardWidth] = useState(1.0);
  const [scoreboardHeight, setScoreboardHeight] = useState(1.0);

  const windowResized = (width: number, height: number) => {
    let w = height * GOLDEN_RATIO;
    let h = width / GOLDEN_RATIO;
    if (width < w) {
      // Width is the limiting factor, rescale height
      w = width;
    } else {
      h = height;
    }
    setScoreboardWidth(w);
    setScoreboardHeight(h);

    setWidth(props.width);
    setHeight(props.height);
  };

  if (props.width !== width || props.height !== height) {
    windowResized(props.width, props.height);
  }

  return (
    <View style={{ width: scoreboardWidth, height: scoreboardHeight }}>
      <View style={styles.scoresAndClock}>
        <View style={styles.scoreAndBonus}>
          <Score title={'home'} score={0}></Score>
        </View>
        <View style={{ flex: GOLDEN_RATIO }}></View>
        <View style={styles.scoreAndBonus}>
          <Score title={'away'} score={0}></Score>
        </View>
      </View>

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
    backgroundColor: Themes.colors.almost_black,
  },
  scoresAndClock: { flexDirection: 'row', flex: 1, ...debugBorders },
  scoreAndBonus: { flex: 1, ...debugBorders },
  foulsAndShotClock: { flexDirection: 'row', flex: 1, ...debugBorders },
});
