import * as functions from 'firebase-functions';
import {artistsIndex} from "../../modules/algolia-module";

export async function onArtistDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await artistsIndex.deleteObject(snapshot.id);
}


