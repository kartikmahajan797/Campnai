// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1-DuGVw2fI_Y6Ni2UzrbjRRap7zYGMu0",
  authDomain: "campnai-42f13.firebaseapp.com",
  projectId: "campnai-42f13",
  storageBucket: "campnai-42f13.appspot.com",
  messagingSenderId: "321007869146",
  appId: "1:321007869146:web:d82e657c0d81f1192c59e3",
  measurementId: "G-Y18TGKRSRV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with proper error handling
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Uncomment below ONLY if using local emulator for testing
// if (window.location.hostname === 'localhost') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
// }

export { auth, app, db };