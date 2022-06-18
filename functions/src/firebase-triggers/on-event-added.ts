import * as functions from 'firebase-functions';
import { eventIndex } from '../modules/algolia-module';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { createUpdateClubSalesOnEventEndTask } from '../cloud-tasks/update-club-sales-on-event-end-task/create-update-club-sales-on-event-end-task';
import { Event } from '../models/event';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;

export async function onEventAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await addEventToAlgolia(snapshot);
    await createUpdateClubSalesTask(snapshot);
}

async function addEventToAlgolia(snapshot: DocumentSnapshot) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    await eventIndex.saveObject(data);
}

async function createUpdateClubSalesTask(snapshot: DocumentSnapshot) {
    const event = snapshot.data() as Event;
    await createUpdateClubSalesOnEventEndTask({
        eventId: snapshot.id,
        clubId: event.clubId,
        executesAt: Timestamp.fromMillis(event.eventEndDateTime),
    });
}
