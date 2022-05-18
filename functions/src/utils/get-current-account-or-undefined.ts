import * as functions from 'firebase-functions';
import { firebaseAuth } from '../modules/firebase-admin-module';
import { Account } from '../interfaces/account';
import { CustomClaims } from '../interfaces/custom-claims';
import { UserRecord } from 'firebase-functions/lib/common/providers/identity';

export async function getCurrentAccountOrUndefined(email: string): Promise<Account | undefined> {
    if (!email) {
        const message = 'The function must be called with email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    let userRecord: UserRecord;

    try {
        userRecord = await firebaseAuth().getUserByEmail(email);
    } catch (e) {
        return;
    }

    const claims = userRecord.customClaims as CustomClaims;

    return {
        id: userRecord.uid,
        claims,
    };
}
