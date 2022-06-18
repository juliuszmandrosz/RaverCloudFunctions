import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { updateClubSalesTasks } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { UpdateClubSalesTask } from '../../models/update-club-sales-task';

const errorMessage = 'Update club sales task with given id does not exists';

export async function tryGetUpdateClubSalesTaskData(eventId: string, transaction?: Transaction) {
    const updateClubSalesDoc = await getUpdateClubSalesTaskDoc(eventId, transaction);

    if (!updateClubSalesDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getUpdateClubSalesTaskResult(updateClubSalesDoc, eventId);
}

export function getUpdateClubSalesTaskDocRef(eventId: string) {
    return firestoreDatabase().collection(updateClubSalesTasks).doc(eventId);
}

async function getUpdateClubSalesTaskDoc(eventId: string, transaction?: Transaction) {
    const updateClubSalesTaskDocRef = getUpdateClubSalesTaskDocRef(eventId);
    return transaction
        ? transaction.get(updateClubSalesTaskDocRef)
        : updateClubSalesTaskDocRef.get();
}

function getUpdateClubSalesTaskResult(updateClubSalesTaskDoc: DocumentSnapshot, eventId: string) {
    const updateClubSalesTask = updateClubSalesTaskDoc.data() as UpdateClubSalesTask;
    updateClubSalesTask.id = eventId;

    return updateClubSalesTask;
}
