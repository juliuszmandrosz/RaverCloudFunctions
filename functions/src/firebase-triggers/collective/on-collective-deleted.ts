import * as functions from 'firebase-functions';
import {collectivesIndex} from "../../modules/algolia-module";

export async function onCollectiveDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    await collectivesIndex.deleteObject(snapshot.id);
}


