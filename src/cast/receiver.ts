// Cast Receiver integration for BallerCast
import { doc, onSnapshot, DocumentReference, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { GameState } from '@common/types/gameState';
import { FirebaseUtils } from '@abstractions/firebaseUtils';

declare const cast: any;

export class CastReceiver {
  private static instance: CastReceiver | null = null;
  private context: any;
  private sessionUuid: string | null = null;
  private gameId: string | null = null;
  private gameStateRef: DocumentReference | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private onGameStateChange: ((gameState: GameState) => void) | null = null;
  private isFirebaseInitialized: boolean = false;

  private constructor() {
    this.context = null;
  }

  static getInstance(): CastReceiver {
    if (!CastReceiver.instance) {
      CastReceiver.instance = new CastReceiver();
    }
    return CastReceiver.instance;
  }

  async initialize(onGameStateChange: (gameState: GameState) => void) {
    this.onGameStateChange = onGameStateChange;

    console.log('🎯 Cast Receiver initializing...');

    // Initialize Firebase authentication first
    await this.initializeFirebase();

    // Initialize Cast Receiver context
    this.context = cast.framework.CastReceiverContext.getInstance();

    // Extract gameId and sessionUuid from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.gameId = urlParams.get('gameId');
    this.sessionUuid = urlParams.get('sessionUuid');

    console.log('🎯 URL parameters:', { gameId: this.gameId, sessionUuid: this.sessionUuid });

    // Priority: gameId first, then sessionUuid for backward compatibility
    if (this.gameId) {
      console.log('🎯 Cast Receiver initialized with gameId:', this.gameId);
      // Convert gameId to UUID for Firebase lookup
      this.sessionUuid = FirebaseUtils.gameIdToUuid(this.gameId);
      console.log('🎯 Converted to sessionUuid:', this.sessionUuid);
      await this.setupFirestoreListener();
    } else if (this.sessionUuid) {
      console.log('🎯 Cast Receiver initialized with sessionUuid (legacy):', this.sessionUuid);
      await this.setupFirestoreListener();
    } else {
      console.warn('🎯 No gameId or sessionUuid found in URL parameters');
      console.log('🎯 Expected usage: ?gameId=ABC123 or ?sessionUuid=uuid-string');
    }

    // Start the receiver application
    this.context.start();
    console.log('🎯 Cast Receiver context started');
  }

  private async initializeFirebase() {
    if (this.isFirebaseInitialized) {
      console.log('🔥 Firebase already initialized for Cast Receiver');
      return;
    }

    try {
      console.log('🔥 Initializing Firebase authentication for Cast Receiver...');
      const result = await FirebaseUtils.initializeAuthentication();
      
      if (result.success) {
        console.log('🔥 ✅ Firebase authentication successful for Cast Receiver');
        this.isFirebaseInitialized = true;
      } else {
        console.error('🔥 ❌ Firebase authentication failed for Cast Receiver:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('🔥 ❌ Failed to initialize Firebase for Cast Receiver:', error);
      throw error;
    }
  }

  private async setupFirestoreListener() {
    if (!this.isFirebaseInitialized) {
      console.error('🔥 Cannot setup Firestore listener: Firebase not initialized');
      return;
    }

    if (!this.sessionUuid) {
      console.error('🔥 Cannot setup Firestore listener: no sessionUuid available');
      return;
    }

    console.log('🔥 Setting up Firestore listener for sessionUuid:', this.sessionUuid);
    if (this.gameId) {
      console.log('🔥 Original gameId:', this.gameId);
    }

    try {
      // Create a reference to the game session document in Firestore
      this.gameStateRef = doc(firestore, 'games', this.sessionUuid);

      // Listen for changes to the game state
      this.unsubscribe = onSnapshot(this.gameStateRef, (docSnap) => {
        if (docSnap.exists()) {
          const gameState = docSnap.data() as GameState;
          if (gameState && this.onGameStateChange) {
            console.log('🔥 ✅ Received game state update:', {
              gameId: gameState.gameId,
              sessionUuid: gameState.sessionUuid,
              period: gameState.period,
              homeScore: gameState.home.score,
              awayScore: gameState.away.score
            });
            this.onGameStateChange(gameState);
          }
        } else {
          console.warn('🔥 ⚠️ Game state document does not exist for sessionUuid:', this.sessionUuid);
          if (this.gameId) {
            console.warn('🔥 ⚠️ Original gameId was:', this.gameId);
            console.warn('🔥 ⚠️ Make sure a game was created with this gameId');
          }
        }
      }, (error) => {
        console.error('🔥 ❌ Error listening to game state:', error);
        if (this.gameId) {
          console.error('🔥 ❌ Failed to listen for gameId:', this.gameId);
        }
        
        // Provide more specific error information
        if (error.code === 'permission-denied') {
          console.error('🔥 ❌ Permission denied - check Firestore security rules');
        } else if (error.code === 'unauthenticated') {
          console.error('🔥 ❌ Unauthenticated - Firebase auth may have failed');
        }
      });

      console.log('🔥 ✅ Firestore listener setup complete');
    } catch (error) {
      console.error('🔥 ❌ Failed to setup Firestore listener:', error);
    }
  }

  getSessionUuid(): string | null {
    return this.sessionUuid;
  }

  getGameId(): string | null {
    return this.gameId;
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