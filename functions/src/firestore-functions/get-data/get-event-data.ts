import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { events } from '../../constants/collections';
import { throwInvalidEventError } from '../../errors/throw-invalid-event-error';
import { Event } from '../../models/event';
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

const errorMessage = 'Event with given id does not exists';

export async function tryGetEventData(eventId: string, transaction?: Transaction) {
    const eventDoc = await getEventDoc(eventId, transaction);

    if (!eventDoc.exists) {
        throwInvalidEventError();
    }

    return createEventData(eventDoc, eventId);
}

export async function getEventDataOrReturnNotFound(
    eventId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const eventDoc = await getEventDoc(eventId, transaction);

    if (!eventDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return createEventData(eventDoc, eventId);
}

export function getEventDocRef(eventId: string) {
    return firestoreDatabase().collection(events).doc(eventId);
}

async function getEventDoc(eventId: string, transaction?: Transaction) {
    const eventDocRef = getEventDocRef(eventId);
    return transaction ? transaction.get(eventDocRef) : eventDocRef.get();
}

function createEventData(eventDoc: DocumentSnapshot, eventId: string) {
    const event = eventDoc.data() as Event;
    event.id = eventId;

    return event;
}
