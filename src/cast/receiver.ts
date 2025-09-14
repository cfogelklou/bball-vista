// Cast Receiver integration for BallerCast
import { ref, onValue, DatabaseReference } from 'firebase/database';
import { database } from '../firebase/config';
import { BballGameState } from '../bball_logic';

declare const cast: any;

export class CastReceiver {
  private static instance: CastReceiver | null = null;
  private context: any;
  private sessionId: string | null = null;
  private gameStateRef: DatabaseReference | null = null;
  private onGameStateChange: ((gameState: BballGameState) => void) | null = null;

  private constructor() {
    this.context = null;
  }

  static getInstance(): CastReceiver {
    if (!CastReceiver.instance) {
      CastReceiver.instance = new CastReceiver();
    }
    return CastReceiver.instance;
  }

  initialize(onGameStateChange: (gameState: BballGameState) => void) {
    this.onGameStateChange = onGameStateChange;

    // Initialize Cast Receiver context
    this.context = cast.framework.CastReceiverContext.getInstance();

    // Extract sessionId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.sessionId = urlParams.get('sessionId');

    if (this.sessionId) {
      console.log('Cast Receiver initialized with sessionId:', this.sessionId);
      this.setupFirebaseListener();
    } else {
      console.warn('No sessionId found in URL parameters');
    }

    // Start the receiver application
    this.context.start();
  }

  private setupFirebaseListener() {
    if (!this.sessionId) return;

    // Create a reference to the game session in Firebase
    this.gameStateRef = ref(database, `sessions/${this.sessionId}`);

    // Listen for changes to the game state
    onValue(this.gameStateRef, (snapshot) => {
      const gameState = snapshot.val();
      if (gameState && this.onGameStateChange) {
        console.log('Received game state update:', gameState);
        this.onGameStateChange(gameState);
      }
    });
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  disconnect() {
    // Clean up Firebase listener
    if (this.gameStateRef) {
      // Note: with Firebase v9+, we don't need to manually unsubscribe
      // as the onValue listener is automatically cleaned up
      this.gameStateRef = null;
    }

    // Stop the receiver context
    if (this.context) {
      this.context.stop();
    }
  }
}

export default CastReceiver;