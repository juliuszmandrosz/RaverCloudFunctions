import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import Timestamp = firestore.Timestamp;
import {
    getCancelEventPaymentSessionDataOrUndefined,
    getCancelEventPaymentSessionDocRef,
} from '../get-data/get-cancel-event-payment-session';
import { tasksClient } from '../../modules/cloud-tasks-module';
import { getEventDataOrReturnNotFound } from '../get-data/get-event-data';
import { CancelEventPaymentSession } from '../../models/cancel-event-payment-session';
import { refundTicketsForUsers } from '../../stripe-functions/refund-tickets-for-users';
import { updateEventOnEventCancelation } from '../update-event/update-event-on-event-cancelation';
import { updateTicketsOnEventCancelation } from '../update-tickets/update-tickets-on-event-cancelation';
import { payoutToPartnerOnFulfillEventCancelationPayment } from '../../stripe-functions/pay-out-to-partner/payout-to-partner-on-fulfill-event-canelation-payment';

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

    const cancelPaymentSessionDocRef = getCancelEventPaymentSessionDocRef(
        cancelEventPaymentSession.id
    );

    await cancelPaymentSessionDocRef.update({
        status: 'succeeded',
        paymentDateTime: Timestamp.now(),
    } as CancelEventPaymentSession);

    const refundedSessions = await refundTicketsForUsers(event.id);

    await updateTicketsOnEventCancelation(refundedSessions.ticketSessions);

    await updateEventOnEventCancelation({ event, response });

    await payoutToPartnerOnFulfillEventCancelationPayment(event, response);
}
