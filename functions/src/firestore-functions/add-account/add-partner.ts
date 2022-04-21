import * as functions from "firebase-functions";
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {partners, stripeConnectedAccounts} from "../../constants/collections";
import {setPartnerClaim} from "../../auth-functions/set-claim/set-partner-claim";
import {Partner} from "../../models/partner";
import {StripeConnectedAccount} from "../../models/stripe-connected-account";


export async function addPartner(
    data: any,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        const message = 'The function must be called while authenticated.';
        throw new functions.https.HttpsError('failed-precondition', message);
    }

    const partnerId = context.auth.token.uid;
    const email = context.auth.token.email!;


    const partnerDocRef = firestoreDatabase().collection(partners).doc(partnerId);
    const partnerDoc = await partnerDocRef.get();

    if (partnerDoc.exists) {
        const message = 'Partner with given id already exists';
        throw new functions.https.HttpsError('already-exists', message);
    }

    await setPartnerClaim({email});

    await partnerDocRef.set({
            email,
            // TODO - change
            clubId: '3zt2MqBmEra7Bglmwkt2'
        } as Partner
    );

    await firestoreDatabase().collection(stripeConnectedAccounts).doc(partnerId).set({
            // TODO - change
            connectedAccountId: 'acct_1KhdCYRidFmpr8Rx'
        } as StripeConnectedAccount
    );
}

