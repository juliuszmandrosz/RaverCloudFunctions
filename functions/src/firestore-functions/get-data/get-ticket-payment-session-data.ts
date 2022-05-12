import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { ticketPaymentSessions } from '../../constants/collections';
import * as functions from 'firebase-functions';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { firestore } from 'firebase-admin';
import Transaction = firestore.Transaction;

const errorMessage = 'Ticket payment session with given id does not exists';

export async function tryGetTicketPaymentSessionData(
    ticketPaymentSessionId: string,
    transaction?: Transaction
) {
    const ticketPaymentDoc = await getTicketPaymentSessionDoc(ticketPaymentSessionId, transaction);

    if (!ticketPaymentDoc.exists) {
        throw new functions.https.HttpsError('not-found', errorMessage);
    }

    return getTicketPaymentSessionResult(ticketPaymentDoc, ticketPaymentSessionId);
}

export async function getTicketPaymentSessionDataOrReturnNotFound(
    ticketPaymentSessionId: string,
    response: functions.Response,
    transaction?: Transaction
) {
    const ticketPaymentDoc = await getTicketPaymentSessionDoc(ticketPaymentSessionId, transaction);

    if (!ticketPaymentDoc.exists) {
        response.status(404).send(errorMessage);
        return;
    }

    return getTicketPaymentSessionResult(ticketPaymentDoc, ticketPaymentSessionId);
}

export async function getTicketPaymentSessionDataOrUndefined(
    ticketPaymentSessionId: string,
    transaction?: Transaction
) {
    const ticketPaymentDoc = await getTicketPaymentSessionDoc(ticketPaymentSessionId, transaction);

    if (!ticketPaymentDoc.exists) {
        return;
    }

    return getTicketPaymentSessionResult(ticketPaymentDoc, ticketPaymentSessionId);
}

export function getTicketPaymentSessionDocRef(ticketPaymentSessionId: string) {
    return firestoreDatabase().collection(ticketPaymentSessions).doc(ticketPaymentSessionId);
}

export function getTicketPaymentSessionResult(
    ticketPaymentSessionDoc: DocumentSnapshot,
    ticketPaymentSessionId: string
) {
    const ticketPaymentSession = ticketPaymentSessionDoc.data() as TicketPaymentSession;
    ticketPaymentSession.id = ticketPaymentSessionId;

    return ticketPaymentSession;
}

async function getTicketPaymentSessionDoc(
    ticketPaymentSessionId: string,
    transaction?: Transaction
) {
    const ticketPaymentSessionDocRef = getTicketPaymentSessionDocRef(ticketPaymentSessionId);
    return transaction
        ? transaction.get(ticketPaymentSessionDocRef)
        : ticketPaymentSessionDocRef.get();
}
