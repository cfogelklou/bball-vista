// Cast Receiver integration for BallerCast
import { doc, onSnapshot, DocumentReference, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { GameState } from '../types/gameState';

declare const cast: any;

export class CastReceiver {
  private static instance: CastReceiver | null = null;
  private context: any;
  private sessionUuid: string | null = null;
  private gameStateRef: DocumentReference | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private onGameStateChange: ((gameState: GameState) => void) | null = null;

  private constructor() {
    this.context = null;
  }

  static getInstance(): CastReceiver {
    if (!CastReceiver.instance) {
      CastReceiver.instance = new CastReceiver();
    }
    return CastReceiver.instance;
  }

  initialize(onGameStateChange: (gameState: GameState) => void) {
    this.onGameStateChange = onGameStateChange;

    // Initialize Cast Receiver context
    this.context = cast.framework.CastReceiverContext.getInstance();

    // Extract sessionUuid from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.sessionUuid = urlParams.get('sessionUuid');

    if (this.sessionUuid) {
      console.log('Cast Receiver initialized with sessionUuid:', this.sessionUuid);
      this.setupFirestoreListener();
    } else {
      console.warn('No sessionUuid found in URL parameters');
    }

    // Start the receiver application
    this.context.start();
  }

  private setupFirestoreListener() {
    if (!this.sessionUuid) return;

    // Create a reference to the game session document in Firestore
    this.gameStateRef = doc(firestore, 'games', this.sessionUuid);

    // Listen for changes to the game state
    this.unsubscribe = onSnapshot(this.gameStateRef, (doc) => {
      if (doc.exists()) {
        const gameState = doc.data() as GameState;
        if (gameState && this.onGameStateChange) {
          console.log('Received game state update:', gameState);
          this.onGameStateChange(gameState);
        }
      } else {
        console.warn(`No game session found for sessionUuid: ${this.sessionUuid}`);
      }
    }, (error) => {
      console.error('Error listening to game state:', error);
    });
  }

  getSessionUuid(): string | null {
    return this.sessionUuid;
  }

  disconnect() {
    // Clean up Firestore listener
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.gameStateRef = null;

    // Stop the receiver context
    if (this.context) {
      this.context.stop();
    }
  }
}

export default CastReceiver;