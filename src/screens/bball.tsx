import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Themes } from '../themes/themes';
import { Scoreboard } from '../components/scoreboard';
import { GameIdDisplay } from '../components/gameIdDisplay';
import { GameState, createDefaultGameState, getCurrentClockTime } from '@common/types/gameState';
import { ReceiverClockProvider } from '../common/gameCore/ReceiverClockContext';
import deepEqual from 'deep-equal';
import { Howl, Howler } from 'howler';
import CastReceiver from '../cast/receiver';
import buzz1 from '../sounds/buzzer.mp3';
import beeps from '../sounds/5-beeps.mp3';

export type BballProps = {
  placeholder?: string;
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
  onloaderror: (_soundId, _error) => {
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
  onloaderror: (_soundId, _error) => {
    console.log('Got loading error.');
  },
});

// Internal component that handles the receiver logic
function BballReceiver() {
  const castReceiver = useRef(CastReceiver.getInstance());
  const [gameState, setGameState] = useState<GameState>(createDefaultGameState('temp-session'));
  const [gameId, setGameId] = useState<string>('');
  const [sessionUuid, setSessionUuid] = useState<string>('');
  const previousGameState = useRef<GameState>(createDefaultGameState('temp-session'));

  const setGameStateIfChanged = useCallback((newGamestate: GameState) => {
    if (!deepEqual(newGamestate, gameState)) {
      setGameState({ ...newGamestate });
    }
  }, [gameState]);

  const checkForSoundTriggers = useCallback(() => {
    // Get current clock times using helper functions
    const currentPeriodClockMs = getCurrentClockTime(gameState.periodClock);
    const currentShotClockMs = getCurrentClockTime(gameState.shotClock);

    const previousPeriodClockMs = getCurrentClockTime(previousGameState.current.periodClock);
    const previousShotClockMs = getCurrentClockTime(previousGameState.current.shotClock);

    // Check for buzzer sound (period clock reached 0)
    if (currentPeriodClockMs <= 0) {
      if (previousPeriodClockMs > 0) {
        buzzer.play();
      }
    }

    // Check for beeper sound (shot clock reached 0)
    if (currentShotClockMs <= 0) {
      if (previousShotClockMs > 0) {
        beeper.play();
      }
    }

    // Update previous state for next comparison
    previousGameState.current = { ...gameState };
  }, [gameState]);

  const handleGameStateChange = useCallback((newGameState: GameState) => {
    setGameStateIfChanged(newGameState);
  }, [setGameStateIfChanged]);

  useEffect(() => {
    // Store current ref value to avoid stale closure warning
    const currentReceiver = castReceiver.current;

    // Initialize Cast receiver with game state change callback
    const initializeReceiver = async () => {
      try {
        console.log('🎯 Initializing Cast receiver...');
        await currentReceiver.initialize(handleGameStateChange);
        console.log('🎯 Cast receiver initialized successfully');
        
        // Update game ID and session UUID after successful initialization
        setGameId(currentReceiver.getGameId() || '');
        setSessionUuid(currentReceiver.getSessionUuid() || '');
      } catch (error) {
        console.error('🎯 ❌ Failed to initialize Cast receiver:', error);
      }
    };

    initializeReceiver();

    // Set up interval to check for sound triggers
    const interval = setInterval(() => {
      checkForSoundTriggers();
    }, 100);

    return () => {
      clearInterval(interval);
      currentReceiver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update game ID and session UUID when they change
  useEffect(() => {
    const updateIds = () => {
      setGameId(castReceiver.current.getGameId() || '');
      setSessionUuid(castReceiver.current.getSessionUuid() || '');
    };

    const interval = setInterval(updateIds, 1000);
    return () => clearInterval(interval);
  }, []);

  const dim = Dimensions.get('window');

  return (
    <ReceiverClockProvider gameState={gameState}>
      <View style={[styles.container, { width: dim.width, height: dim.height }]}>
        <Scoreboard
          width={dim.width}
          height={dim.height}
          gameState={gameState}
        />
        <GameIdDisplay
          gameId={gameId}
          sessionUuid={sessionUuid}
        />
      </View>
    </ReceiverClockProvider>
  );
}

// Main component
export function Bball(_props: BballProps) {
  return <BballReceiver />;
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
