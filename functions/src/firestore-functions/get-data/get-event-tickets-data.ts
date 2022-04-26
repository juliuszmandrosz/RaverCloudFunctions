import * as functions from 'firebase-functions';
import { EventTickets } from '../../models/event-tickets';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { clubs, eventTickets } from '../../constants/collections';

const errorMessage = 'Event tickets does not exists';

export async function tryGetEventTicketsData(
    clubId: string,
    eventId: string,
    transaction?: Transaction
) {
    const eventTicketsDoc = await getEventTicketsDoc(clubId, eventId, transaction);

    if (!eventTicketsDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return eventTicketsDoc.data() as EventTickets;
}

export async function getEventTicketsOrReturnNotFound(
    clubId: string,
    eventId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const eventTicketsDoc = await getEventTicketsDoc(clubId, eventId, transaction);

    if (!eventTicketsDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return eventTicketsDoc.data() as EventTickets;
}

export function getEventTicketsDocRef(clubId: string, eventId: string) {
    return firestoreDatabase().collection(clubs).doc(clubId).collection(eventTickets).doc(eventId);
}

async function getEventTicketsDoc(clubId: string, eventId: string, transaction?: Transaction) {
    const eventTicketsDocRef = getEventTicketsDocRef(clubId, eventId);

    return transaction ? transaction.get(eventTicketsDocRef) : eventTicketsDocRef.get();
}
