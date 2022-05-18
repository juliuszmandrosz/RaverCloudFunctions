import * as functions from 'firebase-functions';
import { CheckClaimRequest } from './check-claim-request';
import { getCurrentAccountOrUndefined } from '../../utils/get-current-account-or-undefined';

export async function checkPartnerClaim(
    data: CheckClaimRequest,
    _?: functions.https.CallableContext
): Promise<void> {
    const account = await getCurrentAccountOrUndefined(data.email);

    if (!account) return;

    if (!account.claims?.isPartner) {
        const message = 'Account with given email has no partner claim.';
        throw new functions.https.HttpsError('permission-denied', message);
    }
}
