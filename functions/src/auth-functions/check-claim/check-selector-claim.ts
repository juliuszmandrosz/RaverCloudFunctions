import * as functions from 'firebase-functions';
import { CheckClaimRequest } from './check-claim-request';
import { getCurrentAccountOrUndefined } from '../../utils/get-current-account-or-undefined';

export async function checkSelectorClaim(
    data: CheckClaimRequest,
    _?: functions.https.CallableContext
): Promise<void> {
    const account = await getCurrentAccountOrUndefined(data.email);

    if (!account) return;

    if (!account.claims?.isSelector) {
        const message = 'Account with given email has no selector claim.';
        throw new functions.https.HttpsError('permission-denied', message);
    }
}
