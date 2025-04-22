import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Make sure we have all required Firebase configuration values
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

// Log configuration for debugging, but don't show the actual values
console.log('Firebase config status:', {
  apiKey: apiKey ? 'Set' : 'Missing',
  projectId: projectId ? 'Set' : 'Missing',
  appId: appId ? 'Set' : 'Missing'
});

// Check for missing configuration
if (!apiKey || !projectId || !appId) {
  console.error('Missing Firebase configuration. Authentication will not work correctly.');
}

// Create the Firebase configuration object
const firebaseConfig = {
  apiKey,
  authDomain: `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: `${projectId}.appspot.com`,
  appId,
};

// Initialize Firebase app - safely handling existing instances
let app;
try {
  // If the app is already initialized, use the existing instance
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }
} catch (err) {
  const error = err as Error;
  console.error("Firebase initialization error:", error.message);
  throw error;
}

// Initialize Firebase auth
const auth = getAuth(app);

export { app, auth };
