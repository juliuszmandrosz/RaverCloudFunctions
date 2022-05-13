import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { tickets, users } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { Ticket } from '../../models/ticket';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;

const errorMessage = 'Ticket with given id does not exists.';

export async function tryGetTicketData(
    userId: string,
    ticketId: string,
    transaction?: Transaction
) {
    const ticketDoc = await getTicketDoc(userId, ticketId, transaction);

    if (!ticketDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return createTicketData(ticketDoc, ticketId);
}

export async function getTicketDataOrReturnNotFound(
    userId: string,
    ticketId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const ticketDoc = await getTicketDoc(userId, ticketId, transaction);

    if (!ticketDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return createTicketData(ticketDoc, ticketId);
}

export function getTicketDocRef(userId: string, ticketId: string) {
    return firestoreDatabase().collection(users).doc(userId).collection(tickets).doc(ticketId);
}

async function getTicketDoc(userId: string, ticketId: string, transaction?: Transaction) {
    const ticketDocRef = getTicketDocRef(userId, ticketId);

    return transaction ? transaction.get(ticketDocRef) : ticketDocRef.get();
}

async function createTicketData(ticketDoc: DocumentSnapshot, ticketId: string) {
    const ticket = ticketDoc.data() as Ticket;
    ticket.id = ticketId;

    return ticket;
}
