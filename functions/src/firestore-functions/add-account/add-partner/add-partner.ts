import * as functions from "firebase-functions";
import {throwUnauthenticatedError} from "../../../errors/throw-unauthenticated-error";
import {firestoreDatabase} from "../../../modules/firebase-admin-module";
import {partners, stripeConnectedAccounts} from "../../../constants/collections";
import {setPartnerClaim} from "../../../auth-functions/set-claim/set-partner-claim";
import {Partner} from "../../../models/partner";
import {StripeConnectedAccount} from "../../../models/stripe-connected-account";
import {AddPartnerRequest} from "./add-partner-request";


export async function addPartner(
    data: AddPartnerRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const partnerId = context.auth!.token.uid;
    const email = context.auth!.token.email!;
    const connectedAccountId = data?.connectedAccountId;

    if (!connectedAccountId) {
        const message = 'The function must be called with connected account id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const partnerDocRef = firestoreDatabase().collection(partners).doc(partnerId);
    const partnerDoc = await partnerDocRef.get();

    if (partnerDoc.exists) {
        const message = 'Partner with given id already exists';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await setPartnerClaim({email});

    await partnerDocRef.set({email} as Partner);

    await firestoreDatabase()
        .collection(stripeConnectedAccounts).doc(partnerId).set({
            connectedAccountId
        } as StripeConnectedAccount);
}

