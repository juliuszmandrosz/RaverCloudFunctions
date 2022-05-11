import { tasksClient } from '../modules/cloud-tasks-module';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import {
    cancelEventPaymentSessions,
    ticketPaymentSessions,
    vipPaymentSessions,
} from '../constants/collections';
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { getEventDataOrReturnNotFound } from './get-data/get-event-data';
import { getCancelEventPaymentSessionDataOrUndefined } from './get-data/get-cancel-event-payment-session';
import { CancelEventPaymentSession } from '../models/cancel-event-payment-session';
import { updateEventCostsOnEventCancelation } from './update-event-costs/update-event-costs-on-event-cancelation';
import { TicketPaymentSession } from '../models/ticket-payment-session';
import { VipPaymentSession } from '../models/vip-payment-session';
import { refundPayment } from '../stripe-functions/refund-payment/refund-payment';
import DocumentReference = firestore.DocumentReference;
import { getTicketDocRef } from './get-data/get-ticket-data';
import { updateEventOnEventCancelation } from './update-event/update-event-on-event-cancelation';

export async function fulfillEventCancelationPayment(
    paymentSessionId: string,
    response: functions.Response
): Promise<void> {
    const cancelEventPaymentSession = await getCancelEventPaymentSessionDataOrUndefined(
        paymentSessionId
    );

    if (!cancelEventPaymentSession) return;

    await tasksClient.deleteTask({ name: cancelEventPaymentSession.cancelEventCancelationTaskId });

    const event = await getEventDataOrReturnNotFound(cancelEventPaymentSession.eventId, response);

    if (!event) return;

    await firestoreDatabase()
        .collection(cancelEventPaymentSessions)
        .doc(cancelEventPaymentSession.id)
        .update({
            status: 'succeeded',
            paymentDateTime: Timestamp.now(),
        } as CancelEventPaymentSession);

    await updateEventCostsOnEventCancelation({
        paymentSessionId: cancelEventPaymentSession.id,
        eventId: event.id,
        clubId: event.clubId,
        response,
    });

    await refundTicketsForUsers(event.id);
    await updateEventOnEventCancelation(event.id, response);
}

async function refundTicketsForUsers(eventId: string) {
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

    const ticketSessions = ticketSessionsData.docs.map((doc) => doc.data() as TicketPaymentSession);
    const vipSessions = vipSessionsData.docs.map((doc) => doc.data() as VipPaymentSession);
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

    await deleteTickets(ticketRefs);
}

async function deleteTickets(ticketRefs: DocumentReference[]) {
    const ticketRefsToDelete = ticketRefs.slice(0, 500);
    const batchSize = ticketRefsToDelete.length;

    if (batchSize === 0) return;

    const batch = firestoreDatabase().batch();

    ticketRefs.forEach((ref) => {
        batch.delete(ref);
    });

    await batch.commit();

    ticketRefs.splice(0, 500);

    process.nextTick(() => {
        deleteTickets(ticketRefs);
    });
}
