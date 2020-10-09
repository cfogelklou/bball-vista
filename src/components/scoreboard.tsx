import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Themes } from '../themes/themes';
import { Score } from '../components/score';
import { Clock } from '../components/clock';
import { FontAwesome } from '../components/vector-icons';
import deepEqual from 'deep-equal';
import {
  BballGameState,
  defaultGameState,
  getClockString,
  getShotClockString,
} from '../bball_logic';

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
  onPeriodPress?: (rightSide: boolean) => void;
  onPeriodLongPress?: (rightSide: boolean) => void;
  onClockPress?: (rightSide: boolean) => void;
  onClockLongPress?: (rightSide: boolean) => void;
  onShotClockPress?: (rightSide: boolean) => void;
  onShotClockLongPress?: (rightSide: boolean) => void;
  onShotClockPressIn?: (rightSide: boolean) => void;
  onShotClockPressOut?: (rightSide: boolean) => void;
  onPossessionArrow?: (rightSide: boolean) => void;
};

const GOLDEN_RATIO = 1600 / 900; // Golden ratio

export const Scoreboard = (props: ScoreboardProps) => {
  const [width, setWidth] = useState(1.0);
  const [height, setHeight] = useState(1.0);
  const [caretSize, setCaretSize] = useState(1.0);
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

    setWidth(width);
    setHeight(height);
  };

  if (props.width !== width || props.height !== height) {
    windowResized(props.width, props.height);
  }

  function handleOnPress(rightSide: boolean, fn?: (rightSide: boolean) => void) {
    if (fn) {
      fn(rightSide);
    }
  }

  const bonusAway = gameState.homeFouls >= 5 ? 'BONUS' : '';
  const bonusHome = gameState.awayFouls >= 5 ? 'BONUS' : '';
  const homePossColor = gameState.possessionHome ? 'red' : Themes.colors.dark_grey;
  const awayPossColor = !gameState.possessionHome ? 'red' : Themes.colors.dark_grey;

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
            <Clock
              clock={getClockString(gameState.clockMs)}
              color={'red'}
              onPressRight={() => {
                handleOnPress(true, props.onClockPress);
              }}
              onPressLeft={() => {
                handleOnPress(false, props.onClockPress);
              }}
              onLongPressRight={() => {
                handleOnPress(true, props.onClockLongPress);
              }}
              onLongPressLeft={() => {
                handleOnPress(false, props.onClockLongPress);
              }}
            ></Clock>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ height: '100%', flexDirection: 'row' }}>
              <TouchableOpacity
                style={styles.possessionArrowView}
                onLayout={(a: any) => {
                  console.log('Got layout:', a.nativeEvent.layout);
                  const size = Math.min(a.nativeEvent.layout.width, a.nativeEvent.layout.height);
                  setCaretSize(size * 0.7);
                }}
                onPress={() => {
                  handleOnPress(false, props.onPossessionArrow);
                }}
              >
                <FontAwesome
                  name='caret-left'
                  color={homePossColor}
                  size={caretSize}
                  style={{ alignSelf: 'flex-start' }}
                />
              </TouchableOpacity>

              <Score
                title={'period'}
                score={gameState.period}
                color='red'
                isHorizontal={true}
                onPressRight={() => {
                  handleOnPress(true, props.onPeriodPress);
                }}
                onPressLeft={() => {
                  handleOnPress(false, props.onPeriodPress);
                }}
                onLongPressRight={() => {
                  handleOnPress(true, props.onPeriodLongPress);
                }}
                onLongPressLeft={() => {
                  handleOnPress(false, props.onPeriodLongPress);
                }}
              ></Score>
              <TouchableOpacity
                style={styles.possessionArrowView}
                onPress={() => {
                  handleOnPress(true, props.onPossessionArrow);
                }}
              >
                <FontAwesome
                  name='caret-right'
                  color={awayPossColor}
                  size={caretSize}
                  style={{ alignSelf: 'flex-end' }}
                />
              </TouchableOpacity>
            </View>
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
            subtitle={bonusHome}
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
          <Score
            title={'shot'}
            scoreText={getShotClockString(gameState.shotClockMs)}
            color='red'
            onPressRight={() => {
              handleOnPress(true, props.onShotClockPress);
            }}
            onPressLeft={() => {
              handleOnPress(false, props.onShotClockPress);
            }}
            onLongPressRight={() => {
              handleOnPress(true, props.onShotClockLongPress);
            }}
            onLongPressLeft={() => {
              handleOnPress(false, props.onShotClockLongPress);
            }}
            onPressIn={(rightSide: boolean) => {
              handleOnPress(rightSide, props.onShotClockPressIn);
            }}
            onPressOut={(rightSide: boolean) => {
              handleOnPress(rightSide, props.onShotClockPressOut);
            }}
          ></Score>
        </View>
        <View style={styles.foulsAndShotClockRow}>
          <Score
            title={'fouls'}
            subtitle={bonusAway}
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
  possessionArrowView: { flex: 0.5, ...debugBorders },
  foulsAndShotClock: {
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    ...debugBorders,
  },
  foulsAndShotClockRow: { flex: 1 },
});
