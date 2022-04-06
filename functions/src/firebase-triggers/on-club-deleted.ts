import * as functions from "firebase-functions";
import {clubIndex} from "../modules/algolia-module";

export function onClubDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    _: functions.EventContext
) {
    return clubIndex.deleteObject(snapshot.id);
}

