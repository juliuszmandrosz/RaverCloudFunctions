import * as functions from "firebase-functions";

export function throwInvalidUserError() {
    const message = 'User with given id does not exists';
    throw new functions.https.HttpsError('not-found', message);
}
