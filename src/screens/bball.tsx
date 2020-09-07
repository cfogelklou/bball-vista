import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Scoreboard } from '../components/scoreboard';
import { BballLogic, BballGameState } from '../bball_logic';

export type BballProps = {
  placeholder?: string;
};

export const Bball = (props: any | BballProps) => {
  const dim = Dimensions.get('window');

  const [gameState, setGameState] = useState(
    BballLogic.getInst((state: BballGameState) => {
      setGameState(state);
    }).getState(),
  );

  return (
    <View style={[styles.container, { width: dim.width, height: dim.height }]}>
      <Scoreboard
        width={dim.width}
        height={dim.height}
        gameState={gameState}
        onHomeScorePress={(rightSide) => {
          const addPoints = rightSide ? 1 : -1;
          BballLogic.getInst().game.homeTeam.addPoints(addPoints);
          setGameState(BballLogic.getInst().getState());
        }}
        onAwayScorePress={(rightSide) => {
          const addPoints = rightSide ? 1 : -1;
          BballLogic.getInst().game.awayTeam.addPoints(addPoints);
          setGameState(BballLogic.getInst().getState());
        }}
        onHomeFoulsPress={(rightSide) => {
          const num = rightSide ? 1 : -1;
          BballLogic.getInst().game.homeTeam.addFouls(num);
          setGameState(BballLogic.getInst().getState());
        }}
        onAwayFoulsPress={(rightSide) => {
          const num = rightSide ? 1 : -1;
          BballLogic.getInst().game.awayTeam.addFouls(num);
          setGameState(BballLogic.getInst().getState());
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
