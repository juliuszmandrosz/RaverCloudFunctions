import { refundPayment } from './refund-payment/refund-payment';
import { getPaymentSessionsFromEvent } from '../firestore-functions/get-payment-sessions-from-event/get-payment-sessions-from-event';
import { firestore } from 'firebase-admin';
import DocumentReference = firestore.DocumentReference;
import { getVipPaymentSessionDocRef } from '../firestore-functions/get-data/get-vip-payment-session.data';
import { getTicketPaymentSessionDocRef } from '../firestore-functions/get-data/get-ticket-payment-session-data';
import { updateDocRefsBatch } from '../utils/update-doc-refs-batch';
import { TicketPaymentSession } from '../models/ticket-payment-session';
import { VipPaymentSession } from '../models/vip-payment-session';

/// Returns refunded payment sessions
export async function refundTicketsForUsers(eventId: string) {
    const sessions = await getPaymentSessionsFromEvent(eventId);

    let ticketSessionsDocRefs: DocumentReference[] = [];
    let vipSessionsDocRefs: DocumentReference[] = [];

    for (const vipSession of sessions.vipSessions) {
        await refundPayment({ paymentIntentId: vipSession.id });

        vipSessionsDocRefs.push(getVipPaymentSessionDocRef(vipSession.id));
    }

    for (const ticketSession of sessions.ticketSessions) {
        await refundPayment({
            paymentIntentId: ticketSession.id,
        });

        ticketSessionsDocRefs.push(getTicketPaymentSessionDocRef(ticketSession.id));
    }

    await updateDocRefsBatch(ticketSessionsDocRefs, { isRefunded: true } as TicketPaymentSession);
    await updateDocRefsBatch(vipSessionsDocRefs, { isRefunded: true } as VipPaymentSession);

    return sessions;
}
