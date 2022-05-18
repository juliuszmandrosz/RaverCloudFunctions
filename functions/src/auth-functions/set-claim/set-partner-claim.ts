import * as functions from 'firebase-functions';
import { CustomClaims } from '../../interfaces/custom-claims';
import { SetClaimRequest } from './set-claim-request';
import { firebaseAuth } from '../../modules/firebase-admin-module';
import { getCurrentAccountOrUndefined } from '../../utils/get-current-account-or-undefined';

export async function setPartnerClaim(data: SetClaimRequest): Promise<void> {
    const account = await getCurrentAccountOrUndefined(data.email);

    if (!account) return;

    if (account.claims?.isPartner) {
        const message = 'Account with given email already has partner claim.';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await firebaseAuth().setCustomUserClaims(account.id, { isPartner: true } as CustomClaims);
}
