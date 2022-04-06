import {firestoreDatabase} from "../../modules/firebase-admin-module";
import {tickets, users} from "../../constants/collections";
import * as functions from "firebase-functions";
import {Ticket} from "../../models/ticket";

export async function getTicketData(userId: string, ticketId: string) {
    const ticketDoc = await firestoreDatabase()
        .collection(users).doc(userId)
        .collection(tickets).doc(ticketId)
        .get();

    if (!ticketDoc.exists) {
        const message = 'Ticket with given id does not exists.';
        throw new functions.https.HttpsError('not-found', message);
    }

    const ticket = ticketDoc.data() as Ticket;
    ticket.id = ticketId;

    return ticket;
}