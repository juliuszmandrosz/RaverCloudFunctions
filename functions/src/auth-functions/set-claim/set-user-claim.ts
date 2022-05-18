import * as functions from 'firebase-functions';
import { CustomClaims } from '../../interfaces/custom-claims';
import { SetClaimRequest } from './set-claim-request';
import { firebaseAuth } from '../../modules/firebase-admin-module';
import { getCurrentAccountOrUndefined } from '../../utils/get-current-account-or-undefined';

export async function setUserClaim(data: SetClaimRequest): Promise<void> {
    const account = await getCurrentAccountOrUndefined(data.email);

    if (!account) return;

    if (account.claims?.isUser) {
        const message = 'Account with given email already has user claim.';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await firebaseAuth().setCustomUserClaims(account.id, { isUser: true } as CustomClaims);
}
