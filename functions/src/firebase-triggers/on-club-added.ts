import * as functions from 'firebase-functions'
import {clubIndex} from '../modules/algolia-module';

export function onClubAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    const data = snapshot.data()!;
    data.objectID = snapshot.id;
    return clubIndex.saveObject(data)
}

