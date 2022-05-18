import * as functions from 'firebase-functions';
import { CheckAccountRequest } from './check-account-request';
import { firebaseAuth } from '../../modules/firebase-admin-module';

export async function checkIfAccountExists(
    data: CheckAccountRequest,
    _?: functions.https.CallableContext
): Promise<void> {
    const email = data?.email;

    if (!email) {
        const message = 'The function must be called with email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    try {
        await firebaseAuth().getUserByEmail(email);
    } catch {
        const message = 'Account with given email does not exists';
        throw new functions.https.HttpsError('not-found', message);
    }
}
