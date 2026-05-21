'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore'

/**
 * Singleton instances to prevent redundant initialization 
 * and internal assertion errors in the Firebase SDK.
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

/**
 * Initializes Firebase SDKs as singletons.
 * Handles fallback for environments where automatic environment-based 
 * initialization is not available (e.g. Vercel, Local Development).
 */
export function initializeFirebase() {
  // Ensure this only runs on the client side to prevent hydration mismatches
  if (typeof window === 'undefined') {
    return {} as any;
  }

  if (!appInstance) {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      try {
        // Attempt argument-less init (works automatically on Firebase App Hosting)
        appInstance = initializeApp();
      } catch (e) {
        // Fallback to local config object. 
        appInstance = initializeApp(firebaseConfig);
      }
    }
  }

  if (!firestoreInstance) {
    try {
      // initializeFirestore is used to apply experimental connectivity settings
      // We use a singleton here to avoid "Firestore already initialized" errors
      // forcing long polling avoids issues with restrictive corporate proxies
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: false,
      });
    } catch (e) {
      // Fallback if firestore is already initialized (e.g., during hot reload)
      firestoreInstance = getFirestore(appInstance);
    }
  }

  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }

  return {
    firebaseApp: appInstance,
    auth: authInstance,
    firestore: firestoreInstance
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
