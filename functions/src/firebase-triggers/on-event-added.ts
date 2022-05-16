import * as functions from 'firebase-functions';
import { eventIndex } from '../modules/algolia-module';
import { createPayoutToPartnerTask } from '../cloud-tasks/payout-to-partner-task/create-payout-to-partner-task';
import { Event } from '../models/event';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export async function onEventAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await addEventToAlgolia(snapshot);
    await createPayoutTask(snapshot);
}

async function createPayoutTask(snapshot: DocumentSnapshot) {
    const event = snapshot.data() as Event;
    event.id = snapshot.id;
    await createPayoutToPartnerTask({
        eventId: event.id,
        executesAt: Timestamp.fromMillis(event.eventEndDateTime),
    });
}

async function addEventToAlgolia(snapshot: DocumentSnapshot) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    await eventIndex.saveObject(data);
}
