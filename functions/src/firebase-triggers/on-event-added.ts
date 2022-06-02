import * as functions from 'firebase-functions';
import { eventIndex } from '../modules/algolia-module';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

export async function onEventAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await addEventToAlgolia(snapshot);
}

async function addEventToAlgolia(snapshot: DocumentSnapshot) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    await eventIndex.saveObject(data);
}
