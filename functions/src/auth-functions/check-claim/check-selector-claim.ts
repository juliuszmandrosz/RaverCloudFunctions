import * as functions from "firebase-functions";
import {throwInvalidUserError} from "../../errors/throw-invalid-user-error";
import {CustomClaims} from "../../interfaces/custom-claims";
import {CheckClaimRequest} from "./check-claim-request";
import {firebaseAuth} from "../../modules/firebase-admin-module";

export async function checkSelectorClaim(
    data: CheckClaimRequest,
    _?: functions.https.CallableContext
): Promise<void> {
    const selectorEmail = data?.email;

    if (!selectorEmail) {
        const message = 'The function must be called with user email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const selector = await firebaseAuth().getUserByEmail(selectorEmail);

    if (!selector) {
        throwInvalidUserError();
    }

    if (!(selector.customClaims as CustomClaims)?.isSelector) {
        const message = 'Account with given email has no selector claim.';
        throw new functions.https.HttpsError('permission-denied', message);
    }
}