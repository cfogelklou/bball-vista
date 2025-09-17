// Firebase configuration for BallerCast receiver app
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDTl-P5DFUkudgak5WYJ1nXzgODSCbwG2U",
  authDomain: "ballercast-680be.firebaseapp.com",
  projectId: "ballercast-680be",
  storageBucket: "ballercast-680be.firebasestorage.app",
  messagingSenderId: "689555968436",
  appId: "1:689555968436:web:3896d1650aeb65b250a2e1",
  measurementId: "G-9QYYFT8D47",
  // databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  // projectId: "your-project",
  // storageBucket: "your-project.appspot.com",
  //messagingSenderId: "123456789",
  //appId: "Ballercast-rx"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and get a reference to the service
export const firestore = getFirestore(app);