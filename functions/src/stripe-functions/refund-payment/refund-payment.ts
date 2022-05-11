import { stripe } from '../../modules/stripe-module';

interface RefundPaymentParams {
    paymentIntentId: string;
    transferId: string;
}

export async function refundPayment({ paymentIntentId, transferId }: RefundPaymentParams) {
    await stripe.transfers.createReversal(transferId);
    await stripe.refunds.create({ payment_intent: paymentIntentId });
}
