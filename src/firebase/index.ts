'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore'

/**
 * Initializes Firebase SDKs.
 * Handles fallback for environments where automatic environment-based 
 * initialization is not available (e.g. Vercel, Local Development).
 */
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp;
  try {
    // Attempt argument-less init (works automatically on Firebase App Hosting)
    firebaseApp = initializeApp();
  } catch (e) {
    // Fallback to local config object. 
    // We catch silently because this is expected on non-Firebase Hosting platforms.
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

/**
 * Provides access to initialized SDKs.
 * Uses initializeFirestore with long polling to ensure better connectivity in 
 * cloud development environments where WebSockets might be restricted.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  let firestore: Firestore;
  try {
    // Using initializeFirestore instead of getFirestore to set experimental settings
    firestore = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    });
  } catch (e) {
    // Fallback if firestore is already initialized
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore
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
