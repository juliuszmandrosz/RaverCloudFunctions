import * as functions from 'firebase-functions';
import { throwUnauthenticatedError } from '../../errors/throw-unauthenticated-error';
import { tasksClient } from '../../modules/cloud-tasks-module';
import { CancelTicketReservationRequest } from './cancel-ticket-reservation-request';
import {
    getTicketPaymentSessionDocRef,
    tryGetTicketPaymentSessionData,
} from '../get-data/get-ticket-payment-session-data';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { updateEventOnCancelReservation } from '../update-event/update-event-on-cancel-reservation';

export async function cancelTicketReservationOnClosingPaymentSheet(
    data: CancelTicketReservationRequest,
    context: functions.https.CallableContext
): Promise<void> {
    if (!context.auth) {
        throwUnauthenticatedError();
    }

    const sessionId = data?.ticketPaymentSessionId;

    if (!sessionId) {
        const message = 'The function must be called with ticket payment session id';
        throw new functions.https.HttpsError('invalid-argument', message);
    }

    const session = await tryGetTicketPaymentSessionData(sessionId);

    const sessionDocRef = getTicketPaymentSessionDocRef(sessionId);

    await tasksClient.deleteTask({ name: session.cancelTicketReservationTaskId });

    await sessionDocRef.update({
        status: 'canceled',
    } as TicketPaymentSession);

    await updateEventOnCancelReservation({
        eventId: session.eventId,
        isVip: session.isVip,
        canceledAmount: session.amount + session.promotionCodeAmountOff,
    });
}
