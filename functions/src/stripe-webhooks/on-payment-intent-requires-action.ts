import * as functions from 'firebase-functions';
import { tryConstructStripeEvent } from '../utils/try-construct-stripe-event';
import { Stripe } from 'stripe';
import { tasksClient } from '../modules/cloud-tasks-module';
import { createCancelTicketReservationTask } from '../cloud-tasks/create-cancel-ticket-reservation-task/create-cancel-ticket-reservation-task';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { TicketPaymentSession } from '../models/ticket-payment-session';
import {
    getTicketPaymentSessionDataOrUndefined,
    getTicketPaymentSessionDocRef,
} from '../firestore-functions/get-data/get-ticket-payment-session-data';
import { getFunctionsConfig } from '../utils/get-functions-config';
import {
    getCancelEventPaymentSessionDataOrUndefined,
    getCancelEventPaymentSessionDocRef,
} from '../firestore-functions/get-data/get-cancel-event-payment-session';
import { createCancelEventCancelationTask } from '../cloud-tasks/create-cancel-event-cancelation-task/create-cancel-event-cancelation-task';
import { CancelEventPaymentSession } from '../models/cancel-event-payment-session';

export async function onPaymentIntentRequiresAction(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const webhookSecret = getFunctionsConfig().stripe.pi_requires_action_secret;
    const event = tryConstructStripeEvent(request, response, webhookSecret);

    if (!event) return;

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await runTransactionForTicketPayment(paymentIntent.id);

    await runTransactionForCancelEventPayment(paymentIntent.id);

    response.send();
}

async function runTransactionForTicketPayment(paymentIntentId: string) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const ticketPaymentDocRef = getTicketPaymentSessionDocRef(paymentIntentId);

        const ticketPaymentSession = await getTicketPaymentSessionDataOrUndefined(
            paymentIntentId,
            transaction
        );

        if (ticketPaymentSession) {
            await tasksClient.deleteTask({
                name: ticketPaymentSession.cancelTicketReservationTaskId,
            });

            const cancelTicketReservationTaskId = await createCancelTicketReservationTask({
                ticketPaymentSessionId: ticketPaymentSession.id,
                expirationTimeInSeconds: 900,
            });

            transaction.update(ticketPaymentDocRef, {
                status: 'requires_action',
                cancelTicketReservationTaskId,
            } as TicketPaymentSession);
        }
    });
}

async function runTransactionForCancelEventPayment(paymentIntentId: string) {
    await firestoreDatabase().runTransaction(async (transaction) => {
        const cancelEventPaymentDocRef = getCancelEventPaymentSessionDocRef(paymentIntentId);

        const cancelEventPaymentSession = await getCancelEventPaymentSessionDataOrUndefined(
            paymentIntentId,
            transaction
        );

        if (cancelEventPaymentSession) {
            await tasksClient.deleteTask({
                name: cancelEventPaymentSession.cancelEventCancelationTaskId,
            });

            const cancelEventCancelationTaskId = await createCancelEventCancelationTask({
                cancelEventPaymentSessionId: cancelEventPaymentSession.id,
                expirationTimeInSeconds: 900,
            });

            transaction.update(cancelEventPaymentDocRef, {
                status: 'requires_action',
                cancelEventCancelationTaskId,
            } as CancelEventPaymentSession);
        }
    });
}
