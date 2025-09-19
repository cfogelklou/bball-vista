import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Themes } from '../themes/themes';
import { Score } from '../components/score';
import { Clock } from '../components/clock';
import { useReceiverClock } from '../common/gameCore/ReceiverClockContext';
import deepEqual from 'deep-equal';
import { GameState, createDefaultGameState } from '@common/types/gameState';

// Helper functions for formatting display values
function formatTime(ms: number): string {
  if (isNaN(ms) || ms < 0) return "0:00";

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${seconds}`;
  }
}

function getMainClockDisplay(clockContext: any): string {
  const ms = clockContext.getDisplayTime('periodClock');
  return formatTime(ms);
}

function getShotClockDisplay(clockContext: any): string {
  const ms = clockContext.getDisplayTime('shotClock');
  return formatTime(ms);
}

export type ScoreboardProps = {
  width: number;
  height: number;
  gameState: GameState;
};

const GOLDEN_RATIO = 1600 / 900; // Golden ratio

export const Scoreboard = (props: ScoreboardProps) => {
  const clockContext = useReceiverClock();
  const [width, setWidth] = useState(1.0);
  const [height, setHeight] = useState(1.0);
  const [caretSize, setCaretSize] = useState(1.0);
  const [scoreboardWidth, setScoreboardWidth] = useState(1.0);
  const [scoreboardHeight, setScoreboardHeight] = useState(1.0);
  const [gameState, setGameState] = useState<GameState>(createDefaultGameState('temp'));

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


  const bonusAway = gameState.away?.fouls >= 5 ? 'BONUS' : '';
  const bonusHome = gameState.home?.fouls >= 5 ? 'BONUS' : '';
  const homePossColor = gameState.possessionHome ? 'red' : Themes.colors.dark_grey;
  const awayPossColor = !gameState.possessionHome ? 'red' : Themes.colors.dark_grey;

  return (
    <View style={{ width: scoreboardWidth, height: scoreboardHeight }}>
      <View style={styles.scoresAndClock}>
        <View style={styles.scoreAndBonus}>
          <Score
            title={'home'}
            score={gameState.home?.score || 0}
            color='green'
          ></Score>
        </View>
        <View style={{ flex: GOLDEN_RATIO }}>
          <View style={{ flex: 2 }}>
            <Clock
              clock={getMainClockDisplay(clockContext)}
              color={'red'}
            ></Clock>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ height: '100%', flexDirection: 'row' }}>
              <View
                style={styles.possessionArrowView}
                onLayout={(a: any) => {
                  console.log('Got layout:', a.nativeEvent.layout);
                  const size = Math.min(a.nativeEvent.layout.width, a.nativeEvent.layout.height);
                  setCaretSize(size * 0.7);
                }}
              >
                {/* Temporarily replaced FontAwesome with text */}
                <View style={{ alignSelf: 'flex-start' }}>
                  <Text style={{ color: homePossColor, fontSize: caretSize }}>◀</Text>
                </View>
              </View>

              <Score
                title={'period'}
                score={gameState.period}
                color='red'
                isHorizontal={true}
              ></Score>
              <View
                style={styles.possessionArrowView}
              >
                {/* Temporarily replaced FontAwesome with text */}
                <View style={{ alignSelf: 'flex-end' }}>
                  <Text style={{ color: awayPossColor, fontSize: caretSize }}>▶</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.scoreAndBonus}>
          <Score
            title={'away'}
            score={gameState.away?.score || 0}
            color='green'
          ></Score>
        </View>
      </View>
      <View style={styles.spacer}></View>

      <View style={styles.foulsAndShotClock}>
        <View style={styles.foulsAndShotClockRow}>
          <Score
            title={'fouls'}
            score={gameState.home?.fouls || 0}
            color='yellow'
            subtitle={bonusHome}
          ></Score>
        </View>
        <View style={styles.foulsAndShotClockRow}>
          <Score
            title={'shot'}
            scoreText={getShotClockDisplay(clockContext)}
            color='red'
          ></Score>
        </View>
        <View style={styles.foulsAndShotClockRow}>
          <Score
            title={'fouls'}
            subtitle={bonusAway}
            score={gameState.away?.fouls || 0}
            color='yellow'
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
