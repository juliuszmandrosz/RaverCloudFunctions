import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { ticketPaymentSessions } from '../../constants/collections';
import { getTicketPaymentSessionResult } from '../get-data/get-ticket-payment-session-data';

export async function getTicketPaymentSessionsFromEvent(eventId: string) {
    const ticketSessionsData = await firestoreDatabase()
        .collection(ticketPaymentSessions)
        .where('status', '==', 'succeeded')
        .where('eventId', '==', eventId)
        .where('isRefunded', '==', false)
        .get();

    return ticketSessionsData.docs.map((doc) => getTicketPaymentSessionResult(doc, doc.id));
}
