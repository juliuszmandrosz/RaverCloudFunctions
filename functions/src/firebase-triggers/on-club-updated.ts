import * as functions from 'firebase-functions'
import {clubIndex} from '../modules/algolia-module';

export function onClubUpdated(
    change: functions.Change<functions.firestore.DocumentSnapshot>,
    _: functions.EventContext
) {
    const afterUpdate = change.after.data()!;
    afterUpdate.objectID = change.after.id;
    return clubIndex.saveObject(afterUpdate)
}

