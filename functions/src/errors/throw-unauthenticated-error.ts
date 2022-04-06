import * as functions from "firebase-functions";

export function throwUnauthenticatedError() {
    const message = 'The function must be called while authenticated.';
    throw new functions.https.HttpsError('failed-precondition', message);
}