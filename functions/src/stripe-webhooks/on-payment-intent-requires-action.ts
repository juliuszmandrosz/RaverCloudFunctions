import * as functions from 'firebase-functions';
import { Stripe } from 'stripe';
import { getFunctionsConfig } from '../utils/get-functions-config';
import { tryConstructStripeEvent } from '../utils/stripe-utils/try-construct-stripe-event';
import { extendTicketPaymentSession } from '../firestore-functions/extend-payment-session/extend-ticket-payment-session';
import { extendCancelEventPaymentSession } from '../firestore-functions/extend-payment-session/extend-cancel-event-payment-session';
import { extendEventPostponePaymentSession } from '../firestore-functions/extend-payment-session/extend-event-postpone-payment-session';

export async function onPaymentIntentRequiresAction(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const webhookSecret = getFunctionsConfig().stripe.pi_requires_action_secret;
    const event = tryConstructStripeEvent(request, response, webhookSecret);

    if (!event) return;

    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    await extendTicketPaymentSession(paymentIntent.id);

    await extendCancelEventPaymentSession(paymentIntent.id);

    await extendEventPostponePaymentSession(paymentIntent.id);

    response.send();
}
