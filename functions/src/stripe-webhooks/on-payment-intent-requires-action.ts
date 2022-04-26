import * as functions from 'firebase-functions';
import { tryConstructStripeEvent } from '../utils/try-construct-stripe-event';
import { Stripe } from 'stripe';
import { tasksClient } from '../modules/cloud-tasks-module';
import { createCancelTicketReservationTask } from '../cloud-tasks/create-cancel-ticket-reservation-task/create-cancel-ticket-reservation-task';
import { firestoreDatabase } from '../modules/firebase-admin-module';
import { TicketPaymentSession } from '../models/ticket-payment-session';
import {
    getTicketPaymentSessionDataOrReturnNotFound,
    getTicketPaymentSessionDocRef,
} from '../firestore-functions/get-data/get-ticket-payment-session-data';
import { getFunctionsConfig } from '../utils/get-functions-config';

export async function onPaymentIntentRequiresAction(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const webhookSecret = getFunctionsConfig().stripe.pi_requires_action_secret;
    const event = tryConstructStripeEvent(request, response, webhookSecret);

    if (!event) return;

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await firestoreDatabase().runTransaction(async (transaction) => {
        const ticketPaymentDocRef = getTicketPaymentSessionDocRef(paymentIntent.id);

        const ticketPaymentSession = await getTicketPaymentSessionDataOrReturnNotFound(
            paymentIntent.id,
            response,
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

    response.send();
}
