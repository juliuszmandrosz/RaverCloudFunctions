import { Stripe } from 'stripe';
import * as functions from 'firebase-functions';
import { stripe } from '../../modules/stripe-module';

export function tryConstructStripeEvent(
    request: functions.https.Request,
    response: functions.Response,
    webhookSecret: string
) {
    const signature = request.headers['stripe-signature'];

    if (!signature) {
        response.status(400).send('Stripe signature is missing in headers');
        return;
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(request.rawBody, signature, webhookSecret);
    } catch (e) {
        const stripeError = e as Stripe.errors.StripeSignatureVerificationError;
        response.status(400).send(`Webhook Error: ${stripeError?.message ?? e}`);
        return;
    }

    return event;
}
