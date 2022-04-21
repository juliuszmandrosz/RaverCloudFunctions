import * as functions from 'firebase-functions'
import {eventIndex} from '../modules/algolia-module';

export function onEventAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    return eventIndex.saveObject(data);
}

