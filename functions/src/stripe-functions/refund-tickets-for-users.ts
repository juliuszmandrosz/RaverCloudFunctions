import { firestoreDatabase } from '../modules/firebase-admin-module';
import { ticketPaymentSessions, vipPaymentSessions } from '../constants/collections';
import { getTicketPaymentSessionResult } from '../firestore-functions/get-data/get-ticket-payment-session-data';
import { getVipPaymentSessionResult } from '../firestore-functions/get-data/get-vip-payment-session.data';
import { refundPayment } from './refund-payment/refund-payment';
import { getTicketDocRef } from '../firestore-functions/get-data/get-ticket-data';
import { firestore } from 'firebase-admin';
import DocumentReference = firestore.DocumentReference;
import { Ticket } from '../models/ticket';

export async function refundTicketsForUsers(eventId: string) {
    const ticketSessionsData = await firestoreDatabase()
        .collection(ticketPaymentSessions)
        .where('status', '==', 'succeeded')
        .where('eventId', '==', eventId)
        .get();

    const vipSessionsData = await firestoreDatabase()
        .collection(vipPaymentSessions)
        .where('status', '==', 'succeeded')
        .where('eventId', '==', eventId)
        .get();

    const ticketSessions = ticketSessionsData.docs.map((doc) =>
        getTicketPaymentSessionResult(doc, doc.id)
    );
    const vipSessions = vipSessionsData.docs.map((doc) => getVipPaymentSessionResult(doc, doc.id));
    let ticketRefs: DocumentReference[] = [];

    for (const vipSession of vipSessions) {
        await refundPayment({ paymentIntentId: vipSession.id, transferId: vipSession.transferId! });
    }

    for (const ticketSession of ticketSessions) {
        await refundPayment({
            paymentIntentId: ticketSession.id,
            transferId: ticketSession.transferId!,
        });

        ticketRefs.push(getTicketDocRef(ticketSession.userId, ticketSession.ticketId));
    }

    await updateTickets(ticketRefs);
}

async function updateTickets(ticketRefs: DocumentReference[]) {
    const ticketRefsToUpdate = ticketRefs.slice(0, 500);
    const batchSize = ticketRefsToUpdate.length;

    if (batchSize === 0) return;

    const batch = firestoreDatabase().batch();

    ticketRefs.forEach((ref) => {
        batch.update(ref, { isEventCanceled: true } as Ticket);
    });

    await batch.commit();

    ticketRefs.splice(0, 500);

    process.nextTick(() => {
        updateTickets(ticketRefs);
    });
}
