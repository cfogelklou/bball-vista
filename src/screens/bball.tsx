import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Scoreboard } from '../components/scoreboard';
import { BballLogic, BballGameState, defaultGameState } from '../bball_logic';
import deepEqual from 'deep-equal';
import { Howl, Howler } from 'howler';
const buzz1 = require('../sounds/buzzer.mp3');
const beeps = require('../sounds/5-beeps.wav');

export type BballProps = {
  placeholder?: string;
};

const SHOT_CLOCK_NOT_PRESSED = 0;
const SHOT_CLOCK_PRESSED_LEFT = 1;
const SHOT_CLOCK_PRESSED_RIGHT = 2;

type BballState = {
  longPressCount: number;
  shotClockPressedIn: number;
  gameState: BballGameState;
};

Howler.volume(0.9);

const buzzer = new Howl({
  src: [buzz1],
  onend: function () {
    console.log('Finished!');
  },
  onload: () => {
    console.log('Loaded');
  },
  onloaderror: (soundId, error) => {
    console.log('Got loading error.');
  },
});

const beeper = new Howl({
  src: [beeps],
  onend: function () {
    console.log('Finished!');
  },
  onload: () => {
    console.log('Loaded');
  },
  onloaderror: (soundId, error) => {
    console.log('Got loading error.');
  },
});

export class Bball extends React.Component {
  setGameStateIfChanged = (gamestate: BballGameState) => {
    if (!deepEqual(gamestate, this.state.gameState)) {
      this.setState({ gameState: { ...gamestate } });
    }
  };

  bb = BballLogic.getInst(this.setGameStateIfChanged);

  state: BballState = {
    longPressCount: 0,
    shotClockPressedIn: SHOT_CLOCK_NOT_PRESSED,
    gameState: defaultGameState,
  };
  interval: undefined | NodeJS.Timeout = undefined;

  constructor(props: any) {
    super(props);
    this.setState({ gameState: this.bb.getState() });
  }

  shotClockHandler = () => {
    const newState = BballLogic.getInst().getState();
    if (newState.clockMs <= 0) {
      if (this.state.gameState.clockMs > 0) {
        buzzer.play();
        if (this.bb.isClockRunning()) {
          this.bb.toggleClock();
        }
      }
    }
    if (newState.shotClockMs <= 0) {
      if (this.state.gameState.shotClockMs > 0) {
        beeper.play();
      }
    }

    if (2 === this.state.longPressCount % 3) {
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
    return this.state.longPressCount;
  };

  componentDidMount() {
    this.interval = setInterval(() => {
      this.shotClockHandler();
      this.setState({ longPressCount: this.state.longPressCount + 1 });
    }, 100);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
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
            const current = this.bb.game.getShotClockSeconds();
            if (this.bb.isClockRunning()) {
              const seconds = _rightSide ? 24 : 14;
              //if (current <= seconds) {
              this.bb.resetShotClock(seconds);
              //}
            } else {
              let seconds = 24;
              if (_rightSide) {
                seconds = current < 14 || current === 24 ? 14 : 24;
              } else {
                seconds = current - 1;
              }

              this.bb.resetShotClock(seconds);
            }
          }}
          onShotClockPressIn={(_rightSide: boolean) => {
            const press = _rightSide ? SHOT_CLOCK_PRESSED_RIGHT : SHOT_CLOCK_PRESSED_LEFT;
            console.log('Shot clock pressed in ', press);
            this.setState({ longPressCount: 0, shotClockPressedIn: press });
          }}
          onShotClockPressOut={(_rightSide: boolean) => {
            console.log('Shot clock pressed out');
            this.setState({ longPressCount: 0, shotClockPressedIn: SHOT_CLOCK_NOT_PRESSED });
          }}
          onPossessionArrow={(_rightSide: boolean) => {
            console.log('Arrow pressed');
            //this.bb.togglePossession();
            if (_rightSide) {
              this.bb.setPossessionAway();
            } else {
              this.bb.setPossessionHome();
            }
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoresAndClock: { flexDirection: 'row', flex: 1, ...debugBorders },
  periodAndBonus: { flexDirection: 'row', flex: 0.2, ...debugBorders },
  foulsAndShotClock: { flexDirection: 'row', flex: 1, ...debugBorders },
});
