import * as functions from 'firebase-functions';
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {events} from "../../constants/collections";


export async function onParticipantAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const roomId = context.params.roomId;
    await incrementAttendingCount(roomId);
}

async function incrementAttendingCount(roomId: string) {
    await firestoreDatabase().collection(events).doc(roomId).update({
        attending: firestoreDatabase.FieldValue.increment(1)
    });
}


