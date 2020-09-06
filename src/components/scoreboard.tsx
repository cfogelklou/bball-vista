import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Themes } from '../themes/themes';
import { Score } from '../components/score';
import { Clock } from '../components/clock';
import deepEqual from 'deep-equal';

export type BballGameState = {
  homePoints: number;
  awayPoints: number;
  homeFouls: number;
  awayFouls: number;
  clock: number;
  shotClock: number;
  period: number;
};

export const defaultGameState: BballGameState = {
  homePoints: 0,
  awayPoints: 0,
  homeFouls: 0,
  awayFouls: 0,
  clock: 10,
  shotClock: 24,
  period: 0,
};

export type ScoreboardProps = {
  width: number;
  height: number;
  gameState: BballGameState;
  onHomeScorePress?: (rightSide: boolean) => void;
  onHomeScoreLongPress?: (rightSide: boolean) => void;
  onAwayScorePress?: (rightSide: boolean) => void;
  onAwayScoreLongPress?: (rightSide: boolean) => void;
  onHomeFoulsPress?: (rightSide: boolean) => void;
  onHomeFoulsLongPress?: (rightSide: boolean) => void;
  onAwayFoulsPress?: (rightSide: boolean) => void;
  onAwayFoulsLongPress?: (rightSide: boolean) => void;
};

const GOLDEN_RATIO = 1600 / 900; // Golden ratio

export const Scoreboard = (props: ScoreboardProps) => {
  const [width, setWidth] = useState(1.0);
  const [height, setHeight] = useState(1.0);
  const [scoreboardWidth, setScoreboardWidth] = useState(1.0);
  const [scoreboardHeight, setScoreboardHeight] = useState(1.0);
  const [gameState, setGameState] = useState<BballGameState>(defaultGameState);

  //if (gameState != props.gameState) {
  if (!deepEqual(gameState, props.gameState)) {
    setGameState({ ...props.gameState });
  }

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

  function handleOnPress(rightSide: boolean, fn?: (rightSide: boolean) => void) {
    if (fn) {
      fn(rightSide);
    }
  }

  return (
    <View style={{ width: scoreboardWidth, height: scoreboardHeight }}>
      <View style={styles.scoresAndClock}>
        <View style={styles.scoreAndBonus}>
          <Score
            title={'home'}
            score={gameState.homePoints}
            color='green'
            onPressRight={() => {
              handleOnPress(true, props.onHomeScorePress);
            }}
            onPressLeft={() => {
              handleOnPress(false, props.onHomeScorePress);
            }}
            onLongPressRight={() => {
              handleOnPress(true, props.onHomeScoreLongPress);
            }}
            onLongPressLeft={() => {
              handleOnPress(false, props.onHomeScoreLongPress);
            }}
          ></Score>
        </View>
        <View style={{ flex: GOLDEN_RATIO }}>
          <View style={{ flex: 2 }}>
            <Clock clock={gameState.clock} color={'red'}></Clock>
          </View>
          <View style={{ flex: 1 }}>
            <Score
              title={'period'}
              score={gameState.period}
              color='red'
              isHorizontal={true}
            ></Score>
          </View>
        </View>
        <View style={styles.scoreAndBonus}>
          <Score
            title={'away'}
            score={gameState.awayPoints}
            color='green'
            onPressRight={() => {
              handleOnPress(true, props.onAwayScorePress);
            }}
            onPressLeft={() => {
              handleOnPress(false, props.onAwayScorePress);
            }}
            onLongPressRight={() => {
              handleOnPress(true, props.onAwayScoreLongPress);
            }}
            onLongPressLeft={() => {
              handleOnPress(false, props.onAwayScoreLongPress);
            }}
          ></Score>
        </View>
      </View>
      <View style={styles.spacer}></View>

      <View style={styles.foulsAndShotClock}>
        <View style={styles.foulsAndShotClockRow}>
          <Score
            title={'fouls'}
            score={gameState.homeFouls}
            color='yellow'
            onPressRight={() => {
              handleOnPress(true, props.onHomeFoulsPress);
            }}
            onPressLeft={() => {
              handleOnPress(false, props.onHomeFoulsPress);
            }}
            onLongPressRight={() => {
              handleOnPress(true, props.onHomeFoulsLongPress);
            }}
            onLongPressLeft={() => {
              handleOnPress(false, props.onHomeFoulsLongPress);
            }}
          ></Score>
        </View>
        <View style={styles.foulsAndShotClockRow}>
          <Score title={'shot'} score={gameState.shotClock} color='red'></Score>
        </View>
        <View style={styles.foulsAndShotClockRow}>
          <Score
            title={'fouls'}
            score={gameState.awayFouls}
            color='yellow'
            onPressRight={() => {
              handleOnPress(true, props.onAwayFoulsPress);
            }}
            onPressLeft={() => {
              handleOnPress(false, props.onAwayFoulsPress);
            }}
            onLongPressRight={() => {
              handleOnPress(true, props.onAwayFoulsLongPress);
            }}
            onLongPressLeft={() => {
              handleOnPress(false, props.onAwayFoulsLongPress);
            }}
          ></Score>
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
