import * as functions from 'firebase-functions';
import { CancelTicketReservationRequest } from './cancel-ticket-reservation-request';
import {
    getTicketPaymentSessionDataOrReturnNotFound,
    getTicketPaymentSessionDocRef,
} from '../get-data/get-ticket-payment-session-data';
import { updateEventOnCancelReservation } from '../update-event/update-event-on-cancel-reservation';
import { stripe } from '../../modules/stripe-module';
import { TicketPaymentSession } from '../../models/ticket-payment-session';

export async function cancelTicketReservationOnCloudTaskCallback(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const cancelTicketReservationRequest = request.body as CancelTicketReservationRequest;

    const sessionId = cancelTicketReservationRequest.ticketPaymentSessionId;

    const session = await getTicketPaymentSessionDataOrReturnNotFound(sessionId, response);

    if (!session) return;

    const sessionDocRef = getTicketPaymentSessionDocRef(sessionId);

    await sessionDocRef.update({ status: 'canceled' } as TicketPaymentSession);

    await stripe.paymentIntents.cancel(session.id);

    const event = await updateEventOnCancelReservation({
        eventId: session.eventId,
        isVip: session.isVip,
        response,
        canceledAmount: session.amount + session.promotionCodeAmountOff,
    });

    if (!event) return;

    response.send();
}
