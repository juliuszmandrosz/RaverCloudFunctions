import * as admin from 'firebase-admin';

admin.initializeApp();

export const firestoreDatabase = admin.firestore;
export const firebaseRemoteConfig = admin.remoteConfig;
export const firebaseAuth = admin.auth;
export const firebaseMessaging = admin.messaging;
