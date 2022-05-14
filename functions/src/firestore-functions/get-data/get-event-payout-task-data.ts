import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { eventsPayoutTasks } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;
import { EventPayoutTask } from '../../models/event-payout-task';

const errorMessage = 'Event payout task with given id does not exists';

export async function tryGetEventPayoutTaskData(eventId: string, transaction?: Transaction) {
    const eventPayoutTaskDoc = await getEventPayoutTaskDoc(eventId, transaction);

    if (!eventPayoutTaskDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getEventPayoutTaskData(eventPayoutTaskDoc, eventId);
}

export async function getEventPayoutTaskDataOrReturnNotFound(
    eventId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const eventPayoutTaskDoc = await getEventPayoutTaskDoc(eventId, transaction);

    if (!eventPayoutTaskDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return getEventPayoutTaskData(eventPayoutTaskDoc, eventId);
}

export async function getEventPayoutTaskDataOrUndefined(
    eventId: string,
    transaction?: Transaction
) {
    const eventPayoutTaskDoc = await getEventPayoutTaskDoc(eventId, transaction);

    if (!eventPayoutTaskDoc.exists) {
        return;
    }

    return getEventPayoutTaskData(eventPayoutTaskDoc, eventId);
}

export function getEventPayoutTaskDocRef(eventId: string) {
    return firestoreDatabase().collection(eventsPayoutTasks).doc(eventId);
}

async function getEventPayoutTaskDoc(eventId: string, transaction?: Transaction) {
    const eventPayoutTaskDocRef = getEventPayoutTaskDocRef(eventId);
    return transaction ? transaction.get(eventPayoutTaskDocRef) : eventPayoutTaskDocRef.get();
}

function getEventPayoutTaskData(eventPayoutTaskDoc: DocumentSnapshot, eventId: string) {
    const eventPayoutTask = eventPayoutTaskDoc.data() as EventPayoutTask;

    eventPayoutTask.id = eventId;

    return eventPayoutTask;
}
