import * as functions from "firebase-functions";
import {firebaseAuth} from "../modules/firebase-admin-module";
import {throwInvalidUserError} from "../errors/throw-invalid-user-error";
import {Account} from "../interfaces/account";
import {CustomClaims} from "../interfaces/custom-claims";

export async function tryGetCurrentAccount(email: string): Promise<Account> {
    if (!email) {
        const message = 'The function must be called with email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const userRecord = await firebaseAuth().getUserByEmail(email);

    if (!userRecord) {
        throwInvalidUserError();
    }

    const claims = userRecord.customClaims as CustomClaims;

    return {
        id: userRecord.uid,
        claims,
    }
}