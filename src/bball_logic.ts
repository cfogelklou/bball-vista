import AsyncStorage from '@react-native-community/async-storage';
import deepEqual from 'deep-equal';

let singleton: null | BballLogic = null;

class BballTeam {
  fouls: number = 0;
  points: number = 0;

  isBonus() {
    return this.fouls >= 5;
  }

  addFouls(fouls: number) {
    this.fouls += fouls;
    this.fouls = Math.max(0, this.fouls);
    this.fouls = Math.min(5, this.fouls);

    BballLogic.getInst()._setDirty();
    return this.fouls;
  }

  addPoints(points: number) {
    this.points += points;
    this.points = Math.max(0, this.points);
    BballLogic.getInst()._setDirty();
    return this.points;
  }

  newPeriod() {
    this.fouls = 0;
    BballLogic.getInst()._setDirty();
  }

  newGame() {
    this.newPeriod();
    this.points = 0;
    BballLogic.getInst()._setDirty();
  }
}

class BballGame {
  minutesPerPeriod = 0;
  homeTeam: BballTeam = new BballTeam();
  awayTeam: BballTeam = new BballTeam();
  period: number = 4;
  clock: number = 10;
  shotClock: number = 24;
  clockRunning: boolean = false;

  constructor(minutesPerPeriod: number) {
    this.minutesPerPeriod = minutesPerPeriod;
  }
}

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

const SAVE_ID = '@bball_state';

// ////////////////////////////////////////////////////////////////////////////
export class BballLogic {
  game: BballGame;

  minutesPerPeriod = 10;
  currState: BballGameState = defaultGameState;
  isDirty: boolean = false;

  // Get singleton
  static getInst(onConstructedCallback?: (currState: BballGameState) => void): BballLogic {
    if (null === singleton) {
      singleton = new BballLogic();
      singleton._restoreState(onConstructedCallback);
    }
    return singleton;
  }

  // Constructor
  constructor() {
    this.game = new BballGame(this.minutesPerPeriod);
  }

  // Create a new game
  newGame() {
    this.game = new BballGame(this.minutesPerPeriod);
    if (singleton) {
      BballLogic.getInst()._setDirty();
    }
  }

  // Gets the current state.
  getState(): BballGameState {
    const gameState: BballGameState = {
      homePoints: this.game.homeTeam.points,
      awayPoints: this.game.awayTeam.points,
      homeFouls: this.game.homeTeam.fouls,
      awayFouls: this.game.awayTeam.fouls,
      clock: this.game.clock,
      shotClock: this.game.shotClock,
      period: this.game.period,
    };
    return gameState;
  }

  // save the current game state.
  _saveState = () => {
    if (this.isDirty) {
      this.currState = this.getState();
      this.isDirty = false;
    }
    const jsonValue = JSON.stringify(this.currState);
    AsyncStorage.setItem(SAVE_ID, jsonValue)
      .then(() => {
        console.log('Saved current game state:', this.currState);
      })
      .catch((e) => {
        console.log('Failed to save current game state:', e);
      });
  };

  _restoreState = (onConstructedCallback?: (currState: BballGameState) => void) => {
    AsyncStorage.getItem(SAVE_ID)
      .then((json: string | null) => {
        const s: BballGameState | null = json ? JSON.parse(json) : null;
        if (s) {
          this.game.homeTeam.points = s.homePoints;
          this.game.awayTeam.points = s.awayPoints;
          this.game.homeTeam.fouls = s.homeFouls;
          this.game.awayTeam.fouls = s.awayFouls;
          this.game.clock = s.clock;
          this.game.shotClock = s.shotClock;
          this.game.period = s.period;
          this.isDirty = false;
          this.currState = s;
        }
        if (onConstructedCallback) {
          onConstructedCallback(this.currState);
        }
      })
      .catch((e) => {
        console.log('Failed to restore current game state:', e);
        if (onConstructedCallback) {
          onConstructedCallback(this.currState);
        }
      });
  };

  // Set dirty flag and save the current game state.
  _setDirty = async () => {
    this.isDirty = true;
    this._saveState();
  };
}
