import * as functions from 'firebase-functions';
import { CustomClaims } from '../../interfaces/custom-claims';
import { SetClaimRequest } from './set-claim-request';
import { firebaseAuth } from '../../modules/firebase-admin-module';
import { tryGetCurrentAccount } from '../../utils/try-get-current-account';

export async function setSelectorClaim(data: SetClaimRequest): Promise<void> {
    const account = await tryGetCurrentAccount(data.email);

    if (account.claims?.isSelector) {
        const message = 'Account with given email already has selector claim.';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await firebaseAuth().setCustomUserClaims(account.id, { isSelector: true } as CustomClaims);
}
