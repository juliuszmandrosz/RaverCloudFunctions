import * as functions from "firebase-functions";
import {throwInvalidUserError} from "../../errors/throw-invalid-user-error";
import {CustomClaims} from "../../interfaces/custom-claims";
import {SetClaimRequest} from "./set-claim-request";
import {firebaseAuth} from "../../modules/firebase-admin-module";


export async function setSelectorClaim(data: SetClaimRequest): Promise<void> {
    const selectorEmail = data?.email;

    if (!selectorEmail) {
        const message = 'The function must be called with user email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const selector = await firebaseAuth().getUserByEmail(selectorEmail);

    if (!selector) {
        throwInvalidUserError();
    }

    if ((selector.customClaims as CustomClaims)?.isSelector) {
        const message = 'Account with given email already has selector claim.';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await firebaseAuth().setCustomUserClaims(selector.uid, {isSelector: true} as CustomClaims);
}
