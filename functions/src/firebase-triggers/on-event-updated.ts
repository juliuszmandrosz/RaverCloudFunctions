import * as functions from 'firebase-functions'
import {eventIndex} from '../modules/algolia-module';

export function onEventUpdated(
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    _: functions.EventContext
) {
    const afterUpdate = change.after.data()!;
    afterUpdate.objectID = change.after.id;
    return eventIndex.saveObject(afterUpdate);
}

