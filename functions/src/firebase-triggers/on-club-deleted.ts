import * as functions from 'firebase-functions';
import {clubCollection} from '../modules/typesense-module';
import {clubsIndex} from "../modules/algolia-module";

export async function onClubDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await clubCollection.documents(snapshot.id).delete();
    await clubsIndex.deleteObject(snapshot.id);
}

