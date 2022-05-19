import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { stripeConnectedAccounts } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { StripeConnectedAccount } from '../../models/stripe-connected-account';

export async function getConnectedAccountData(partnerId: string) {
    const connectedAccountDoc = await getConnectedAccountDocRef(partnerId).get();

    if (!connectedAccountDoc.exists) {
        const message = 'Connected account with given id does not exists';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    return connectedAccountDoc.data() as StripeConnectedAccount;
}

export function getConnectedAccountDocRef(partnerId: string) {
    return firestoreDatabase().collection(stripeConnectedAccounts).doc(partnerId);
}
