import * as functions from 'firebase-functions';
import { CancelTicketReservationRequest } from './cancel-ticket-reservation-request';
import {
    getTicketPaymentSessionDataOrReturnNotFound,
    getTicketPaymentSessionDocRef,
} from '../get-data/get-ticket-payment-session-data';
import { updateEventOnCancelReservation } from '../update-event/update-event-on-cancel-reservation';
import { stripe } from '../../modules/stripe-module';
import { firestoreDatabase } from '../../modules/firebase-admin-module';
import { TicketPaymentSession } from '../../models/ticket-payment-session';

export async function cancelTicketReservation(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const cancelTicketReservationRequest = request.body as CancelTicketReservationRequest;

    const ticketPaymentSession = await firestoreDatabase().runTransaction(async (transaction) => {
        const sessionId = cancelTicketReservationRequest.ticketPaymentSessionId;

        const sessionDocRef = getTicketPaymentSessionDocRef(sessionId);

        const session = await getTicketPaymentSessionDataOrReturnNotFound(
            sessionId,
            response,
            transaction
        );
        if (!session) return;

        transaction.update(sessionDocRef, { status: 'canceled' } as TicketPaymentSession);

        return session;
    });

    if (!ticketPaymentSession) return;

    await stripe.paymentIntents.cancel(ticketPaymentSession.id);

    const event = await updateEventOnCancelReservation(
        ticketPaymentSession.eventId,
        ticketPaymentSession.isVip,
        response
    );

    if (!event) return;

    response.send();
}
