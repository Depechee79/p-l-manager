import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

/**
 * Firebase configuration
 * 
 * IMPORTANT: Replace these values with your actual Firebase project credentials
 * You can find these in your Firebase Console > Project Settings > General
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID',
};

// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

/**
 * Initialize Firebase if not already initialized
 */
export const initializeFirebase = (): FirebaseApp => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      // Initialize analytics if supported in the environment
      if (typeof window !== 'undefined') {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          console.warn('Firebase Analytics initialization failed:', e);
        }
      }
    } catch (error) {
      console.error('Critical: Firebase failed to initialize', error);
      throw error;
    }
  }
  return app;
};

/**
 * Get Firestore instance
 */
export const getFirestoreInstance = (): Firestore => {
  if (!db) {
    const firebaseApp = initializeFirebase();
    db = getFirestore(firebaseApp);
  }
  return db;
};

/**
 * Get Auth instance
 */
export const getAuthInstance = (): Auth => {
  if (!auth) {
    const firebaseApp = initializeFirebase();
    auth = getAuth(firebaseApp);
  }
  return auth;
};

/**
 * Check if Firebase is configured with real credentials
 */
export const isFirebaseConfigured = (): boolean => {
  return (
    firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
    firebaseConfig.projectId !== 'YOUR_PROJECT_ID'
  );
};

export { firebaseConfig, analytics };
