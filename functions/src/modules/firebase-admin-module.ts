import * as admin from "firebase-admin";

admin.initializeApp();

export const firestoreDatabase = admin.firestore;
export const firebaseRemoteConfig = admin.remoteConfig;