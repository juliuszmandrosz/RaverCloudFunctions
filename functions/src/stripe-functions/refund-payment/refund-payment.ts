import { stripe } from '../../modules/stripe-module';

interface RefundPaymentParams {
    paymentIntentId: string;
}

export async function refundPayment({ paymentIntentId }: RefundPaymentParams) {
    await stripe.refunds.create({ payment_intent: paymentIntentId });
}
