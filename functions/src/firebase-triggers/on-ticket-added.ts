import * as functions from 'firebase-functions';
import {firestoreDatabase} from "../modules/firebase-admin-module";
import {users} from "../constants/collections";


export async function onTicketAdded(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const userId = context.params.userId;
    await incrementUserTicketsCount(userId);
}

async function incrementUserTicketsCount(userId: string) {
    await firestoreDatabase().collection(users).doc(userId).update({
        ticketsCount: firestoreDatabase.FieldValue.increment(1)
    });
}


