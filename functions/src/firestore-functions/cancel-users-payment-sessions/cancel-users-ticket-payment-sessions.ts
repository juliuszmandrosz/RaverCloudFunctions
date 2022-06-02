import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { ticketPaymentSessions } from '../../constants/collections';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { cancelUsersPaymentSessionsQueryBatch } from './cancel-users-payment-sessions-query-batch';

interface CancelUsersTicketPaymentSessionsResponse {
    canceledTicketSessionsQuantity: number;
    canceledVipSessionsQuantity: number;
    canceledFunds: number;
}

export async function cancelUsersTicketPaymentSessions(
    eventId: string
): Promise<CancelUsersTicketPaymentSessionsResponse> {
    const query = firestoreDatabase()
        .collection(ticketPaymentSessions)
        .where('eventId', '==', eventId)
        .where('status', 'in', ['requires_payment_method', 'requires_action']);

    const sessionsSnapshot = await query.get();
    const sessions = sessionsSnapshot.docs.map((doc) => doc.data() as TicketPaymentSession);

    let canceledTicketSessionsQuantity = 0;
    let canceledVipSessionsQuantity = 0;
    let canceledFunds = 0;

    for (const session of sessions) {
        canceledTicketSessionsQuantity++;

        if (session.isVip) {
            canceledVipSessionsQuantity++;
        }

        canceledFunds += session.clubIncome;
    }

    await cancelUsersPaymentSessionsQueryBatch(query.limit(500), {
        status: 'canceled',
    } as TicketPaymentSession);

    return { canceledFunds, canceledTicketSessionsQuantity, canceledVipSessionsQuantity };
}
