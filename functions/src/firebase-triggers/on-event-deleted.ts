import * as functions from 'firebase-functions';
import { eventCollection } from '../modules/typesense-module';

export async function onEventDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await deleteEventFromTypesense(snapshot.id);
}

async function deleteEventFromTypesense(eventId: string) {
    await eventCollection.documents(eventId).delete();
}
