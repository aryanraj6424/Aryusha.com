import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD2ewGywO8euq1trUxz4GAtvpQfaHu4tZ8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aryusha-6596a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aryusha-6596a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aryusha-6596a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "303699047475",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:303699047475:web:284aaceb0f5a7e629c9f46",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NGMSSQJ40Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
