import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { clubs, eventCosts } from '../../constants/collections';
import { EventCosts } from '../../models/event-costs';
import DocumentSnapshot = firestore.DocumentSnapshot;

const errorMessage = 'Event costs does not exists';

export async function tryGetEventCostsData(
    clubId: string,
    eventId: string,
    transaction?: Transaction
) {
    const eventCostsDoc = await getEventCostsDoc(clubId, eventId, transaction);

    if (!eventCostsDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getEventCostsResult(eventId, eventCostsDoc);
}

export async function getEventCostsOrReturnNotFound(
    clubId: string,
    eventId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const eventCostsDoc = await getEventCostsDoc(clubId, eventId, transaction);

    if (!eventCostsDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return getEventCostsResult(eventId, eventCostsDoc);
}

export function getEventCostsDocRef(clubId: string, eventId: string) {
    return firestoreDatabase().collection(clubs).doc(clubId).collection(eventCosts).doc(eventId);
}

async function getEventCostsDoc(clubId: string, eventId: string, transaction?: Transaction) {
    const eventCostsDocRef = getEventCostsDocRef(clubId, eventId);

    return transaction ? transaction.get(eventCostsDocRef) : eventCostsDocRef.get();
}

function getEventCostsResult(eventId: string, eventCostsDoc: DocumentSnapshot) {
    return eventCostsDoc.data() as EventCosts;
}
