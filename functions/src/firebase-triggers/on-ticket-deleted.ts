import * as functions from 'firebase-functions';
import {firestoreDatabase} from "../modules/firebase-admin-module";
import {users} from "../constants/collections";


export async function onTicketDeleted(
    snapshot: functions.firestore.DocumentSnapshot,
    context: functions.EventContext
) {
    const userId = context.params.userId;
    await decrementUserTicketsCount(userId);
}

async function decrementUserTicketsCount(userId: string) {
    await firestoreDatabase().collection(users).doc(userId).update({
        ticketsCount: firestoreDatabase.FieldValue.increment(-1)
    });
}


