import * as functions from 'firebase-functions';
import { eventIndex } from '../modules/algolia-module';
import { createPayoutToPartnerTask } from '../cloud-tasks/create-payout-to-partner-task/create-payout-to-partner-task';
import { Event } from '../models/event';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { EventPayoutTask } from '../models/event-payout-task';
import { getEventPayoutTaskDocRef } from '../firestore-functions/get-data/get-event-payout-task-data';

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
    const payoutTaskId = await createPayoutToPartnerTask({ event });
    await getEventPayoutTaskDocRef(event.id).set({
        payoutTaskId,
        isCompleted: false,
        isCanceled: false,
    } as EventPayoutTask);
}

async function addEventToAlgolia(snapshot: DocumentSnapshot) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    await eventIndex.saveObject(data);
}
