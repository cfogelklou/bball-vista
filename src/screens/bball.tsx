import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Scoreboard } from '../components/scoreboard';
import { BballLogic, BballGameState, defaultGameState } from '../bball_logic';
import deepEqual from 'deep-equal';

export type BballProps = {
  placeholder?: string;
};

const SHOT_CLOCK_NOT_PRESSED = 0;
const SHOT_CLOCK_PRESSED_LEFT = 1;
const SHOT_CLOCK_PRESSED_RIGHT = 2;

export class Bball extends React.Component {
  setGameStateIfChanged = (gamestate: BballGameState) => {
    if (!deepEqual(gamestate, this.state.gameState)) {
      this.setState({ gameState: { ...gamestate } });
    }
  };

  bb = BballLogic.getInst(this.setGameStateIfChanged);

  state = {
    count: 0,
    shotClockPressedIn: SHOT_CLOCK_NOT_PRESSED,
    gameState: defaultGameState,
  };

  constructor(props: any) {
    super(props);
    this.setState({ gameState: this.bb.getState() });
  }

  shotClockHandler = () => {
    const newState = BballLogic.getInst().getState();

    if (0 === this.state.count % 5) {
      console.log(
        'shotClockPressedIn = ' + this.state.shotClockPressedIn + ' at count ',
        this.state.count,
      );
      if (this.state.shotClockPressedIn !== SHOT_CLOCK_NOT_PRESSED) {
        if (!this.bb.isClockRunning()) {
          const seconds = this.state.shotClockPressedIn === SHOT_CLOCK_PRESSED_LEFT ? -1 : 1;
          let milliseconds = newState.shotClockMs + seconds * 1000;
          milliseconds = Math.max(0, milliseconds);
          milliseconds = Math.min(24000, milliseconds);
          this.bb.resetShotClock(Math.round(milliseconds / 1000));
          newState.shotClockMs = milliseconds;
        }
      }
    }
    this.setGameStateIfChanged(newState);
    return this.state.count;
  };

  componentDidMount() {
    const interval = setInterval(() => {
      this.shotClockHandler();
      this.setState({ count: this.state.count + 1 });
    }, 100);
    return () => clearInterval(interval);
  }

  render() {
    const dim = Dimensions.get('window');

    return (
      <View style={[styles.container, { width: dim.width, height: dim.height }]}>
        <Scoreboard
          width={dim.width}
          height={dim.height}
          gameState={this.state.gameState}
          onHomeScorePress={(rightSide) => {
            const addPoints = rightSide ? 1 : -1;
            this.bb.game.homeTeam.addPoints(addPoints);
          }}
          onAwayScorePress={(rightSide) => {
            const addPoints = rightSide ? 1 : -1;
            this.bb.game.awayTeam.addPoints(addPoints);
          }}
          onHomeFoulsPress={(rightSide) => {
            const num = rightSide ? 1 : -1;
            this.bb.game.homeTeam.addFouls(num);
          }}
          onAwayFoulsPress={(rightSide) => {
            const num = rightSide ? 1 : -1;
            this.bb.game.awayTeam.addFouls(num);
          }}
          onPeriodPress={(rightSide) => {
            const num = rightSide ? 1 : -1;
            this.bb.game.addPeriod(num);
          }}
          onPeriodLongPress={(rightSide) => {
            this.bb.newGame();
          }}
          onClockPress={(_rightSide) => {
            this.bb.toggleClock();
          }}
          onClockLongPress={(_rightSide) => {
            this.bb.resetClock();
          }}
          onShotClockPress={(_rightSide: boolean) => {
            const seconds = _rightSide ? 24 : 14;
            this.bb.resetShotClock(seconds);
          }}
          onShotClockPressIn={(_rightSide: boolean) => {
            const press = _rightSide ? SHOT_CLOCK_PRESSED_RIGHT : SHOT_CLOCK_PRESSED_LEFT;
            console.log('Shot clock pressed in ', press);
            this.state.setShotClockPressedIn(shotClockPressedIn);
          }}
          onShotClockPressOut={(_rightSide: boolean) => {
            console.log('Shot clock pressed out');
            setShotClockPressedIn(SHOT_CLOCK_NOT_PRESSED);
          }}
        />
      </View>
    );
  }
}

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
