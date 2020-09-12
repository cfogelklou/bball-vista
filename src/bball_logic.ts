import AsyncStorage from '@react-native-community/async-storage';

let singleton: null | BballLogic = null;

function getMs(): number {
  return Date.now();
}

export function getClockString(_ms: number): string {
  let ms = _ms;
  const minutes = Math.floor(ms / (60 * 1000));
  ms = ms - minutes * 60 * 1000;
  const seconds = Math.floor(ms / 1000);
  const seconds_1 = Math.floor(seconds / 10);
  const seconds_0 = seconds - 10 * seconds_1;
  return minutes.toString() + ':' + seconds_1.toString() + seconds_0.toString();
}

export function getShotClockString(_ms: number): string {
  let ms = _ms;
  const seconds = Math.floor(ms / 1000);
  const seconds_1 = Math.floor(seconds / 10);
  const seconds_0 = seconds - 10 * seconds_1;
  return seconds_1.toString() + seconds_0.toString();
}

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
  minutesPerPeriod = 10;
  homeTeam: BballTeam = new BballTeam();
  awayTeam: BballTeam = new BballTeam();
  period: number = 1;
  possessionHome: boolean = true;
  clockMs: number = this.minutesPerPeriod * 60 * 1000;
  shotClockMs: number = 24 * 1000;
  clockStartTime: number = 0;

  constructor(minutesPerPeriod: number) {
    this.minutesPerPeriod = minutesPerPeriod;
    this.clockMs = this.minutesPerPeriod * 60 * 1000;
  }

  addPeriod(num: number) {
    const oldPeriod = this.period;
    this.period += num;
    this.period = Math.max(1, this.period);
    this.period = Math.min(4, this.period);
    if (oldPeriod !== this.period) {
      this.possessionHome = !this.possessionHome;
    }

    BballLogic.getInst()._setDirty();
    return this.period;
  }

  updateClock() {
    const ms = getMs();
    if (0 !== this.clockStartTime) {
      const timePassed = ms - this.clockStartTime;
      this.clockStartTime = ms;
      this.clockMs -= timePassed;
      this.clockMs = Math.max(0, this.clockMs);
      this.shotClockMs -= timePassed;
      this.shotClockMs = Math.max(0, this.shotClockMs);
    }
    return ms;
  }

  toggleClock() {
    const ms = this.updateClock();
    if (0 !== this.clockStartTime) {
      this.clockStartTime = 0;
    } else {
      this.clockStartTime = ms;
    }
  }

  addToShotClock(seconds: number) {
    this.shotClockMs += seconds * 1000;
    this.shotClockMs = Math.max(0, this.shotClockMs);
    this.shotClockMs = Math.min(24000, this.shotClockMs);

    BballLogic.getInst()._setDirty();
    return this.period;
  }

  getClock(): string {
    return getClockString(this.clockMs);
  }

  getShotClock(): string {
    return getShotClockString(this.shotClockMs);
  }

  getShotClockSeconds(): number {
    return Math.ceil(this.shotClockMs / 1000);
  }
}

export type BballGameState = {
  homePoints: number;
  awayPoints: number;
  homeFouls: number;
  awayFouls: number;
  clockMs: number;
  shotClockMs: number;
  period: number;
  possessionHome: boolean;
};

export const defaultGameState: BballGameState = {
  homePoints: 0,
  awayPoints: 0,
  homeFouls: 0,
  awayFouls: 0,
  clockMs: 10 * 60 * 1000,
  shotClockMs: 24 * 1000,
  period: 0,
  possessionHome: true,
};

const SAVE_ID = '@bball_state';

// ////////////////////////////////////////////////////////////////////////////
export class BballLogic {
  game: BballGame;

  minutesPerPeriod = 10;
  currState: BballGameState = { ...defaultGameState };
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
  newGame(minutesPerPeriod: number = 0) {
    minutesPerPeriod = minutesPerPeriod == 0 ? this.minutesPerPeriod : minutesPerPeriod;
    console.log('Creating new game.');
    this.currState = { ...defaultGameState };
    this.minutesPerPeriod = minutesPerPeriod;
    this.game = new BballGame(this.minutesPerPeriod);
    this.resetClock();
    this._setDirty();
    console.log('Created game. New state is:', this);
  }

  getClock(): string {
    return this.game.getClock();
  }

  getShotClock(): string {
    return this.game.getShotClock();
  }

  toggleClock(): void {
    this.game.toggleClock();
    if (0 === this.game.clockStartTime) {
      this._setDirty();
    }
  }

  // Gets the current state.
  getState(): BballGameState {
    this.game.updateClock();
    const gameState: BballGameState = {
      homePoints: this.game.homeTeam.points,
      awayPoints: this.game.awayTeam.points,
      homeFouls: this.game.homeTeam.fouls,
      awayFouls: this.game.awayTeam.fouls,
      clockMs: this.game.clockMs,
      shotClockMs: this.game.shotClockMs,
      period: this.game.period,
      possessionHome: this.game.possessionHome,
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
      .then(() => {})
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
          this.game.clockMs = s.clockMs;
          this.game.shotClockMs = s.shotClockMs;
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
  _setDirty = () => {
    this.isDirty = true;
    this._saveState();
  };

  resetClock() {
    this.game.clockMs = this.minutesPerPeriod * 60 * 1000;
    this._setDirty();
  }

  resetShotClock(seconds: number) {
    this.game.shotClockMs = seconds * 1000;
    this.game.shotClockMs = Math.min(24000, this.game.shotClockMs);
    this.game.shotClockMs = Math.max(0, this.game.shotClockMs);
    console.log('shotClocks:', seconds);
    this._setDirty();
  }

  isClockRunning() {
    return this.game.clockStartTime !== 0;
  }

  togglePossession() {
    this.game.possessionHome = !this.game.possessionHome;
    this._setDirty();
  }

  setPossessionHome() {
    this.game.possessionHome = true;
    this._setDirty();
  }

  setPossessionAway() {
    this.game.possessionHome = false;
    this._setDirty();
  }
}
