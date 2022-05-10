import * as functions from 'firebase-functions';
import { Stripe } from 'stripe';
import { getFunctionsConfig } from '../utils/get-functions-config';
import { fulfillTicketPayment } from '../firestore-functions/fulfill-ticket-payment';
import { fulfillVipPayment } from '../firestore-functions/fulfill-vip-payment';
import { fulfillEventCancelationPayment } from '../firestore-functions/fulfill-event-cancelation-payment';
import { tryConstructStripeEvent } from '../utils/stripe-utils/try-construct-stripe-event';

export async function onPaymentIntentSucceeded(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const webhookSecret = getFunctionsConfig().stripe.pi_succeeded_secret;
    const stripeEvent = tryConstructStripeEvent(request, response, webhookSecret);

    if (!stripeEvent) return;

    const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;

    await fulfillTicketPayment(paymentIntent.id, response);

    await fulfillVipPayment(paymentIntent.id, response);

    await fulfillEventCancelationPayment(paymentIntent.id, response);

    response.send();
}
