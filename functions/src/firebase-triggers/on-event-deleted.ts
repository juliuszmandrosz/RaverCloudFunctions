import * as functions from 'firebase-functions';
import {eventCollection} from '../modules/typesense-module';
import {eventsIndex} from "../modules/algolia-module";

export async function onEventDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await eventCollection.documents(snapshot.id).delete();
    await eventsIndex.deleteObject(snapshot.id);
}

