import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use same Firebase project as the web app
const firebaseConfig = {
    apiKey: 'AIzaSyAJVTzQCaNiTJ2vbgQInCbfBGQBbAWi8uY',
    authDomain: 'transcredit-demo.firebaseapp.com',
    projectId: 'transcredit-demo',
    storageBucket: 'transcredit-demo.firebasestorage.app',
    messagingSenderId: '460628193343',
    appId: '1:460628193343:web:7a8bc3a4f9bd028da8488a',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize auth with AsyncStorage persistence for React Native
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch {
    // Auth already initialized
    auth = getAuth(app);
}

export { app, auth };
