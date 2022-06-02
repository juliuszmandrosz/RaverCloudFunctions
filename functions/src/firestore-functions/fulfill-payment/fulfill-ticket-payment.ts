import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import { v1 } from 'uuid';
import { getTicketPaymentSessionDataOrUndefined } from '../get-data/get-ticket-payment-session-data';
import { tasksClient } from '../../modules/cloud-tasks-module';
import { getEventDataOrReturnNotFound } from '../get-data/get-event-data';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { ticketPaymentSessions, tickets, users } from '../../constants/collections';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { updateEventCostsOnUserPayment } from '../update-event-costs/update-event-costs-on-user-payment';
import { Ticket } from '../../models/ticket';

export async function fulfillTicketPayment(
    paymentSessionId: string,
    response: functions.Response
): Promise<void> {
    const ticketPaymentSession = await getTicketPaymentSessionDataOrUndefined(paymentSessionId);

    if (!ticketPaymentSession) return;

    await tasksClient.deleteTask({ name: ticketPaymentSession.cancelTicketReservationTaskId });

    const event = await getEventDataOrReturnNotFound(ticketPaymentSession.eventId, response);

    if (!event) return;

    const ticketId = v1();

    await firestoreDatabase()
        .collection(ticketPaymentSessions)
        .doc(ticketPaymentSession.id)
        .update({
            status: 'succeeded',
            paymentDateTime: Timestamp.now(),
            ticketId: ticketId,
        } as TicketPaymentSession);

    await firestoreDatabase()
        .collection(users)
        .doc(ticketPaymentSession.userId)
        .collection(tickets)
        .doc(ticketId)
        .set({
            eventId: event.id,
            ticketPaymentId: ticketPaymentSession.id,
            isVip: ticketPaymentSession.isVip,
            currency: event.currency,
            price: ticketPaymentSession.amount,
            eventStartDateTime: Timestamp.fromMillis(event.eventStartDateTime),
            eventEndDateTime: Timestamp.fromMillis(event.eventEndDateTime),
            clubName: event.clubName,
            clubId: event.clubId,
            eventName: event.eventName,
            isExpired: false,
            isEventCanceled: false,
            isReturnable: false,
            isReturned: false,
        } as Ticket);

    await updateEventCostsOnUserPayment({
        paymentSessionId: ticketPaymentSession.id,
        eventId: event.id,
        clubId: event.clubId,
        response,
    });
}
