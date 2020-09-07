import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Scoreboard } from '../components/scoreboard';
import { BballLogic, BballGameState } from '../bball_logic';
import deepEqual from 'deep-equal';

export type BballProps = {
  placeholder?: string;
};

const SHOT_CLOCK_NOT_PRESSED = 0;
const SHOT_CLOCK_PRESSED_LEFT = 1;
const SHOT_CLOCK_PRESSED_RIGHT = 2;

let shotClockPressedIn = SHOT_CLOCK_NOT_PRESSED;

export const Bball = (props: any | BballProps) => {
  const dim = Dimensions.get('window');
  const [count, setCount] = useState(0);

  const [gameState, setGameState] = useState(
    BballLogic.getInst((state: BballGameState) => {
      setGameState(state);
    }).getState(),
  );

  function setGameStateIfChanged(newState: BballGameState) {
    if (!deepEqual(gameState, newState)) {
      setGameState(newState);
    }
  }

  const bb = BballLogic.getInst();

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((count) => {
        count = count + 1;
        const newState = BballLogic.getInst().getState();

        if (0 === count % 5) {
          console.log('bat', count);
          if (shotClockPressedIn !== SHOT_CLOCK_NOT_PRESSED) {
            if (!bb.isClockRunning()) {
              const seconds = shotClockPressedIn === SHOT_CLOCK_PRESSED_LEFT ? -1 : 1;
              let milliseconds = newState.shotClockMs + seconds * 1000;
              milliseconds = Math.max(0, milliseconds);
              milliseconds = Math.min(24000, milliseconds);
              bb.resetShotClock(Math.round(milliseconds / 1000));
              newState.shotClockMs = milliseconds;
              count = count + 1;
            }
          }
        }
        setGameStateIfChanged(newState);
        return count;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { width: dim.width, height: dim.height }]}>
      <Scoreboard
        width={dim.width}
        height={dim.height}
        gameState={gameState}
        onHomeScorePress={(rightSide) => {
          const addPoints = rightSide ? 1 : -1;
          bb.game.homeTeam.addPoints(addPoints);
        }}
        onAwayScorePress={(rightSide) => {
          const addPoints = rightSide ? 1 : -1;
          bb.game.awayTeam.addPoints(addPoints);
        }}
        onHomeFoulsPress={(rightSide) => {
          const num = rightSide ? 1 : -1;
          bb.game.homeTeam.addFouls(num);
        }}
        onAwayFoulsPress={(rightSide) => {
          const num = rightSide ? 1 : -1;
          bb.game.awayTeam.addFouls(num);
        }}
        onPeriodPress={(rightSide) => {
          const num = rightSide ? 1 : -1;
          bb.game.addPeriod(num);
        }}
        onPeriodLongPress={(rightSide) => {
          bb.newGame();
        }}
        onClockPress={(_rightSide) => {
          bb.toggleClock();
        }}
        onClockLongPress={(_rightSide) => {
          bb.resetClock();
        }}
        onShotClockPress={(_rightSide: boolean) => {
          const seconds = _rightSide ? 24 : 14;
          bb.resetShotClock(seconds);
        }}
        onShotClockPressIn={(_rightSide: boolean) => {
          const press = _rightSide ? SHOT_CLOCK_PRESSED_RIGHT : SHOT_CLOCK_PRESSED_LEFT;
          console.log('Shot clock pressed in', press);
          shotClockPressedIn = press;
        }}
        onShotClockPressOut={(_rightSide: boolean) => {
          console.log('Shot clock pressed out');
          shotClockPressedIn = SHOT_CLOCK_NOT_PRESSED;
        }}
      />
    </View>
  );
};

const debugBorders = {
  borderWidth: 1,
  borderColor: 'red',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: Themes.colors.almost_black,
  },
  scoresAndClock: { flexDirection: 'row', flex: 1, ...debugBorders },
  periodAndBonus: { flexDirection: 'row', flex: 0.2, ...debugBorders },
  foulsAndShotClock: { flexDirection: 'row', flex: 1, ...debugBorders },
});
