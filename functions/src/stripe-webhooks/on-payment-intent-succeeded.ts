import * as functions from 'firebase-functions';
import { tryConstructStripeEvent } from '../utils/try-construct-stripe-event';
import { Stripe } from 'stripe';
import { fulfillTicketPayment } from '../firestore-functions/fulfill-ticket-payment';
import { fulfillVipPayment } from '../firestore-functions/fulfill-vip-payment';
import { getTicketPaymentSessionDataOrUndefined } from '../firestore-functions/get-data/get-ticket-payment-session-data';
import { getVipPaymentSessionDataOrReturnNotFound } from '../firestore-functions/get-data/get-vip-payment-session.data';
import { getFunctionsConfig } from '../utils/get-functions-config';
import { VipPaymentSession } from '../models/vip-payment-session';

export async function onPaymentIntentSucceeded(
    request: functions.https.Request,
    response: functions.Response
): Promise<void> {
    const webhookSecret = getFunctionsConfig().stripe.pi_succeeded_secret;
    const stripeEvent = tryConstructStripeEvent(request, response, webhookSecret);

    if (!stripeEvent) return;

    const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;

    const ticketPaymentSession = await getTicketPaymentSessionDataOrUndefined(paymentIntent.id);

    let vipPaymentSession: VipPaymentSession | undefined;

    if (!ticketPaymentSession) {
        vipPaymentSession = await getVipPaymentSessionDataOrReturnNotFound(
            paymentIntent.id,
            response
        );
    }

    if (!ticketPaymentSession && !vipPaymentSession) return;

    if (ticketPaymentSession) {
        const ticket = await fulfillTicketPayment(ticketPaymentSession, response);

        if (ticket) response.send();

        return;
    }

    if (vipPaymentSession) {
        const ticket = await fulfillVipPayment(vipPaymentSession, response);
        if (!ticket) return;
    }

    response.send();
}
