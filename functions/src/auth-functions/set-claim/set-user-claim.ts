import * as functions from "firebase-functions";
import {throwInvalidUserError} from "../../errors/throw-invalid-user-error";
import {CustomClaims} from "../../interfaces/custom-claims";
import {SetClaimRequest} from "./set-claim-request";
import {firebaseAuth} from "../../modules/firebase-admin-module";


export async function setUserClaim(data: SetClaimRequest): Promise<void> {
    const userEmail = data?.email;

    if (!userEmail) {
        const message = 'The function must be called with user email.';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const user = await firebaseAuth().getUserByEmail(userEmail);

    if (!user) {
        throwInvalidUserError();
    }

    if ((user.customClaims as CustomClaims)?.isUser) {
        const message = 'Account with given email already has user claim.';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await firebaseAuth().setCustomUserClaims(user.uid, {isUser: true} as CustomClaims);
}
