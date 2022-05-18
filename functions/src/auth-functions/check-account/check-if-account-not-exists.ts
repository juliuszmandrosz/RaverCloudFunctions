import * as functions from 'firebase-functions';
import { CheckAccountRequest } from './check-account-request';
import { firebaseAuth } from '../../modules/firebase-admin-module';
import { UserRecord } from 'firebase-functions/lib/common/providers/identity';

export async function checkIfAccountNotExists(
    data: CheckAccountRequest,
    _?: functions.https.CallableContext
): Promise<void> {
    const email = data?.email;

    if (!email) {
        const message = 'The function must be called with email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    let account: UserRecord | undefined = undefined;

    try {
        account = await firebaseAuth().getUserByEmail(email);
    } catch {}

    if (account) {
        const message = 'Account with given email already exists';
        throw new functions.https.HttpsError('already-exists', message);
    }
}
