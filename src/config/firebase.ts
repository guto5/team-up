import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import type { Auth, Persistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey as string,
  authDomain: extra.firebaseAuthDomain as string,
  projectId: extra.firebaseProjectId as string,
  storageBucket: extra.firebaseStorageBucket as string,
  messagingSenderId: extra.firebaseMessagingSenderId as string,
  appId: extra.firebaseAppId as string,
};

if (__DEV__ && !firebaseConfig.apiKey) {
  console.warn(
    '[firebase] Configuração vazia. Verifique o .env e reinicie com: npm start',
  );
}

type FirebaseAuthRn = {
  initializeAuth: (
    app: FirebaseApp,
    deps?: { persistence: Persistence },
  ) => Auth;
  getAuth: (app?: FirebaseApp) => Auth;
  getReactNativePersistence: (
    storage: typeof AsyncStorage,
  ) => Persistence;
};

// Metro resolves @firebase/auth to the React Native build at runtime.
const {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} = require('@firebase/auth') as FirebaseAuthRn;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;

function createFirestore() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}

export const db = createFirestore();
