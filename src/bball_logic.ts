import { BballGameState } from './components/scoreboard';

let singleton: null | BballLogic = null;

class BballTeam {
  fouls: number = 0;
  points: number = 0;
  isBonus() {
    return this.fouls >= 5;
  }
  incFouls() {
    this.fouls = this.fouls >= 5 ? 5 : 1 + this.fouls;
    return this.fouls;
  }
  decFouls() {
    this.fouls = this.fouls <= 0 ? 0 : this.fouls - 1;
    return this.fouls;
  }

  incPoints() {
    return ++this.points;
  }
  decPoints() {
    this.points = this.points <= 0 ? 0 : this.points - 1;
    return this.points;
  }
  addPoints(points: number) {
    this.points += points;
    this.points = Math.max(0, this.points);
  }

  newPeriod() {
    this.fouls = 0;
  }
  newGame() {
    this.newPeriod();
    this.points = 0;
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

export class BballLogic {
  game: BballGame;
  minutesPerPeriod = 10;
  static getInst(): BballLogic {
    if (null === singleton) {
      singleton = new BballLogic();
    }
    return singleton;
  }

  constructor() {
    this.game = new BballGame(this.minutesPerPeriod);
  }

  newGame() {
    this.game = new BballGame(this.minutesPerPeriod);
  }

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
}
