import * as functions from 'firebase-functions'
import {eventIndex} from '../modules/algolia-module';

export function onEventDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    return eventIndex.deleteObject(snapshot.id);
}

