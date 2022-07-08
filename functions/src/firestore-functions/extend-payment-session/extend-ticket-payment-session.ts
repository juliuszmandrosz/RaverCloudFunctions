import {
    getTicketPaymentSessionDataOrUndefined,
    getTicketPaymentSessionDocRef,
} from '../get-data/get-ticket-payment-session-data';
import { tasksClient } from '../../modules/cloud-tasks-module';
import { createCancelTicketReservationTask } from '../../cloud-tasks/create-cancel-ticket-reservation-task/create-cancel-ticket-reservation-task';
import { TicketPaymentSession } from '../../models/ticket-payment-session';
import { toJson } from '../../utils/json-utils';

export async function extendTicketPaymentSession(paymentIntentId: string) {
    const ticketPaymentSession = await getTicketPaymentSessionDataOrUndefined(paymentIntentId);

    if (!ticketPaymentSession) return;

    const ticketPaymentDocRef = getTicketPaymentSessionDocRef(paymentIntentId);

    await tasksClient.deleteTask({
        name: ticketPaymentSession.cancelTicketReservationTaskId,
    });

    const cancelTicketReservationTaskId = await createCancelTicketReservationTask({
        ticketPaymentSessionId: ticketPaymentSession.id,
        expirationTimeInSeconds: 900,
    });

    await ticketPaymentDocRef.update(
        toJson({
            status: 'requires_action',
            cancelTicketReservationTaskId,
        } as TicketPaymentSession)
    );
}
