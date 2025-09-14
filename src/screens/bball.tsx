import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Scoreboard } from '../components/scoreboard';
import { BballGameState, defaultGameState } from '../bball_logic';
import deepEqual from 'deep-equal';
import { Howl, Howler } from 'howler';
import CastReceiver from '../cast/receiver';
import buzz1 from '../sounds/buzzer.mp3';
import beeps from '../sounds/5-beeps.mp3';

export type BballProps = {
  placeholder?: string;
};

type BballState = {
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
  private castReceiver = CastReceiver.getInstance();

  state: BballState = {
    gameState: defaultGameState,
  };

  interval: undefined | NodeJS.Timeout = undefined;
  private previousGameState: BballGameState = defaultGameState;

  constructor(props: any) {
    super(props);
  }

  setGameStateIfChanged = (gamestate: BballGameState) => {
    if (!deepEqual(gamestate, this.state.gameState)) {
      this.setState({ gameState: { ...gamestate } });
    }
  };

  checkForSoundTriggers = () => {
    const currentState = this.state.gameState;

    // Check for buzzer sound (clock reached 0)
    if (currentState.clockMs <= 0) {
      if (this.previousGameState.clockMs > 0) {
        buzzer.play();
      }
    }

    // Check for beeper sound (shot clock reached 0)
    if (currentState.shotClockMs <= 0) {
      if (this.previousGameState.shotClockMs > 0) {
        beeper.play();
      }
    }

    // Update previous state for next comparison
    this.previousGameState = { ...currentState };
  };

  componentDidMount() {
    // Initialize Cast receiver with game state change callback
    this.castReceiver.initialize(this.handleGameStateChange);

    // Set up interval to check for sound triggers
    this.interval = setInterval(() => {
      this.checkForSoundTriggers();
    }, 100);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    // Disconnect the cast receiver
    this.castReceiver.disconnect();
  }

  handleGameStateChange = (gameState: BballGameState) => {
    this.setGameStateIfChanged(gameState);
  };

  render() {
    const dim = Dimensions.get('window');

    return (
      <View style={[styles.container, { width: dim.width, height: dim.height }]}>
        <Scoreboard
          width={dim.width}
          height={dim.height}
          gameState={this.state.gameState}
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
