import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Themes } from '../themes/themes';
import { Score } from '../components/score';
import { Clock } from '../components/clock';

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
  onHomeScorePress?: (rightSide: boolean) => void;
  onHomeScoreLongPress?: (rightSide: boolean) => void;
  onAwayScorePress?: (rightSide: boolean) => void;
  onAwayScoreLongPress?: (rightSide: boolean) => void;
};

const GOLDEN_RATIO = 1600 / 900; // Golden ratio

export const Scoreboard = (props: ScoreboardProps) => {
  const [width, setWidth] = useState(1.0);
  const [height, setHeight] = useState(1.0);
  const [scoreboardWidth, setScoreboardWidth] = useState(1.0);
  const [scoreboardHeight, setScoreboardHeight] = useState(1.0);
  const clock = props.clock ? props.clock : 10;

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
          <Score title={'home'} score={0} color='green'></Score>
        </View>
        <View style={{ flex: GOLDEN_RATIO }}>
          <View style={{ flex: 2 }}>
            <Clock clock={clock} color={'red'}></Clock>
          </View>
          <View style={{ flex: 1 }}>
            <Score title={'period'} score={0} color='red' isHorizontal={true}></Score>
          </View>
        </View>
        <View style={styles.scoreAndBonus}>
          <Score title={'away'} score={0} color='green'></Score>
        </View>
      </View>
      <View style={styles.spacer}></View>

      <View style={styles.foulsAndShotClock}>
        <View style={styles.foulsAndShotClockRow}>
          <Score title={'fouls'} score={0} color='yellow'></Score>
        </View>
        <View style={styles.foulsAndShotClockRow}>
          <Score title={'shot'} score={24} color='red'></Score>
        </View>
        <View style={styles.foulsAndShotClockRow}>
          <Score title={'fouls'} score={0} color='yellow'></Score>
        </View>
      </View>
    </View>
  );
};

const debugBorders = {
  //borderWidth: 1,
  //borderColor: 'red',
};
const styles = StyleSheet.create({
  container: {
    backgroundColor: Themes.colors.almost_black,
  },
  scoresAndClock: { flexDirection: 'row', flex: 1.4, ...debugBorders },
  spacer: { flex: 0.2, borderTopWidth: 1, borderTopColor: 'white' },
  scoreAndBonus: { flex: 1, ...debugBorders },
  foulsAndShotClock: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    ...debugBorders,
  },
  foulsAndShotClockRow: { flex: 1 },
});
