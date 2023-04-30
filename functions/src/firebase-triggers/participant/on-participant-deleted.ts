import * as functions from 'firebase-functions';
import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {events} from "../../constants/collections";


export async function onParticipantDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const roomId = context.params.roomId;
    await decrementAttendingCount(roomId);
}

async function decrementAttendingCount(roomId: string) {
    await firestoreDatabase().collection(events).doc(roomId).update({
        attending: firestoreDatabase.FieldValue.increment(-1)
    });
}


