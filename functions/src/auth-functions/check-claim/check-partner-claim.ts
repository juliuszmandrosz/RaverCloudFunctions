import * as functions from 'firebase-functions';
import { CheckClaimRequest } from './check-claim-request';
import { getCurrentAccountOrUndefined } from '../../utils/get-current-account-or-undefined';
import { tryGetPartnerData } from '../../firestore-functions/get-data/get-partner-data';
import { Partner } from '../../models/partner';

export async function checkPartnerClaim(
    data: CheckClaimRequest,
    _?: functions.https.CallableContext
): Promise<Partner | undefined> {
    // check claim
    const account = await getCurrentAccountOrUndefined(data.email);

    if (!account) return;

    return tryGetPartnerData(account.id);
}
