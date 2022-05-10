import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { ticketPaymentSessions } from '../../constants/collections';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { stripe } from '../../modules/stripe-module';
import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;
import UpdateData = firestore.UpdateData;
import { QueryDocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

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

        canceledFunds += session.amount;
    }

    await cancelUserTicketPaymentSessionsQueryBatch(query.limit(500), {
        status: 'canceled',
    } as TicketPaymentSession);

    return { canceledFunds, canceledTicketSessionsQuantity, canceledVipSessionsQuantity };
}

async function cancelUserTicketPaymentSessionsQueryBatch(query: DocumentData, data: UpdateData) {
    const snapshot: DocumentData = await query.get();

    const batchSize = snapshot.size;

    if (batchSize === 0) return;

    const batch = firestoreDatabase().batch();

    const docs: QueryDocumentSnapshot[] = snapshot.docs;

    for (const doc of docs) {
        batch.update(doc.ref, data);
        await stripe.paymentIntents.cancel(doc.id);
    }

    await batch.commit();

    process.nextTick(() => {
        cancelUserTicketPaymentSessionsQueryBatch(query, data);
    });
}
