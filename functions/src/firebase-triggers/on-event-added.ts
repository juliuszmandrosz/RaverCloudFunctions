import * as functions from 'firebase-functions';
import { eventIndex } from '../modules/algolia-module';
import { createPayoutToPartnerTask } from '../cloud-tasks/create-payout-to-partner-task/create-payout-to-partner-task';
import { Event } from '../models/event';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

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
    await createPayoutToPartnerTask({ event });
}

async function addEventToAlgolia(snapshot: DocumentSnapshot) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    await eventIndex.saveObject(data);
}
