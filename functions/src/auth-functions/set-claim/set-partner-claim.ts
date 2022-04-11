import * as functions from "firebase-functions";
import {throwInvalidUserError} from "../../errors/throw-invalid-user-error";
import {CustomClaims} from "../../interfaces/custom-claims";
import {SetClaimRequest} from "./set-claim-request";
import {firebaseAuth} from "../../modules/firebase-admin-module";


export async function setPartnerClaim(data: SetClaimRequest): Promise<void> {
    const partnerEmail = data?.email;

    if (!partnerEmail) {
        const message = 'The function must be called with user email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const partner = await firebaseAuth().getUserByEmail(partnerEmail);

    if (!partner) {
        throwInvalidUserError();
    }

    if ((partner.customClaims as CustomClaims)?.isPartner) {
        const message = 'Account with given email already has partner claim.';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await firebaseAuth().setCustomUserClaims(partner.uid, {isPartner: true} as CustomClaims);
}
