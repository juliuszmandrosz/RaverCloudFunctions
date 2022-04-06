import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { stripeConnectedAccounts } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { StripeConnectedAccount } from '../../models/stripe-connected-account';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;

const errorMessage = 'Connected account with given id does not exists';

export async function tryGetConnectedAccountData(partnerId: string, transaction?: Transaction) {
    const connectedAccountDoc = await getConnectedAccountDoc(partnerId, transaction);

    if (!connectedAccountDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return connectedAccountDoc.data() as StripeConnectedAccount;
}

export async function getConnectedAccountDataOrReturnNotFound(
    partnerId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const connectedAccountDoc = await getConnectedAccountDoc(partnerId, transaction);

    if (!connectedAccountDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return connectedAccountDoc.data() as StripeConnectedAccount;
}

export function getConnectedAccountDocRef(partnerId: string) {
    return firestoreDatabase().collection(stripeConnectedAccounts).doc(partnerId);
}

async function getConnectedAccountDoc(partnerId: string, transaction?: Transaction) {
    const connectedAccountDocRef = getConnectedAccountDocRef(partnerId);
    return transaction ? transaction.get(connectedAccountDocRef) : connectedAccountDocRef.get();
}
