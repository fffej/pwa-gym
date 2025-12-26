import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdT1yXgFnm1YeieYQmuBo3jxG2rNr9J5s",
  authDomain: "pwa-gympapp.firebaseapp.com",
  projectId: "pwa-gympapp",
  storageBucket: "pwa-gympapp.firebasestorage.app",
  messagingSenderId: "872840932450",
  appId: "1:872840932450:web:e5b21a7b9f194d6366753b",
  measurementId: "G-B24JB0SC15"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Auth
export const auth = getAuth(app)

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider()

// Initialize Firestore
export const firestore = getFirestore(app)

// Enable offline persistence for Firestore (optional, adds redundancy to Dexie)
enableIndexedDbPersistence(firestore).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence failed: multiple tabs open')
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support persistence
    console.warn('Firestore persistence not supported in this browser')
  }
})

export default app



