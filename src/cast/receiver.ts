// Cast Receiver integration for BallerCast
import { doc, onSnapshot, DocumentReference, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { GameState } from '@common/types/gameState';
import { FirebaseUtils } from '@abstractions/firebaseUtils';
import { createEnhancedDebugLogger } from '../common/utils/debug';

declare const cast: any;

// Enhanced logger for Cast Receiver
const logger = createEnhancedDebugLogger('CastReceiver');

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

    logger.info('Cast Receiver initializing...');

    try {
      // Initialize Firebase authentication first
      await this.initializeFirebase();

      // Initialize Cast Receiver context
      this.context = cast.framework.CastReceiverContext.getInstance();

      // Extract gameId and sessionUuid from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      this.gameId = urlParams.get('gameId');
      this.sessionUuid = urlParams.get('sessionUuid');

      logger.info('URL parameters extracted', { gameId: this.gameId, sessionUuid: this.sessionUuid });

      // Priority: gameId first, then sessionUuid for backward compatibility
      if (this.gameId) {
        logger.info('Cast Receiver initialized with gameId', { gameId: this.gameId });
        // Convert gameId to UUID for Firebase lookup
        this.sessionUuid = FirebaseUtils.gameIdToUuid(this.gameId);
        logger.info('Converted to sessionUuid', { sessionUuid: this.sessionUuid });
        await this.setupFirestoreListener();
      } else if (this.sessionUuid) {
        logger.info('Cast Receiver initialized with sessionUuid (legacy)', { sessionUuid: this.sessionUuid });
        await this.setupFirestoreListener();
      } else {
        const errorMsg = 'No gameId or sessionUuid found in URL parameters. Expected usage: ?gameId=ABC123 or ?sessionUuid=uuid-string';
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Start the receiver application
      this.context.start();
      logger.info('Cast Receiver context started successfully');
    } catch (error) {
      const errorMsg = `Failed to initialize Cast Receiver: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async initializeFirebase() {
    if (this.isFirebaseInitialized) {
      logger.info('Firebase already initialized for Cast Receiver');
      return;
    }

    try {
      logger.info('Initializing Firebase authentication for Cast Receiver...');
      const result = await FirebaseUtils.initializeAuthentication();
      
      if (result.success) {
        logger.info('Firebase authentication successful for Cast Receiver');
        this.isFirebaseInitialized = true;
      } else {
        const errorMsg = `Firebase authentication failed for Cast Receiver: ${result.error}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Failed to initialize Firebase for Cast Receiver: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      throw error;
    }
  }

  private async setupFirestoreListener() {
    if (!this.isFirebaseInitialized) {
      const errorMsg = 'Cannot setup Firestore listener: Firebase not initialized';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!this.sessionUuid) {
      const errorMsg = 'Cannot setup Firestore listener: no sessionUuid available';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    logger.info('Setting up Firestore listener', { 
      sessionUuid: this.sessionUuid,
      originalGameId: this.gameId 
    });

    try {
      // Create a reference to the game session document in Firestore
      this.gameStateRef = doc(firestore, 'games', this.sessionUuid);

      // Listen for changes to the game state
      this.unsubscribe = onSnapshot(this.gameStateRef, (docSnap) => {
        try {
          if (docSnap.exists()) {
            const gameState = docSnap.data() as GameState;
            if (gameState && this.onGameStateChange) {
              logger.info('Received game state update', {
                gameId: gameState.gameId,
                sessionUuid: gameState.sessionUuid,
                period: gameState.period,
                homeScore: gameState.home.score,
                awayScore: gameState.away.score
              });
              this.onGameStateChange(gameState);
            }
          } else {
            const warningMsg = `Game state document does not exist for sessionUuid: ${this.sessionUuid}${this.gameId ? ` (original gameId: ${this.gameId})` : ''}. Make sure a game was created with this gameId.`;
            logger.warn(warningMsg);
          }
        } catch (error) {
          const errorMsg = `Error processing game state snapshot: ${error instanceof Error ? error.message : String(error)}`;
          logger.error(errorMsg);
        }
      }, (error) => {
        let errorMsg = `Error listening to game state: ${error.message || String(error)}`;
        
        if (this.gameId) {
          errorMsg += ` (Failed to listen for gameId: ${this.gameId})`;
        }
        
        // Provide more specific error information
        if (error.code === 'permission-denied') {
          errorMsg += ' - Permission denied: check Firestore security rules';
        } else if (error.code === 'unauthenticated') {
          errorMsg += ' - Unauthenticated: Firebase auth may have failed';
        } else if (error.code === 'unavailable') {
          errorMsg += ' - Firestore service unavailable';
        }
        
        logger.error(errorMsg);
      });

      logger.info('Firestore listener setup complete');
    } catch (error) {
      const errorMsg = `Failed to setup Firestore listener: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  getSessionUuid(): string | null {
    return this.sessionUuid;
  }

  getGameId(): string | null {
    return this.gameId;
  }

  disconnect() {
    logger.info('Disconnecting Cast Receiver');
    
    // Clean up Firestore listener
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      logger.info('Firestore listener unsubscribed');
    }

    this.gameStateRef = null;

    // Stop the receiver context
    if (this.context) {
      try {
        this.context.stop();
        logger.info('Cast Receiver context stopped');
      } catch (error) {
        const errorMsg = `Error stopping Cast Receiver context: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(errorMsg);
      }
    }
  }
}

export default CastReceiver;