import * as functions from 'firebase-functions';
import { CheckClaimRequest } from './check-claim-request';
import { tryGetCurrentAccount } from '../../utils/try-get-current-account';

export async function checkPartnerClaim(
    data: CheckClaimRequest,
    _?: functions.https.CallableContext
): Promise<void> {
    const account = await tryGetCurrentAccount(data.email);

    if (!account.claims?.isPartner) {
        const message = 'Account with given email has no partner claim.';
        throw new functions.https.HttpsError('permission-denied', message);
    }
}
