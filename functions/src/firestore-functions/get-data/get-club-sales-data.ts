import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { clubsSales } from '../../constants/collections';
import { ClubSales } from '../../models/club-sales';
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;

const message = 'Club sales for given club does not exists';

export async function tryGetClubSalesData(clubId: string, transaction?: Transaction) {
    const clubSalesDoc = await getClubSalesDoc(clubId, transaction);

    if (!clubSalesDoc.exists) {
        throw new functions.https.HttpsError('not-found', message);
    }

    return clubSalesDoc.data() as ClubSales;
}

export async function getClubSalesOrReturnNotFound(
    clubId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const clubSalesDoc = await getClubSalesDoc(clubId, transaction);

    if (!clubSalesDoc.exists) {
        response.status(404).send(message);
        return;
    }

    return clubSalesDoc.data() as ClubSales;
}

async function getClubSalesDoc(clubId: string, transaction?: Transaction) {
    const clubSalesDocRef = getClubSalesDocRef(clubId);

    return transaction ? transaction.get(clubSalesDocRef) : clubSalesDocRef.get();
}

export function getClubSalesDocRef(clubId: string) {
    return firestoreDatabase().collection(clubsSales).doc(clubId);
}
