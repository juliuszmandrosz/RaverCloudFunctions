import { refundPayment } from './refund-payment/refund-payment';

import { getPaymentSessionsFromEvent } from '../firestore-functions/get-payment-sessions-from-event/get-payment-sessions-from-event';

/// Returns refunded payment sessions
export async function refundTicketsForUsers(eventId: string) {
    const sessions = await getPaymentSessionsFromEvent(eventId);

    for (const vipSession of sessions.vipSessions) {
        await refundPayment({ paymentIntentId: vipSession.id, transferId: vipSession.transferId! });
    }

    for (const ticketSession of sessions.ticketSessions) {
        await refundPayment({
            paymentIntentId: ticketSession.id,
            transferId: ticketSession.transferId!,
        });
    }

    return sessions;
}
