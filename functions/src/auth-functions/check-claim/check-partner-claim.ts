import * as functions from 'firebase-functions';
import { CheckClaimRequest } from './check-claim-request';
import { getCurrentAccountOrUndefined } from '../../utils/get-current-account-or-undefined';
import { tryGetPartnerData } from '../../firestore-functions/get-data/get-partner-data';

export async function checkPartnerClaim(
    data: CheckClaimRequest,
    _?: functions.https.CallableContext
): Promise<void> {
    const account = await getCurrentAccountOrUndefined(data.email);

    if (!account) return;

    await tryGetPartnerData(account.id);
}
